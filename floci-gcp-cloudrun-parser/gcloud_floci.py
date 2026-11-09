#!/usr/bin/env python3
"""
Floci-GCP Cloud Run Admin API v2 Complete CLI Parser.
Mengakomodir seluruh fitur yang diemulasi oleh floci-gcp Cloud Run:
- Services (+ Revisions, IAM, Deploy/Upsert, LRO, Host DNS injection)
- Jobs (+ Executions, Tasks, Run Overrides, Execution Tokens, IAM)
- Worker Pools (+ Revisions, Manual Scaling, Instance Splits, IAM)
- Instances (+ Start, Stop, Top-level Containers/Volumes, IAM, Host DNS injection)
- Operations (List, Get/Describe, Wait, Delete LRO)
"""

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from urllib.parse import urlparse

def detect_floci_ip(default_ip="10.23.23.1"):
    """Mendeteksi IP floci-gcp dari /etc/hosts secara otomatis jika tersedia."""
    try:
        with open("/etc/hosts", "r", encoding="utf-8") as f:
            for line in f:
                stripped = line.strip()
                if not stripped or stripped.startswith("#"):
                    continue
                parts = stripped.split()
                if len(parts) >= 2 and "floci-gcp" in parts[1:]:
                    return parts[0]
    except Exception:
        pass
    return default_ip


# Konfigurasi Default (dapat di-override via ENV atau argumen CLI)
VPN_IP = os.environ.get("FLOCI_VPN_IP", detect_floci_ip())
FLOCI_URL = os.environ.get("FLOCI_URL", "http://floci-gcp:4588")
PROJECT = os.environ.get("FLOCI_PROJECT", "floci-local")


def inject_hosts(hostname, vpn_ip=VPN_IP, skip_hosts=False):
    """Menyuntikkan hostname Cloud Run ke /etc/hosts jika belum ada."""
    if skip_hosts or not hostname:
        return
    hosts_path = "/etc/hosts"
    try:
        with open(hosts_path, "r", encoding="utf-8") as f:
            content = f.read()
            if hostname in content:
                return
        if os.geteuid() != 0:
            print(
                f"⚠️  Lewati injeksi /etc/hosts untuk '{hostname}' (jalankan dengan sudo atau tambahkan manual: {vpn_ip} {hostname})"
            )
            return
        with open(hosts_path, "a", encoding="utf-8") as f:
            f.write(f"{vpn_ip}\t{hostname}\n")
        print(f"📝 DNS lokal disuntikkan: '{hostname}' -> {vpn_ip}")
    except Exception as e:
        print(f"⚠️  Gagal menulis ke /etc/hosts: {e}")


