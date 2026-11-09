Notes: Skrip ini digunakan pada artikel [https://askarhabibulloh.my.id/doc/setup-floci-on-vps/](https://askarhabibulloh.my.id/doc/setup-floci-on-vps/)

# Panduan Penggunaan `gcloud-floci`

## 1. Setup Alias

Jalankan di folder tempat `gcloud_floci.py` berada:

**Bash (`~/.bashrc`):**

```bash
echo "alias gcloud-floci='sudo $(pwd)/venvFloci/bin/python $(pwd)/gcloud_floci.py'" >> ~/.bashrc
source ~/.bashrc
```

**Zsh / macOS (`~/.zshrc`):**

```bash
echo "alias gcloud-floci='sudo $(pwd)/venvFloci/bin/python $(pwd)/gcloud_floci.py'" >> ~/.zshrc
source ~/.zshrc
```

_(Opsional: jika tidak memakai virtualenv, ganti `$(pwd)/venvFloci/bin/python` menjadi `python3`)_

---

## 2. Contoh Perintah

### Services

```bash
# Deploy / Update Service
gcloud-floci run deploy my-service \
  --image nginx:alpine \
  --port 80 \
  --cpu 1 --memory 512Mi \
  --set-env-vars APP_ENV=local,DEBUG=true \
  --add-volume name=vol1,type=cloud-storage,bucket=my-bucket \
  --add-volume-mount volume=vol1,mount-path=/mnt/data

# List, Describe, Update, Delete Service
gcloud-floci run services list
gcloud-floci run services describe my-service
gcloud-floci run services update my-service --memory 1Gi --update-mask template.containers
gcloud-floci run services delete my-service
```

### Service Revisions

```bash
gcloud-floci run revisions list --service my-service
gcloud-floci run revisions describe my-service-00001 --service my-service
gcloud-floci run revisions delete my-service-00001 --service my-service
```

### Jobs, Executions, & Tasks

```bash
# Buat, Update, & Jalankan Job
gcloud-floci run jobs create my-job \
  --image busybox:latest \
  --command /bin/sh \
  --args "-c,echo hello" \
  --tasks 3 --parallelism 2 --max-retries 1 --timeout 120s

gcloud-floci run jobs update my-job --tasks 5
gcloud-floci run jobs execute my-job --tasks 2 --set-env-vars RUN_ID=101
gcloud-floci run jobs list
gcloud-floci run jobs describe my-job
gcloud-floci run jobs delete my-job

# Kelola Executions & Tasks
gcloud-floci run jobs executions list --job my-job
gcloud-floci run jobs executions describe my-job-abc12 --job my-job
gcloud-floci run jobs executions cancel my-job-abc12 --job my-job
gcloud-floci run jobs executions delete my-job-abc12 --job my-job

gcloud-floci run jobs tasks list --job my-job --execution my-job-abc12
gcloud-floci run jobs tasks describe my-job-abc12-task0 --job my-job --execution my-job-abc12
```

### Worker Pools & Revisions

```bash
# Buat, Update, Scaling, & Split Worker Pool
gcloud-floci run worker-pools create my-pool \
  --image busybox:latest \
  --command /bin/sh --args "-c,sleep 3600" \
  --manual-instances 1

gcloud-floci run worker-pools update my-pool --manual-instances 0 --update-mask scaling.manualInstanceCount
gcloud-floci run worker-pools update my-pool --instance-splits LATEST=100
gcloud-floci run worker-pools list
gcloud-floci run worker-pools describe my-pool
gcloud-floci run worker-pools delete my-pool

# Revisions pada Worker Pool
gcloud-floci run worker-pools revisions list --worker-pool my-pool
gcloud-floci run worker-pools revisions describe my-pool-00001-abc --worker-pool my-pool
gcloud-floci run worker-pools revisions delete my-pool-00001-abc --worker-pool my-pool
```

### Instances

```bash
# Buat, Start, Stop, Update, Delete Instance
gcloud-floci run instances create my-instance \
  --image nginx:alpine \
  --port 80 --cpu 2000m --memory 2048Mi

gcloud-floci run instances stop my-instance
gcloud-floci run instances start my-instance
gcloud-floci run instances list
gcloud-floci run instances describe my-instance
gcloud-floci run instances delete my-instance
```

### IAM Policy (Berlaku untuk `services`, `jobs`, `worker-pools`, `instances`)

```bash
gcloud-floci run services get-iam-policy my-service
gcloud-floci run services set-iam-policy my-service --member serviceAccount:dev@floci-local.iam.gserviceaccount.com --role roles/run.developer
gcloud-floci run services test-iam-permissions my-service --permissions run.services.get,run.services.update
```

### Long-Running Operations (LRO)

```bash
gcloud-floci run operations list
gcloud-floci run operations describe <operation-id>
gcloud-floci run operations wait <operation-id>
gcloud-floci run operations delete <operation-id>
```

### Flag Tambahan Umum

- `--region <region>` (default: `us-central1`)
- `--project <project>` (default: `floci-local`)
- `--floci-url <url>` (default: `http://floci-gcp:4588`)
- `--vpn-ip <ip>` (default: `10.5.5.1`)
- `--no-hosts` (lewati injeksi `/etc/hosts`)
- `--no-wait` / `--async` (jangan tunggu operasi selesai)
- `--validate-only` / `--dry-run` (validasi tanpa menyimpan)
- `--json` (tampilkan output JSON penuh)

---

## 3. Troubleshooting

### 1. `Temporary failure in name resolution` (`socket.gaierror`)

Muncul karena hostname default `floci-gcp` (`http://floci-gcp:4588`) belum terdaftar di `/etc/hosts`.

- **Solusi 1 — Daftarkan `floci-gcp` ke `/etc/hosts` (cukup sekali):**

  ```bash
  # Jika floci-gcp berjalan di server VPN (10.5.5.1):
  echo -e "10.5.5.1\tfloci-gcp" | sudo tee -a /etc/hosts

  # Jika floci-gcp berjalan di mesin lokal (localhost):
  echo -e "127.0.0.1\tfloci-gcp" | sudo tee -a /etc/hosts
  ```

- **Solusi 2 — Gunakan flag `--floci-url` langsung:**
  ```bash
  gcloud-floci run deploy my-service --floci-url http://10.5.5.1:4588 ...
  # atau
  gcloud-floci run deploy my-service --floci-url http://localhost:4588 ...
  ```

### 2. Error saat menggunakan `--add-volume` (Cloud Storage Bucket)

Sesuai aturan `floci-gcp`, jika menyertakan `--add-volume name=...,type=cloud-storage,bucket=my-bucket`, **bucket tersebut wajib sudah dibuat lebih dulu** di emulator GCS `floci-gcp` (dan Docker harus memiliki akses ke image `alpine:3.20` untuk proses snapshot). Jika belum memiliki bucket di GCS emulator, buat dulu bucketnya atau jalankan deploy tanpa flag `--add-volume` dan `--add-volume-mount`.

**Cara membuat bucket GCS di `floci-gcp` menggunakan `gcloud` asli:**
Berbeda dengan Cloud Run (yang di `gcloud` asli masih memakai API v1 Knative/gRPC sehingga butuh `gcloud-floci`), untuk **Cloud Storage** kamu sudah bisa langsung memakai `gcloud` CLI asli dengan meng-override endpoint-nya terlebih dahulu:

```bash
export CLOUDSDK_API_ENDPOINT_OVERRIDES_STORAGE=http://floci-gcp:4588/
export CLOUDSDK_CORE_PROJECT=floci-local
export CLOUDSDK_AUTH_ACCESS_TOKEN=floci

gcloud storage buckets create gs://my-bucket
```
