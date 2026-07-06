# Proof of Concept TOTP Verification

Project ini adalah proof of concept untuk verifikasi berbasis TOTP dengan fokus pada pendekatan yang low cost dan mudah dioperasikan. Tujuan utamanya adalah menunjukkan bagaimana verifikasi sederhana masih bisa membantu:

- mengurangi replay attack dengan memaksa verifikasi ulang menggunakan kode TOTP yang cepat kedaluwarsa,
- mengurangi risiko verifikasi hanya dari foto barcode yang diambil lalu dipakai ulang,
- menghindari sequencing atau enumerasi user dengan tidak bergantung pada pola identitas yang mudah ditebak.

Ini bukan implementasi produksi. Beberapa detail, seperti pengiriman secret dan salt saat registrasi, sengaja dibuat terbuka agar alur POC mudah diuji.

## Cara Kerja

Alurnya sederhana:

1. Admin mendaftarkan user baru melalui halaman register.
2. Server membuat `userId`, `totp_secret`, dan `unique_salt`.
3. Server mengembalikan QR code `otpauth://` untuk dipindai ke aplikasi autentikator.
4. Saat verifikasi, client menggabungkan `userId + salt + kode TOTP`, lalu menghitung SHA-256 hash.
5. Server menghitung ulang hash yang sama dan membandingkannya dengan nilai yang dikirim client.
6. Verifikasi masih menerima window TOTP sekitar ±1 langkah 30 detik untuk toleransi clock drift.

## Kenapa Pendekatan Ini Dipakai

POC ini dirancang untuk skenario verifikasi yang murah dan cepat di lapangan. Dengan TOTP, kode hanya valid sebentar sehingga hasil foto barcode atau data verifikasi lama tidak bisa dipakai terus-menerus.

Penggunaan `userId` dan `unique_salt` juga membantu mengurangi nilai dari enumerasi user yang terlalu mudah ditebak, karena verifikasi tidak hanya bertumpu pada satu identifier statis saja.

## Teknologi

- Python 3
- Flask
- Flask-CORS
- pyotp
- qrcode
- SQLite

## Menjalankan Project

Install dependency:

```bash
pip install -r requirements.txt
```

Jalankan server:

```bash
python app.py
```

Server akan berjalan di:

- `http://localhost:5000`

Halaman yang tersedia:

- `http://localhost:5000/register` untuk registrasi user
- `http://localhost:5000/client` untuk client/verifikasi
- `http://localhost:5000/verifikator` untuk tampilan verifikator

## Endpoint API

### `POST /api/register`

Membuat user baru.

Request body:

```json
{ "username": "alice" }
```

Response berisi:

- `id`
- `username`
- `totp_secret`
- `salt`
- `setup_uri`
- `setup_qr`

### `GET /api/salt/<user_id>`

Mengambil salt unik milik user untuk perhitungan hash di sisi client.

### `POST /api/verify`

Memverifikasi hasil hash.

Request body:

```json
{ "userId": "...", "hash": "..." }
```

Jika valid, server mengembalikan:

```json
{ "valid": true, "message": "Verification successful" }
```

### `GET /api/users`

Menampilkan daftar user yang terdaftar tanpa secret.

## Struktur Database

Database SQLite menyimpan tabel `users` dengan kolom utama:

- `id`
- `username`
- `totp_secret`
- `unique_salt`
- `created_at`

File database dibuat otomatis sebagai `database.db` saat aplikasi dijalankan.

## Catatan Keamanan

- Ini adalah POC, bukan sistem produksi.
- Secret dan salt ditampilkan saat registrasi agar alur demo mudah divalidasi.
- Validasi TOTP memiliki toleransi window untuk clock drift, jadi pengujian harus mempertimbangkan masa berlaku kode.
- Untuk produksi, biasanya perlu proteksi tambahan seperti rate limiting, audit log, transport encryption yang ketat, dan kebijakan penyimpanan secret yang lebih aman.

## Lisensi

Belum ditentukan.