def remove_hosts(hostname=None, resource_id=None, region=None, skip_hosts=False):
    """Menghapus hostname Cloud Run dari /etc/hosts saat service/instance dihapus."""
    if skip_hosts or (not hostname and not resource_id):
        return
    hosts_path = "/etc/hosts"
    try:
        with open(hosts_path, "r", encoding="utf-8") as f:
            lines = f.readlines()

        new_lines = []
        removed_hosts = []
        prefix_pattern = f"{resource_id}-" if resource_id else None
        region_pattern = f".{region}.run." if region else ".run."

        for line in lines:
            stripped = line.strip()
            if not stripped or stripped.startswith("#"):
                new_lines.append(line)
                continue

            parts = stripped.split()
            host_tokens = parts[1:] if len(parts) > 1 else []
            matched = False

            for h in host_tokens:
                if hostname and h == hostname:
                    matched = True
                    removed_hosts.append(h)
                    break
                if prefix_pattern and h.startswith(prefix_pattern) and region_pattern in h:
                    matched = True
                    removed_hosts.append(h)
                    break

            if not matched:
                new_lines.append(line)

        if not removed_hosts:
            return

        if os.geteuid() != 0:
            print(
                f"⚠️  Lewati penghapusan /etc/hosts untuk '{', '.join(removed_hosts)}' (jalankan dengan sudo)"
            )
            return

        with open(hosts_path, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
        for rh in removed_hosts:
            print(f"🧹 DNS lokal dihapus dari /etc/hosts: '{rh}'")
    except Exception as e:
        print(f"⚠️  Gagal memperbarui /etc/hosts: {e}")


def build_query(params):
    """Membangun query string dari dictionary dengan mengabaikan nilai None/kosong."""
    filtered = {k: v for k, v in params.items() if v is not None and v != ""}
    if not filtered:
        return ""
    # Konversi boolean ke lowercase string ("true" / "false") sesuai standar REST GCP
    for k, v in filtered.items():
        if isinstance(v, bool):
            filtered[k] = "true" if v else "false"
    return "?" + urllib.parse.urlencode(filtered)


def make_request(
    method,
    endpoint,
    payload=None,
    query_params=None,
    base_url=FLOCI_URL,
    project=PROJECT,
    token=None,
    allow_error=False,
):
    """
    Melakukan HTTP request ke endpoint Cloud Run v2 di floci-gcp.
    Memperbaiki bug pemanggilan urlopen ganda pada versi sebelumnya.
    """
    query_str = build_query(query_params or {})
    if endpoint.startswith("http://") or endpoint.startswith("https://"):
        url = f"{endpoint}{query_str}"
    elif endpoint.startswith("/"):
        url = f"{base_url.rstrip('/')}{endpoint}{query_str}"
    else:
        url = f"{base_url.rstrip('/')}/v2/projects/{project}/locations/{endpoint}{query_str}"

    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req) as response:
            raw_body = response.read().decode("utf-8")
            if response.status in (200, 201, 202):
                return json.loads(raw_body) if raw_body.strip() else {}
            return {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        if allow_error:
            raise e
        print(f"❌ API Error (HTTP {e.code}) [{method} {url}]: {err_body}")
        sys.exit(1)
    except Exception as e:
        if allow_error:
            raise e
        print(f"❌ Kesalahan Sistem [{method} {url}]: {e}")
        sys.exit(1)


def wait_for_operation(op_data, region, args, timeout_sec=300):
    """
    Menunggu google.longrunning.Operation sampai done=true jika operasi bersifat asinkron.
    """
    if not isinstance(op_data, dict):
        return op_data
    # Jika bukan LRO atau sudah selesai, kembalikan langsung
    if "done" not in op_data and not op_data.get("name", "").startswith("projects/"):
        return op_data
    if op_data.get("done") is True or not args.wait:
        if op_data.get("error"):
            err = op_data["error"]
            print(f"❌ Operasi gagal (code {err.get('code')}): {err.get('message')}")
            sys.exit(1)
        return op_data

    op_name = op_data.get("name", "")
    if not op_name:
        return op_data

    print(f"⏳ Menunggu operasi '{op_name}' selesai...")
    deadline = time.time() + timeout_sec
    while time.time() < deadline:
        current = make_request(
            "GET",
            f"/v2/{op_name}",
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        if current.get("done") is True:
            if current.get("error"):
                err = current["error"]
                print(f"❌ Operasi gagal (code {err.get('code')}): {err.get('message')}")
                sys.exit(1)
            return current
        time.sleep(1.0)

    print(f"⚠️  Timeout menunggu operasi '{op_name}' setelah {timeout_sec} detik.")
    return op_data


def extract_resource_from_lro(result):
    """Mengekstrak resource (Service/Job/WorkerPool/Instance/Execution) dari LRO atau response langsung."""
    if not isinstance(result, dict):
        return {}
    if "response" in result and isinstance(result["response"], dict):
        return result["response"]
    if "metadata" in result and isinstance(result["metadata"], dict):
        return result["metadata"]
    return result


# =====================================================================
# PARSER HELPERS (ENV, VOLUMES, MOUNTS, CONTAINERS, SPLITS, IAM)
# =====================================================================


def parse_kv_pairs(kv_string):
    """Mem-parsing string 'K1=V1,K2=V2' menjadi dict."""
    result = {}
    if not kv_string:
        return result
    for pair in kv_string.split(","):
        pair = pair.strip()
        if "=" in pair:
            k, v = pair.split("=", 1)
            result[k.strip()] = v.strip()
    return result


def parse_env_vars(env_list):
    """
    Format: KEY=VALUE,KEY2=VALUE2 (bisa dipanggil berulang kali dengan --set-env-vars).
    Catatan: floci-gcp menolak env valueSource di execution mode.
    """
    envs = {}
    if not env_list:
        return []
    items = env_list if isinstance(env_list, list) else [env_list]
    for env_string in items:
        if not env_string:
            continue
        for pair in env_string.split(","):
            if "=" in pair:
                k, v = pair.split("=", 1)
                envs[k.strip()] = v.strip()
    return [{"name": k, "value": v} for k, v in envs.items()]


def parse_volumes(vol_list):
    """
    Format: name=vol1,type=cloud-storage,bucket=my-bucket[,readonly=true]
    Sesuai floci-gcp: hanya GCS volumes yang didukung di execution mode, mountOptions ditolak.
    """
    volumes = []
    if not vol_list:
        return volumes
    items = vol_list if isinstance(vol_list, list) else [vol_list]
    for vol_string in items:
        if not vol_string:
            continue
        v_dict = parse_kv_pairs(vol_string)
        if "mount-options" in v_dict or "mountOptions" in v_dict:
            print("❌ Error: floci-gcp menolak 'mountOptions' pada GCS volume.")
            sys.exit(1)
        vol_type = v_dict.get("type", "cloud-storage")
        if vol_type != "cloud-storage":
            print(
                f"❌ Error: floci-gcp execution mode hanya mendukung volume type=cloud-storage (diterima: {vol_type})."
            )
            sys.exit(1)
        gcs_cfg = {"bucket": v_dict.get("bucket")}
        ro_val = v_dict.get("readonly", v_dict.get("read-only", v_dict.get("readOnly")))
        if ro_val is not None:
            gcs_cfg["readOnly"] = str(ro_val).lower() in ("true", "1", "yes")
        volumes.append({"name": v_dict.get("name"), "gcs": gcs_cfg})
    return volumes


def parse_mounts(mount_list):
    """
    Format: volume=vol1,mount-path=/mnt/data[,sub-path=subdir]
    Mendukung subPath sesuai dokumentasi floci-gcp.
    """
    mounts = []
    if not mount_list:
        return mounts
    items = mount_list if isinstance(mount_list, list) else [mount_list]
    for mount_string in items:
        if not mount_string:
            continue
        m_dict = parse_kv_pairs(mount_string)
        mount_entry = {
            "name": m_dict.get("volume") or m_dict.get("name"),
            "mountPath": m_dict.get("mount-path") or m_dict.get("mountPath"),
        }
        sub_path = m_dict.get("sub-path") or m_dict.get("subPath")
        if sub_path:
            mount_entry["subPath"] = sub_path
        mounts.append(mount_entry)
    return mounts


def parse_instance_splits(split_string):
    """
    Format untuk Worker Pools:
    LATEST=100 atau rev1=60,rev2=40
    """
    if not split_string:
        return []
    splits = []
    pairs = parse_kv_pairs(split_string)
    for target, pct_str in pairs.items():
        pct = int(pct_str)
        if target.upper() == "LATEST":
            splits.append(
                {
                    "type": "INSTANCE_SPLIT_ALLOCATION_TYPE_LATEST",
                    "percent": pct,
                }
            )
        else:
            splits.append(
                {
                    "type": "INSTANCE_SPLIT_ALLOCATION_TYPE_REVISION",
                    "revision": target,
                    "percent": pct,
                }
            )
    return splits


def build_container(args, include_port=True):
    """Membangun struktur Container Cloud Run v2 sesuai batasan floci-gcp."""
    container = {}
    if args.image:
        container["image"] = args.image
    if args.container_name:
        container["name"] = args.container_name
    if args.command_bin:
        container["command"] = [c.strip() for c in args.command_bin.split(",") if c.strip()]
    if args.args:
        container["args"] = [a.strip() for a in args.args.split(",") if a.strip()]
    if args.working_dir:
        container["workingDir"] = args.working_dir

    limits = {}
    if args.memory:
        limits["memory"] = args.memory
    if args.cpu:
        limits["cpu"] = args.cpu
    if limits:
        container["resources"] = {"limits": limits}

    if include_port and args.port:
        port_obj = {"containerPort": args.port}
        if args.port_name:
            port_obj["name"] = args.port_name
        container["ports"] = [port_obj]

    envs = parse_env_vars(args.set_env_vars)
    if envs:
        container["env"] = envs

    mounts = parse_mounts(args.add_volume_mount)
    if mounts:
        container["volumeMounts"] = mounts

    return container


def apply_common_metadata(payload, args):
    """Menambahkan labels, annotations, client, clientVersion, launchStage bila diset."""
    if args.labels:
        payload["labels"] = parse_kv_pairs(args.labels)
    if args.annotations:
        payload["annotations"] = parse_kv_pairs(args.annotations)
    if args.client:
        payload["client"] = args.client
    if args.client_version:
        payload["clientVersion"] = args.client_version
    if args.launch_stage:
        payload["launchStage"] = args.launch_stage
    if args.description:
        payload["description"] = args.description


# =====================================================================
# IAM HELPER (Services, Jobs, Worker Pools, Instances)
# =====================================================================


def handle_iam_action(action, resource_path, args):
    """
    Menangani operasi IAM (:getIamPolicy, :setIamPolicy, :testIamPermissions)
    yang didukung oleh Services, Jobs, Worker Pools, dan Instances.
    """
    if action == "get-iam-policy":
        res = make_request(
            "GET",
            f"{resource_path}:getIamPolicy",
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        print(json.dumps(res, indent=2))
        return True

    elif action == "set-iam-policy":
        policy_body = {}
        if args.policy_file:
            with open(args.policy_file, "r", encoding="utf-8") as f:
                loaded = json.load(f)
                policy_body = loaded if "policy" in loaded else {"policy": loaded}
        elif args.member and args.role:
            binding = {"role": args.role, "members": [args.member]}
            if args.condition_expression:
                binding["condition"] = {
                    "title": args.condition_title or "condition",
                    "expression": args.condition_expression,
                }
            policy_body = {"policy": {"bindings": [binding]}}
        else:
            print("❌ Untuk set-iam-policy, berikan --policy-file atau (--member dan --role).")
            sys.exit(1)

        res = make_request(
            "POST",
            f"{resource_path}:setIamPolicy",
            payload=policy_body,
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        print("✅ IAM Policy berhasil diperbarui:")
        print(json.dumps(res, indent=2))
        return True

    elif action == "test-iam-permissions":
        perms = [p.strip() for p in (args.permissions or "").split(",") if p.strip()]
        if not perms:
            print("❌ Berikan daftar permission dengan --permissions (dipisahkan koma).")
            sys.exit(1)
        res = make_request(
            "POST",
            f"{resource_path}:testIamPermissions",
            payload={"permissions": perms},
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        print(json.dumps(res, indent=2))
        return True

    return False


# =====================================================================
# 1. SERVICES & SERVICE REVISIONS HANDLER
# =====================================================================


def build_service_payload(args):
    container = build_container(args, include_port=True)
    template = {}
    if container:
        template["containers"] = [container]
    if args.add_volume:
        template["volumes"] = parse_volumes(args.add_volume)
    if args.timeout:
        template["timeout"] = args.timeout
    if args.service_account:
        template["serviceAccount"] = args.service_account
    if args.execution_environment:
        template["executionEnvironment"] = args.execution_environment

    payload = {}
    if template:
        payload["template"] = template
    if args.ingress:
        payload["ingress"] = args.ingress
    apply_common_metadata(payload, args)
    return payload


def handle_service_revisions(args, tokens):
    """
    Menangani:
    - gcloud run revisions list [--service <svc>]
    - gcloud run revisions describe <revision> --service <svc>
    - gcloud run revisions delete <revision> --service <svc>
    """
    action = tokens[0] if tokens else "list"
    service_id = args.service or "-"

    if action == "list":
        query = {"pageSize": args.page_size, "pageToken": args.page_token}
        res = make_request(
            "GET",
            f"{args.region}/services/{service_id}/revisions",
            query_params=query,
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        revs = res.get("revisions", [])
        print(f"📋 Daftar Revisions untuk service '{service_id}' di {args.region}:")
        for r in revs:
            name = r.get("name", "").split("/")[-1]
            img = (r.get("containers") or [{}])[0].get("image", "-")
            print(f" - {name} | Image: {img}")
        if args.json:
            print(json.dumps(res, indent=2))

    elif action in ("describe", "get"):
        if len(tokens) < 2:
            print("❌ Masukkan nama revision: run revisions describe <revision> [--service <svc>]")
            sys.exit(1)
        rev_id = tokens[1]
        if service_id == "-" and "-" in rev_id:
            service_id = rev_id.rsplit("-", 1)[0]
        res = make_request(
            "GET",
            f"{args.region}/services/{service_id}/revisions/{rev_id}",
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        print(json.dumps(res, indent=2))

    elif action == "delete":
        if len(tokens) < 2:
            print("❌ Masukkan nama revision: run revisions delete <revision> [--service <svc>]")
            sys.exit(1)
        rev_id = tokens[1]
        if service_id == "-" and "-" in rev_id:
            service_id = rev_id.rsplit("-", 1)[0]
        query = {"validateOnly": args.validate_only, "etag": args.etag}
        print(f"🗑️  Menghapus revision '{rev_id}' dari service '{service_id}'...")
        op = make_request(
            "DELETE",
            f"{args.region}/services/{service_id}/revisions/{rev_id}",
            query_params=query,
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        wait_for_operation(op, args.region, args)
        print("✅ Revision terhapus!")
    else:
        print(f"❌ Aksi revisions '{action}' tidak dikenal. Gunakan: list, describe, delete.")
        sys.exit(1)


def handle_services(args):
    # Normalisasi token command:
    # 'run deploy <svc>' -> action='deploy', target='<svc>'
    # 'run services <action> [<svc>]'
    if args.command[1] == "deploy":
        action = "deploy"
        target = args.command[2] if len(args.command) > 2 else args.service
    else:
        action = args.command[2] if len(args.command) > 2 else "list"
        if action == "revisions":
            handle_service_revisions(args, args.command[3:])
            return
        target = args.command[3] if len(args.command) > 3 else args.service

    if action in ("get-iam-policy", "set-iam-policy", "test-iam-permissions"):
        if not target:
            print(f"❌ Masukkan nama service untuk {action}.")
            sys.exit(1)
        handle_iam_action(action, f"{args.region}/services/{target}", args)
        return

    if action in ("deploy", "create"):
        if not target:
            print("❌ Masukkan nama service: gcloud run deploy <service> --image <image>")
            sys.exit(1)
        payload = build_service_payload(args)
        query = {"serviceId": target, "validateOnly": args.validate_only}
        print(f"📦 Mendeploy service '{target}' ke floci-gcp ({args.region})...")

        try:
            op = make_request(
                "POST",
                f"{args.region}/services",
                payload=payload,
                query_params=query,
                base_url=args.floci_url,
                project=args.project,
                token=args.token,
                allow_error=True,
            )
        except urllib.error.HTTPError as e:
            if e.code == 409 and action == "deploy":
                print(f"🔄 Service '{target}' sudah ada, melakukan update (PATCH)...")
                patch_query = {
                    "updateMask": args.update_mask,
                    "validateOnly": args.validate_only,
                }
                op = make_request(
                    "PATCH",
                    f"{args.region}/services/{target}",
                    payload=payload,
                    query_params=patch_query,
                    base_url=args.floci_url,
                    project=args.project,
                    token=args.token,
                )
            else:
                err_body = e.read().decode("utf-8", errors="replace")
                print(f"❌ API Error (HTTP {e.code}): {err_body}")
                sys.exit(1)

        op = wait_for_operation(op, args.region, args)
        svc = extract_resource_from_lro(op)
        url = svc.get("uri")
        if not url and not args.validate_only:
            svc = make_request(
                "GET",
                f"{args.region}/services/{target}",
                base_url=args.floci_url,
                project=args.project,
                token=args.token,
            )
            url = svc.get("uri")

        # Jika --allow-unauthenticated diberikan, tambahkan allUsers sebagai roles/run.invoker
        if args.allow_unauthenticated and not args.validate_only:
            make_request(
                "POST",
                f"{args.region}/services/{target}:setIamPolicy",
                payload={
                    "policy": {
                        "bindings": [{"role": "roles/run.invoker", "members": ["allUsers"]}]
                    }
                },
                base_url=args.floci_url,
                project=args.project,
                token=args.token,
            )

        if url:
            print(f"✅ Sukses! URL Layanan: {url}")
            inject_hosts(urlparse(url).hostname, args.vpn_ip, args.no_hosts)
        else:
            print("✅ Operasi deploy selesai.")
        if args.json:
            print(json.dumps(svc, indent=2))

    elif action == "update":
        if not target:
            print("❌ Masukkan nama service: gcloud run services update <service>")
            sys.exit(1)
        payload = build_service_payload(args)
        # Jika tidak ada container di args namun update dieksekusi, ambil service eksisting bila perlu
        if "template" not in payload:
            existing = make_request(
                "GET",
                f"{args.region}/services/{target}",
                base_url=args.floci_url,
                project=args.project,
                token=args.token,
            )
            payload["template"] = existing.get("template", {})
        query = {"updateMask": args.update_mask, "validateOnly": args.validate_only}
        print(f"🔧 Mengupdate service '{target}'...")
        op = make_request(
            "PATCH",
            f"{args.region}/services/{target}",
            payload=payload,
            query_params=query,
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        op = wait_for_operation(op, args.region, args)
        svc = extract_resource_from_lro(op)
        print(f"✅ Service '{target}' berhasil diupdate!")
        if args.json:
            print(json.dumps(svc, indent=2))

    elif action in ("describe", "get"):
        if not target:
            print("❌ Masukkan nama service: gcloud run services describe <service>")
            sys.exit(1)
        svc = make_request(
            "GET",
            f"{args.region}/services/{target}",
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        print(json.dumps(svc, indent=2))

    elif action == "delete":
        if not target:
            print("❌ Masukkan nama service: gcloud run services delete <service>")
            sys.exit(1)
        query = {"validateOnly": args.validate_only, "etag": args.etag}
        print(f"🗑️  Menghapus service '{target}'...")
        op = make_request(
            "DELETE",
            f"{args.region}/services/{target}",
            query_params=query,
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        op = wait_for_operation(op, args.region, args)
        if not args.validate_only:
            deleted_svc = extract_resource_from_lro(op)
            del_url = deleted_svc.get("uri")
            del_host = urlparse(del_url).hostname if del_url else None
            remove_hosts(
                hostname=del_host,
                resource_id=target,
                region=args.region,
                skip_hosts=args.no_hosts,
            )
        print("✅ Service terhapus!")

    elif action == "list":
        query = {"pageSize": args.page_size, "pageToken": args.page_token}
        result = make_request(
            "GET",
            f"{args.region}/services",
            query_params=query,
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        services = result.get("services", [])
        print(f"📋 Daftar Services di {args.region}:")
        for s in services:
            name = s.get("name", "").split("/")[-1]
            uri = s.get("uri", "No URL")
            ready = s.get("latestReadyRevision", "").split("/")[-1] or "reconciling"
            print(f" - {name} | {uri} | ReadyRev: {ready}")
        if args.json:
            print(json.dumps(result, indent=2))

    else:
        print(
            f"❌ Aksi service '{action}' tidak dikenal. Gunakan: deploy, create, update, describe, list, delete, revisions, get-iam-policy, set-iam-policy, test-iam-permissions."
        )
        sys.exit(1)


# =====================================================================
# 2. JOBS, EXECUTIONS, & TASKS HANDLER
# =====================================================================


def build_job_payload(args):
    container = build_container(args, include_port=True)
    task_template = {}
    if container:
        task_template["containers"] = [container]
    if args.add_volume:
        task_template["volumes"] = parse_volumes(args.add_volume)
    if args.max_retries is not None:
        task_template["maxRetries"] = args.max_retries
    if args.timeout:
        task_template["timeout"] = args.timeout
    if args.service_account:
        task_template["serviceAccount"] = args.service_account
    if args.execution_environment:
        task_template["executionEnvironment"] = args.execution_environment

    exec_template = {}
    if task_template:
        exec_template["template"] = task_template
    if args.tasks is not None:
        exec_template["taskCount"] = args.tasks
    if args.parallelism is not None:
        exec_template["parallelism"] = args.parallelism

    payload = {}
    if exec_template:
        payload["template"] = exec_template
    if args.start_execution_token:
        payload["startExecutionToken"] = args.start_execution_token
    if args.run_execution_token:
        payload["runExecutionToken"] = args.run_execution_token

    apply_common_metadata(payload, args)
    return payload


def handle_job_tasks(args, tokens):
    """
    Menangani:
    - gcloud run jobs tasks list [--job <job>] [--execution <exec>]
    - gcloud run jobs tasks describe <task> --job <job> --execution <exec>
    (Mendukung wildcard '-' untuk job dan execution sesuai dokumentasi floci-gcp)
    """
    action = tokens[0] if tokens else "list"
    job_id = args.job or "-"
    exec_id = args.execution or "-"

    if action == "list":
        query = {"pageSize": args.page_size, "pageToken": args.page_token}
        res = make_request(
            "GET",
            f"{args.region}/jobs/{job_id}/executions/{exec_id}/tasks",
            query_params=query,
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        tasks = res.get("tasks", [])
        print(f"📋 Daftar Tasks (job='{job_id}', execution='{exec_id}'):")
        for t in tasks:
            t_name = t.get("name", "").split("/")[-1]
            idx = t.get("index", 0)
            retried = t.get("retried", 0)
            last_res = t.get("lastAttemptResult", {})
            exit_code = last_res.get("exitCode", 0)
            status_msg = last_res.get("status", {}).get("message", "OK")
            print(
                f" - {t_name} (index={idx}, retried={retried}, exitCode={exit_code}, status={status_msg})"
            )
        if args.json:
            print(json.dumps(res, indent=2))

    elif action in ("describe", "get"):
        if len(tokens) < 2:
            print(
                "❌ Masukkan nama task: gcloud run jobs tasks describe <task> --job <job> --execution <exec>"
            )
            sys.exit(1)
        task_id = tokens[1]
        res = make_request(
            "GET",
            f"{args.region}/jobs/{job_id}/executions/{exec_id}/tasks/{task_id}",
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        print(json.dumps(res, indent=2))
    else:
        print(f"❌ Aksi tasks '{action}' tidak dikenal. Gunakan: list, describe.")
        sys.exit(1)


def handle_job_executions(args, tokens):
    """
    Menangani:
    - gcloud run jobs executions list [--job <job>]
    - gcloud run jobs executions describe <execution> [--job <job>]
    - gcloud run jobs executions delete <execution> [--job <job>]
    - gcloud run jobs executions cancel <execution> [--job <job>]
    - gcloud run jobs executions tasks ...
    """
    action = tokens[0] if tokens else "list"
    if action == "tasks":
        handle_job_tasks(args, tokens[1:])
        return

    job_id = args.job or "-"

    if action == "list":
        query = {"pageSize": args.page_size, "pageToken": args.page_token}
        res = make_request(
            "GET",
            f"{args.region}/jobs/{job_id}/executions",
            query_params=query,
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        execs = res.get("executions", [])
        print(f"📋 Daftar Executions untuk job '{job_id}' di {args.region}:")
        for ex in execs:
            name = ex.get("name", "").split("/")[-1]
            succ = ex.get("succeededCount", 0)
            fail = ex.get("failedCount", 0)
            run_c = ex.get("runningCount", 0)
            print(f" - {name} | Running: {run_c}, Succeeded: {succ}, Failed: {fail}")
        if args.json:
            print(json.dumps(res, indent=2))

    elif action in ("describe", "get"):
        if len(tokens) < 2:
            print("❌ Masukkan nama execution: gcloud run jobs executions describe <execution>")
            sys.exit(1)
        exec_id = tokens[1]
        if job_id == "-" and "-" in exec_id:
            job_id = exec_id.rsplit("-", 1)[0]
        res = make_request(
            "GET",
            f"{args.region}/jobs/{job_id}/executions/{exec_id}",
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        print(json.dumps(res, indent=2))

    elif action == "delete":
        if len(tokens) < 2:
            print("❌ Masukkan nama execution: gcloud run jobs executions delete <execution>")
            sys.exit(1)
        exec_id = tokens[1]
        if job_id == "-" and "-" in exec_id:
            job_id = exec_id.rsplit("-", 1)[0]
        query = {"validateOnly": args.validate_only, "etag": args.etag}
        print(f"🗑️  Menghapus execution '{exec_id}' (job '{job_id}')...")
        op = make_request(
            "DELETE",
            f"{args.region}/jobs/{job_id}/executions/{exec_id}",
            query_params=query,
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        wait_for_operation(op, args.region, args)
        print("✅ Execution terhapus!")

    elif action == "cancel":
        if len(tokens) < 2:
            print("❌ Masukkan nama execution: gcloud run jobs executions cancel <execution>")
            sys.exit(1)
        exec_id = tokens[1]
        if job_id == "-" and "-" in exec_id:
            job_id = exec_id.rsplit("-", 1)[0]
        body = {}
        if args.validate_only:
            body["validateOnly"] = True
        if args.etag:
            body["etag"] = args.etag
        print(f"🛑 Membatalkan execution '{exec_id}' (job '{job_id}')...")
        op = make_request(
            "POST",
            f"{args.region}/jobs/{job_id}/executions/{exec_id}:cancel",
            payload=body,
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        wait_for_operation(op, args.region, args)
        print("✅ Execution dibatalkan!")
    else:
        print(
            f"❌ Aksi executions '{action}' tidak dikenal. Gunakan: list, describe, delete, cancel, tasks."
        )
        sys.exit(1)


def handle_jobs(args):
    action = args.command[2] if len(args.command) > 2 else "list"

    if action == "executions":
        handle_job_executions(args, args.command[3:])
        return
    elif action == "tasks":
        handle_job_tasks(args, args.command[3:])
        return

    job_id = args.command[3] if len(args.command) > 3 else args.job

    if action in ("get-iam-policy", "set-iam-policy", "test-iam-permissions"):
        if not job_id:
            print(f"❌ Masukkan nama job untuk {action}.")
            sys.exit(1)
        handle_iam_action(action, f"{args.region}/jobs/{job_id}", args)
        return

    if action in ("create", "deploy"):
        if not job_id:
            print("❌ Masukkan nama job: gcloud run jobs create <job> --image <image>")
            sys.exit(1)
        payload = build_job_payload(args)
        query = {"jobId": job_id, "validateOnly": args.validate_only}
        print(f"🔨 Membuat Job '{job_id}' di {args.region}...")
        try:
            op = make_request(
                "POST",
                f"{args.region}/jobs",
                payload=payload,
                query_params=query,
                base_url=args.floci_url,
                project=args.project,
                token=args.token,
                allow_error=True,
            )
        except urllib.error.HTTPError as e:
            if e.code == 409 and action == "deploy":
                print(f"🔄 Job '{job_id}' sudah ada, melakukan update (PATCH)...")
                op = make_request(
                    "PATCH",
                    f"{args.region}/jobs/{job_id}",
                    payload=payload,
                    query_params={
                        "validateOnly": args.validate_only,
                        "allowMissing": args.allow_missing,
                    },
                    base_url=args.floci_url,
                    project=args.project,
                    token=args.token,
                )
            else:
                err_body = e.read().decode("utf-8", errors="replace")
                print(f"❌ API Error (HTTP {e.code}): {err_body}")
                sys.exit(1)

        op = wait_for_operation(op, args.region, args)
        print(f"✅ Job '{job_id}' berhasil dibuat!")
        if args.json:
            print(json.dumps(extract_resource_from_lro(op), indent=2))

    elif action == "update":
        if not job_id:
            print("❌ Masukkan nama job: gcloud run jobs update <job>")
            sys.exit(1)
        payload = build_job_payload(args)
        query = {
            "validateOnly": args.validate_only,
            "allowMissing": args.allow_missing,
        }
        print(f"🔧 Mengupdate Job '{job_id}'...")
        op = make_request(
            "PATCH",
            f"{args.region}/jobs/{job_id}",
            payload=payload,
            query_params=query,
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        op = wait_for_operation(op, args.region, args)
        print(f"✅ Job '{job_id}' berhasil diupdate!")
        if args.json:
            print(json.dumps(extract_resource_from_lro(op), indent=2))

    elif action in ("execute", "run"):
        if not job_id:
            print("❌ Masukkan nama job: gcloud run jobs execute <job>")
            sys.exit(1)
        run_body = {}
        overrides = {}
        if args.tasks is not None:
            overrides["taskCount"] = args.tasks
        if args.timeout:
            overrides["timeout"] = args.timeout

        container_override = {}
        if args.container_name:
            container_override["name"] = args.container_name
        if args.args:
            container_override["args"] = [a.strip() for a in args.args.split(",") if a.strip()]
        if args.clear_args:
            container_override["clearArgs"] = True
        if args.set_env_vars:
            container_override["env"] = parse_env_vars(args.set_env_vars)
        if container_override:
            overrides["containerOverrides"] = [container_override]

        if overrides:
            run_body["overrides"] = overrides
        if args.validate_only:
            run_body["validateOnly"] = True
        if args.etag:
            run_body["etag"] = args.etag

        print(f"🚀 Menjalankan Job '{job_id}'...")
        op = make_request(
            "POST",
            f"{args.region}/jobs/{job_id}:run",
            payload=run_body if run_body else None,
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        op = wait_for_operation(op, args.region, args)
        exec_res = extract_resource_from_lro(op)
        exec_name = exec_res.get("name", "").split("/")[-1]
        print(f"✅ Eksekusi selesai/dipicu! Execution: {exec_name or 'OK'}")
        if args.json:
            print(json.dumps(exec_res, indent=2))

    elif action in ("describe", "get"):
        if not job_id:
            print("❌ Masukkan nama job: gcloud run jobs describe <job>")
            sys.exit(1)
        res = make_request(
            "GET",
            f"{args.region}/jobs/{job_id}",
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        print(json.dumps(res, indent=2))

    elif action == "list":
        query = {"pageSize": args.page_size, "pageToken": args.page_token}
        res = make_request(
            "GET",
            f"{args.region}/jobs",
            query_params=query,
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        jobs = res.get("jobs", [])
        print(f"📋 Daftar Jobs di {args.region}:")
        for j in jobs:
            name = j.get("name", "").split("/")[-1]
            exec_count = j.get("executionCount", 0)
            latest = j.get("latestCreatedExecution", {}).get("name", "-")
            print(f" - {name} | Executions: {exec_count} | Latest: {latest}")
        if args.json:
            print(json.dumps(res, indent=2))

    elif action == "delete":
        if not job_id:
            print("❌ Masukkan nama job: gcloud run jobs delete <job>")
            sys.exit(1)
        query = {"validateOnly": args.validate_only, "etag": args.etag}
        print(f"🗑️  Menghapus Job '{job_id}'...")
        op = make_request(
            "DELETE",
            f"{args.region}/jobs/{job_id}",
            query_params=query,
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        wait_for_operation(op, args.region, args)
        print("✅ Job terhapus!")

    else:
        print(
            f"❌ Aksi job '{action}' tidak dikenal. Gunakan: create, deploy, update, execute, describe, list, delete, executions, tasks, get-iam-policy, set-iam-policy, test-iam-permissions."
        )
        sys.exit(1)


# =====================================================================
# 3. WORKER POOLS & WORKER POOL REVISIONS HANDLER
# =====================================================================


def build_worker_pool_payload(args):
    container = build_container(args, include_port=True)
    template = {}
    if container:
        template["containers"] = [container]
    if args.add_volume:
        template["volumes"] = parse_volumes(args.add_volume)
    if args.service_account:
        template["serviceAccount"] = args.service_account

    payload = {}
    if template:
        payload["template"] = template
    if args.manual_instances is not None:
        payload["scaling"] = {"manualInstanceCount": args.manual_instances}
    if args.instance_splits:
        payload["instanceSplits"] = parse_instance_splits(args.instance_splits)

    apply_common_metadata(payload, args)
    return payload


def handle_worker_pool_revisions(args, tokens):
    """
    Menangani:
    - gcloud run worker-pools revisions list --worker-pool <pool>
    - gcloud run worker-pools revisions describe <revision> --worker-pool <pool>
    - gcloud run worker-pools revisions delete <revision> --worker-pool <pool>
    """
    action = tokens[0] if tokens else "list"
    pool_id = args.worker_pool

    if action == "list":
        if not pool_id:
            print("❌ Berikan --worker-pool <pool> untuk melihat daftar revision worker pool.")
            sys.exit(1)
        query = {"pageSize": args.page_size, "pageToken": args.page_token}
        res = make_request(
            "GET",
            f"{args.region}/workerPools/{pool_id}/revisions",
            query_params=query,
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        revs = res.get("revisions", [])
        print(f"📋 Daftar Revisions untuk Worker Pool '{pool_id}' di {args.region}:")
        for r in revs:
            name = r.get("name", "").split("/")[-1]
            img = (r.get("containers") or [{}])[0].get("image", "-")
            print(f" - {name} | Image: {img}")
        if args.json:
            print(json.dumps(res, indent=2))

    elif action in ("describe", "get"):
        if len(tokens) < 2:
            print(
                "❌ Masukkan nama revision: gcloud run worker-pools revisions describe <rev> --worker-pool <pool>"
            )
            sys.exit(1)
        rev_id = tokens[1]
        if not pool_id and "-" in rev_id:
            pool_id = rev_id.rsplit("-", 2)[0]
        res = make_request(
            "GET",
            f"{args.region}/workerPools/{pool_id}/revisions/{rev_id}",
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        print(json.dumps(res, indent=2))

    elif action == "delete":
        if len(tokens) < 2:
            print(
                "❌ Masukkan nama revision: gcloud run worker-pools revisions delete <rev> --worker-pool <pool>"
            )
            sys.exit(1)
        rev_id = tokens[1]
        if not pool_id and "-" in rev_id:
            pool_id = rev_id.rsplit("-", 2)[0]
        query = {"validateOnly": args.validate_only, "etag": args.etag}
        print(f"🗑️  Menghapus revision '{rev_id}' dari worker pool '{pool_id}'...")
        op = make_request(
            "DELETE",
            f"{args.region}/workerPools/{pool_id}/revisions/{rev_id}",
            query_params=query,
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        wait_for_operation(op, args.region, args)
        print("✅ Revision worker pool terhapus!")
    else:
        print(
            f"❌ Aksi worker-pools revisions '{action}' tidak dikenal. Gunakan: list, describe, delete."
        )
        sys.exit(1)


def handle_worker_pools(args):
    action = args.command[2] if len(args.command) > 2 else "list"
    if action == "revisions":
        handle_worker_pool_revisions(args, args.command[3:])
        return

    pool_id = args.command[3] if len(args.command) > 3 else args.worker_pool

    if action in ("get-iam-policy", "set-iam-policy", "test-iam-permissions"):
        if not pool_id:
            print(f"❌ Masukkan nama worker pool untuk {action}.")
            sys.exit(1)
        handle_iam_action(action, f"{args.region}/workerPools/{pool_id}", args)
        return

    if action in ("create", "deploy"):
        if not pool_id:
            print("❌ Masukkan nama worker pool: gcloud run worker-pools create <pool> --image <image>")
            sys.exit(1)
        payload = build_worker_pool_payload(args)
        query = {"workerPoolId": pool_id, "validateOnly": args.validate_only}
        print(f"👷 Membuat Worker Pool '{pool_id}' di {args.region}...")
        try:
            op = make_request(
                "POST",
                f"{args.region}/workerPools",
                payload=payload,
                query_params=query,
                base_url=args.floci_url,
                project=args.project,
                token=args.token,
                allow_error=True,
            )
        except urllib.error.HTTPError as e:
            if e.code == 409 and action == "deploy":
                print(f"🔄 Worker Pool '{pool_id}' sudah ada, melakukan update (PATCH)...")
                patch_query = {
                    "updateMask": args.update_mask,
                    "validateOnly": args.validate_only,
                    "allowMissing": args.allow_missing,
                    "forceNewRevision": args.force_new_revision,
                }
                op = make_request(
                    "PATCH",
                    f"{args.region}/workerPools/{pool_id}",
                    payload=payload,
                    query_params=patch_query,
                    base_url=args.floci_url,
                    project=args.project,
                    token=args.token,
                )
            else:
                err_body = e.read().decode("utf-8", errors="replace")
                print(f"❌ API Error (HTTP {e.code}): {err_body}")
                sys.exit(1)

        op = wait_for_operation(op, args.region, args)
        pool = extract_resource_from_lro(op)
        print(
            f"✅ Worker Pool '{pool_id}' siap! LatestReadyRevision: {pool.get('latestReadyRevision', '-').split('/')[-1]}"
        )
        if args.json:
            print(json.dumps(pool, indent=2))

    elif action == "update":
        if not pool_id:
            print("❌ Masukkan nama worker pool: gcloud run worker-pools update <pool>")
            sys.exit(1)
        payload = build_worker_pool_payload(args)
        query = {
            "updateMask": args.update_mask,
            "validateOnly": args.validate_only,
            "allowMissing": args.allow_missing,
            "forceNewRevision": args.force_new_revision,
        }
        print(f"🔧 Mengupdate Worker Pool '{pool_id}'...")
        op = make_request(
            "PATCH",
            f"{args.region}/workerPools/{pool_id}",
            payload=payload,
            query_params=query,
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        op = wait_for_operation(op, args.region, args)
        pool = extract_resource_from_lro(op)
        print(f"✅ Worker Pool '{pool_id}' berhasil diupdate!")
        if args.json:
            print(json.dumps(pool, indent=2))

    elif action in ("describe", "get"):
        if not pool_id:
            print("❌ Masukkan nama worker pool: gcloud run worker-pools describe <pool>")
            sys.exit(1)
        res = make_request(
            "GET",
            f"{args.region}/workerPools/{pool_id}",
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        print(json.dumps(res, indent=2))

    elif action == "list":
        query = {"pageSize": args.page_size, "pageToken": args.page_token}
        res = make_request(
            "GET",
            f"{args.region}/workerPools",
            query_params=query,
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        pools = res.get("workerPools", [])
        print(f"📋 Daftar Worker Pools di {args.region}:")
        for p in pools:
            name = p.get("name", "").split("/")[-1]
            replicas = p.get("scaling", {}).get("manualInstanceCount", 1)
            rev = p.get("latestReadyRevision", "").split("/")[-1] or "-"
            print(f" - {name} | Replicas: {replicas} | ReadyRev: {rev}")
        if args.json:
            print(json.dumps(res, indent=2))

    elif action == "delete":
        if not pool_id:
            print("❌ Masukkan nama worker pool: gcloud run worker-pools delete <pool>")
            sys.exit(1)
        query = {"validateOnly": args.validate_only, "etag": args.etag}
        print(f"🗑️  Menghapus Worker Pool '{pool_id}'...")
        op = make_request(
            "DELETE",
            f"{args.region}/workerPools/{pool_id}",
            query_params=query,
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        wait_for_operation(op, args.region, args)
        print("✅ Worker Pool terhapus!")

    else:
        print(
            f"❌ Aksi worker-pools '{action}' tidak dikenal. Gunakan: create, deploy, update, describe, list, delete, revisions, get-iam-policy, set-iam-policy, test-iam-permissions."
        )
        sys.exit(1)


# =====================================================================
# 4. INSTANCES HANDLER
# =====================================================================


def build_instance_payload(args):
    """
    Sesuai cloud-run.md:
    Request body dari Instance memiliki `containers` dan `volumes` di top-level (tidak ada `template`).
    """
    container = build_container(args, include_port=True)
    payload = {}
    if container:
        payload["containers"] = [container]
    if args.add_volume:
        payload["volumes"] = parse_volumes(args.add_volume)
    if args.service_account:
        payload["serviceAccount"] = args.service_account
    if args.ingress:
        payload["ingress"] = args.ingress
    if args.timeout:
        payload["timeout"] = args.timeout

    apply_common_metadata(payload, args)
    return payload


def extract_instance_url(inst):
    if not isinstance(inst, dict):
        return None
    if inst.get("uri"):
        return inst["uri"]
    urls = inst.get("urls") or []
    return urls[0] if urls else None


def handle_instances(args):
    action = args.command[2] if len(args.command) > 2 else "list"
    instance_id = args.command[3] if len(args.command) > 3 else args.instance

    if action in ("get-iam-policy", "set-iam-policy", "test-iam-permissions"):
        if not instance_id:
            print(f"❌ Masukkan nama instance untuk {action}.")
            sys.exit(1)
        handle_iam_action(action, f"{args.region}/instances/{instance_id}", args)
        return

    if action in ("create", "deploy"):
        payload = build_instance_payload(args)
        # instanceId bersifat opsional pada create; jika tidak diberikan, server men-generate 15 karakter ID
        query = {"instanceId": instance_id, "validateOnly": args.validate_only}
        label = instance_id or "<auto-generated>"
        print(f"🖥️  Membuat Instance '{label}' di {args.region}...")
        try:
            op = make_request(
                "POST",
                f"{args.region}/instances",
                payload=payload,
                query_params=query,
                base_url=args.floci_url,
                project=args.project,
                token=args.token,
                allow_error=True,
            )
        except urllib.error.HTTPError as e:
            if e.code == 409 and action == "deploy" and instance_id:
                print(f"🔄 Instance '{instance_id}' sudah ada, melakukan update (PATCH)...")
                patch_query = {
                    "updateMask": args.update_mask,
                    "validateOnly": args.validate_only,
                    "allowMissing": args.allow_missing,
                }
                op = make_request(
                    "PATCH",
                    f"{args.region}/instances/{instance_id}",
                    payload=payload,
                    query_params=patch_query,
                    base_url=args.floci_url,
                    project=args.project,
                    token=args.token,
                )
            else:
                err_body = e.read().decode("utf-8", errors="replace")
                print(f"❌ API Error (HTTP {e.code}): {err_body}")
                sys.exit(1)

        op = wait_for_operation(op, args.region, args)
        inst = extract_resource_from_lro(op)
        created_id = inst.get("name", "").split("/")[-1] or instance_id
        url = extract_instance_url(inst)
        if not url and created_id and not args.validate_only:
            inst = make_request(
                "GET",
                f"{args.region}/instances/{created_id}",
                base_url=args.floci_url,
                project=args.project,
                token=args.token,
            )
            url = extract_instance_url(inst)

        if url:
            print(f"✅ Instance '{created_id}' berjalan! URL: {url}")
            inject_hosts(urlparse(url).hostname, args.vpn_ip, args.no_hosts)
        else:
            print(f"✅ Instance '{created_id}' berhasil dibuat!")
        if args.json:
            print(json.dumps(inst, indent=2))

    elif action == "update":
        if not instance_id:
            print("❌ Masukkan nama instance: gcloud run instances update <instance>")
            sys.exit(1)
        payload = build_instance_payload(args)
        query = {
            "updateMask": args.update_mask,
            "validateOnly": args.validate_only,
            "allowMissing": args.allow_missing,
        }
        print(f"🔧 Mengupdate Instance '{instance_id}'...")
        op = make_request(
            "PATCH",
            f"{args.region}/instances/{instance_id}",
            payload=payload,
            query_params=query,
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        op = wait_for_operation(op, args.region, args)
        inst = extract_resource_from_lro(op)
        print(f"✅ Instance '{instance_id}' berhasil diupdate!")
        if args.json:
            print(json.dumps(inst, indent=2))

    elif action == "start":
        if not instance_id:
            print("❌ Masukkan nama instance: gcloud run instances start <instance>")
            sys.exit(1)
        query = {"validateOnly": args.validate_only}
        print(f"▶️  Menjalankan (start) Instance '{instance_id}'...")
        op = make_request(
            "POST",
            f"{args.region}/instances/{instance_id}:start",
            query_params=query,
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        op = wait_for_operation(op, args.region, args)
        inst = extract_resource_from_lro(op)
        url = extract_instance_url(inst)
        if url:
            inject_hosts(urlparse(url).hostname, args.vpn_ip, args.no_hosts)
        print(f"✅ Instance '{instance_id}' berstatus Running!")
        if args.json:
            print(json.dumps(inst, indent=2))

    elif action == "stop":
        if not instance_id:
            print("❌ Masukkan nama instance: gcloud run instances stop <instance>")
            sys.exit(1)
        query = {"validateOnly": args.validate_only}
        print(f"⏹️  Menghentikan (stop) Instance '{instance_id}'...")
        op = make_request(
            "POST",
            f"{args.region}/instances/{instance_id}:stop",
            query_params=query,
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        op = wait_for_operation(op, args.region, args)
        inst = extract_resource_from_lro(op)
        print(f"✅ Instance '{instance_id}' berhasil dihentikan (Stopped)!")
        if args.json:
            print(json.dumps(inst, indent=2))

    elif action in ("describe", "get"):
        if not instance_id:
            print("❌ Masukkan nama instance: gcloud run instances describe <instance>")
            sys.exit(1)
        res = make_request(
            "GET",
            f"{args.region}/instances/{instance_id}",
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        print(json.dumps(res, indent=2))

    elif action == "list":
        query = {"pageSize": args.page_size, "pageToken": args.page_token}
        res = make_request(
            "GET",
            f"{args.region}/instances",
            query_params=query,
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        instances = res.get("instances", [])
        print(f"📋 Daftar Instances di {args.region}:")
        for i in instances:
            name = i.get("name", "").split("/")[-1]
            state = i.get("terminalCondition", {}).get("state", "UNKNOWN")
            url = extract_instance_url(i) or "No URL"
            print(f" - {name} | State: {state} | {url}")
        if args.json:
            print(json.dumps(res, indent=2))

    elif action == "delete":
        if not instance_id:
            print("❌ Masukkan nama instance: gcloud run instances delete <instance>")
            sys.exit(1)
        query = {"validateOnly": args.validate_only, "etag": args.etag}
        print(f"🗑️  Menghapus Instance '{instance_id}'...")
        op = make_request(
            "DELETE",
            f"{args.region}/instances/{instance_id}",
            query_params=query,
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        op = wait_for_operation(op, args.region, args)
        if not args.validate_only:
            deleted_inst = extract_resource_from_lro(op)
            del_url = extract_instance_url(deleted_inst)
            del_host = urlparse(del_url).hostname if del_url else None
            remove_hosts(
                hostname=del_host,
                resource_id=instance_id,
                region=args.region,
                skip_hosts=args.no_hosts,
            )
        print("✅ Instance terhapus!")

    else:
        print(
            f"❌ Aksi instances '{action}' tidak dikenal. Gunakan: create, deploy, update, start, stop, describe, list, delete, get-iam-policy, set-iam-policy, test-iam-permissions."
        )
        sys.exit(1)


# =====================================================================
# 5. OPERATIONS (LRO) HANDLER
# =====================================================================


def handle_operations(args):
    """
    Menangani `/v2/projects/{project}/locations/{location}/operations`:
    - list
    - describe / get
    - wait
    - delete
    """
    action = args.command[2] if len(args.command) > 2 else "list"
    op_id = args.command[3] if len(args.command) > 3 else None

    if action == "list":
        query = {"pageSize": args.page_size, "pageToken": args.page_token}
        res = make_request(
            "GET",
            f"{args.region}/operations",
            query_params=query,
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        ops = res.get("operations", [])
        print(f"📋 Daftar Operations di {args.region}:")
        for o in ops:
            name = o.get("name", "").split("/")[-1]
            done = o.get("done", False)
            print(f" - {name} | Done: {done}")
        if args.json:
            print(json.dumps(res, indent=2))

    elif action in ("describe", "get"):
        if not op_id:
            print("❌ Masukkan ID operation: gcloud run operations describe <op_id>")
            sys.exit(1)
        res = make_request(
            "GET",
            f"{args.region}/operations/{op_id}",
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        print(json.dumps(res, indent=2))

    elif action == "wait":
        if not op_id:
            print("❌ Masukkan ID operation: gcloud run operations wait <op_id>")
            sys.exit(1)
        op_data = make_request(
            "GET",
            f"{args.region}/operations/{op_id}",
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        args.wait = True
        final_op = wait_for_operation(op_data, args.region, args)
        print(json.dumps(final_op, indent=2))

    elif action == "delete":
        if not op_id:
            print("❌ Masukkan ID operation: gcloud run operations delete <op_id>")
            sys.exit(1)
        make_request(
            "DELETE",
            f"{args.region}/operations/{op_id}",
            base_url=args.floci_url,
            project=args.project,
            token=args.token,
        )
        print(f"✅ Operation '{op_id}' dihapus!")
    else:
        print(f"❌ Aksi operations '{action}' tidak dikenal. Gunakan: list, describe, wait, delete.")
        sys.exit(1)


# =====================================================================
# MAIN CLI ENTRYPOINT
# =====================================================================


def build_arg_parser():
    parser = argparse.ArgumentParser(
        description="Floci-GCP Cloud Run Admin API v2 Complete CLI Parser"
    )
    parser.add_argument(
        "command",
        nargs="*",
        help="run [deploy|services|revisions|jobs|worker-pools|instances|operations] [action] [id]",
    )

    # Container & Template Args
    parser.add_argument("--image", help="URL Image Docker")
    parser.add_argument("--container", "--container-name", dest="container_name", help="Nama container")
    parser.add_argument("--port", type=int, help="Container port (default di floci: 8080)")
    parser.add_argument("--port-name", help="Nama port (mis. http1)")
    parser.add_argument("--memory", help="Batas memori (mis. 512Mi, 2Gi)")
    parser.add_argument("--cpu", help="Batas CPU (mis. 1, 0.5, 1000m, 2000m)")
    parser.add_argument("--command", dest="command_bin", help="Container entrypoint (dipisah koma)")
    parser.add_argument("--args", help="Container arguments (dipisah koma)")
    parser.add_argument("--clear-args", action="store_true", help="Hapus args saat job override")
    parser.add_argument("--working-dir", help="Working directory di dalam container")
    parser.add_argument(
        "--set-env-vars",
        "--update-env-vars",
        dest="set_env_vars",
        action="append",
        help="KEY=VAL,KEY2=VAL2 (dapat dipanggil lebih dari sekali)",
    )
    parser.add_argument(
        "--add-volume",
        action="append",
        help="name=v,type=cloud-storage,bucket=b[,readonly=true]",
    )
    parser.add_argument(
        "--add-volume-mount",
        action="append",
        help="volume=v,mount-path=/mnt[,sub-path=dir]",
    )
    parser.add_argument("--timeout", "--task-timeout", dest="timeout", help="Timeout (mis. 300s, 600s)")
    parser.add_argument("--service-account", help="Email Service Account")
    parser.add_argument(
        "--execution-environment",
        help="EXECUTION_ENVIRONMENT_GEN2 atau EXECUTION_ENVIRONMENT_GEN1",
    )
    parser.add_argument("--ingress", help="Pengaturan ingress (mis. INGRESS_TRAFFIC_ALL)")

    # Job & Execution Specific Args
    parser.add_argument("--tasks", type=int, help="Jumlah task (taskCount) untuk jobs")
    parser.add_argument("--parallelism", type=int, help="Batas paralelisme task untuk jobs")
    parser.add_argument("--max-retries", type=int, help="Maksimal percobaan ulang task (default: 3)")
    parser.add_argument("--start-execution-token", help="Token untuk mulai eksekusi saat create/update job")
    parser.add_argument("--run-execution-token", help="Token untuk menjalankan eksekusi saat create/update job")
    parser.add_argument("--job", help="Nama job (untuk filter executions / tasks)")
    parser.add_argument("--execution", help="Nama execution (untuk filter tasks)")

    # Worker Pool Specific Args
    parser.add_argument(
        "--manual-instances",
        "--instances",
        dest="manual_instances",
        type=int,
        help="Jumlah manualInstanceCount untuk worker pool",
    )
    parser.add_argument(
        "--instance-splits",
        "--traffic",
        dest="instance_splits",
        help="Alokasi split worker pool (mis. LATEST=100 atau rev1=60,rev2=40)",
    )
    parser.add_argument("--worker-pool", help="Nama worker pool (untuk sub-command revisions)")
    parser.add_argument(
        "--force-new-revision",
        action="store_true",
        help="Paksa pembuatan revision baru pada update worker pool",
    )

    # Resource References & Metadata
    parser.add_argument("--service", help="Nama service (untuk sub-command revisions)")
    parser.add_argument("--instance", help="Nama instance")
    parser.add_argument("--labels", help="Labels K1=V1,K2=V2")
    parser.add_argument("--annotations", help="Annotations K1=V1,K2=V2")
    parser.add_argument("--description", help="Deskripsi resource")
    parser.add_argument("--client", help="Nama client")
    parser.add_argument("--client-version", help="Versi client")
    parser.add_argument("--launch-stage", help="Launch stage (mis. GA, BETA, ALPHA)")

    # Query & Control Parameters
    parser.add_argument("--update-mask", help="Field mask untuk PATCH (mis. template,scaling.manualInstanceCount)")
    parser.add_argument("--validate-only", "--dry-run", dest="validate_only", action="store_true")
    parser.add_argument("--allow-missing", action="store_true", help="Upsert jika resource belum ada pada PATCH")
    parser.add_argument("--etag", help="ETag resource")
    parser.add_argument("--page-size", type=int, help="Jumlah item per halaman untuk list")
    parser.add_argument("--page-token", help="Token halaman berikutnya untuk list")

    # IAM Parameters
    parser.add_argument("--policy-file", help="Path file JSON policy untuk set-iam-policy")
    parser.add_argument("--member", help="Member IAM (mis. serviceAccount:sa@..., user:..., allUsers)")
    parser.add_argument("--role", help="Role IAM (mis. roles/run.admin, roles/run.developer, roles/run.viewer)")
    parser.add_argument("--condition-title", help="Judul kondisi CEL IAM")
    parser.add_argument("--condition-expression", help="Ekspresi CEL untuk kondisi IAM")
    parser.add_argument("--permissions", help="Daftar permission dipisah koma untuk test-iam-permissions")
    parser.add_argument("--token", help="Bearer token untuk otorisasi IAM enforcement")

    # Global & Environment Args
    parser.add_argument("--region", default="us-central1", help="Region GCP (default: us-central1)")
    parser.add_argument("--project", default=PROJECT, help=f"Project ID (default: {PROJECT})")
    parser.add_argument("--floci-url", default=FLOCI_URL, help=f"Base URL floci-gcp (default: {FLOCI_URL})")
    parser.add_argument("--vpn-ip", default=VPN_IP, help=f"IP tujuan /etc/hosts (default: {VPN_IP})")
    parser.add_argument("--no-hosts", action="store_true", help="Jangan modifikasi /etc/hosts")
    parser.add_argument("--wait", action="store_true", default=True, help="Tunggu operasi LRO selesai (default: True)")
    parser.add_argument("--no-wait", "--async", dest="wait", action="store_false", help="Jangan tunggu LRO selesai")
    parser.add_argument("--json", action="store_true", help="Tampilkan output JSON mentah")

    # Kompatibilitas syntax gcloud asli
    parser.add_argument("--platform", help="Diabaikan (kompatibilitas gcloud)")
    parser.add_argument("--allow-unauthenticated", action="store_true", help="Beri akses invoker publik")
    parser.add_argument("--no-allow-unauthenticated", action="store_true")
    parser.add_argument("--quiet", "-q", action="store_true")

    return parser


def main():
    parser = build_arg_parser()
    args, _ = parser.parse_known_args()

    # Dukung pemanggilan langsung `gcloud run ...` maupun `run ...`
    if args.command and args.command[0] == "gcloud":
        args.command = args.command[1:]

    if not args.command or args.command[0] != "run":
        print("Hanya command '[gcloud] run ...' yang didukung.")
        sys.exit(1)

    sub_command = args.command[1] if len(args.command) > 1 else "deploy"

    if sub_command in ("deploy", "services"):
        handle_services(args)
    elif sub_command == "revisions":
        handle_service_revisions(args, args.command[2:])
    elif sub_command == "jobs":
        handle_jobs(args)
    elif sub_command in ("worker-pools", "workerPools"):
        handle_worker_pools(args)
    elif sub_command == "instances":
        handle_instances(args)
    elif sub_command == "operations":
        handle_operations(args)
    else:
        print(
            f"❌ Sub-command '{sub_command}' tidak dikenal. Pilihan: deploy, services, revisions, jobs, worker-pools, instances, operations."
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
