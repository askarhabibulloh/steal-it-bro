# 🔐 Laboratorium Kerentanan Race Condition

Sebuah laboratorium pendidikan Node.js/Express yang mendemonstrasikan kerentanan **TOCTOU (Time-of-Check to Time-of-Use)** race condition dengan delay yang disengaja, database dalam memori, dan sistem autentikasi multi-pengguna. Dirancang dengan antarmuka **Neo-Brutalist** untuk pengalaman visual yang unik dan edukatif.

## 📚 Tujuan Pembelajaran

Laboratorium ini mengajarkan:

- **Race Conditions**: Memahami bagaimana request yang bersamaan dapat saling mengganggu
- **Kerentanan TOCTOU**: Celah antara memeriksa suatu kondisi dan bertindak berdasarkannya
- **Implikasi Keamanan**: Bagaimana pola yang tidak aman dapat dieksploitasi dalam sistem dunia nyata
- **Skenario Multi-Pengguna**: Bagaimana beberapa pengguna yang terautentikasi bersaing untuk sumber daya bersama
- **Pengujian Bersamaan**: Menggunakan Python, Node.js, dan Bash untuk menguji sistem yang rentan
- **Strategi Perbaikan**: Mengapa operasi atomic, transaksi database, dan kunci sangat penting

## 🎯 Skenario Kerentanan

### 1. Transfer Saldo (Double-Spending) - Skenario Multi-Pengguna

- **Kerentanan**: Multiple transfer bersamaan dari pengguna yang berbeda melebihi saldo bersama yang tersedia
- **Cara Kerjanya**:
  1. Pengguna A (terautentikasi) memeriksa apakah balance >= amount
  2. Pengguna B (terautentikasi) memeriksa apakah balance >= amount (check berhasil juga)
  3. Tidur 2 detik (jendela race)
  4. Kedua pengguna mengurangi amount dari balance bersama
- **Eksploitasi**: Dua transfer bersamaan sebesar $800 dapat berhasil meskipun saldo bersama hanya $1000
- **Scenario Nyata**: Dua pengguna di toko online yang sama menjual barang dari stok terbatas

### 2. Penggunaan Kupon (Bypass Single-Use) - Skenario Multi-Pengguna

- **Kerentanan**: Kupon single-use dapat digunakan berkali-kali oleh pengguna berbeda
- **Cara Kerjanya**:
  1. Pengguna A (terautentikasi) memeriksa apakah coupon.used === false
  2. Pengguna B (terautentikasi) memeriksa apakah coupon.used === false (check berhasil juga)
  3. Tidur 2 detik (jendela race)
  4. Kedua pengguna menerapkan diskon dan menandai kupon sebagai digunakan
- **Eksploitasi**: Dua request bersamaan dapat sama-sama menerapkan diskon 20% dari kupon yang sama
- **Scenario Nyata**: Promosi terbatas yang dapat dimanfaatkan oleh pelanggan berbeda secara simultan

### 3. Penipisan Stok (Overselling) - Skenario Multi-Pengguna

- **Kerentanan**: Stok dapat menjadi negatif dengan penjualan yang bersamaan dari pengguna berbeda
- **Cara Kerjanya**:
  1. Pengguna A (terautentikasi) memeriksa apakah stock > 0
     2.�️ Antarmuka Neo-Brutalist

Laboratorium ini menampilkan desain **Neo-Brutalist** yang terinspirasi dari platform seperti Saweria.co dengan:

- **Palet Warna**: Cream (#FDFDFA), Cyan (#81E6D9), Orange (#F6AD55), dan Black (#000)
- **Tipografi Bold**: Uppercase labels dengan letter-spacing untuk visual yang kuat
- **Border Tebal**: 2-3px solid black pada semua elemen interaktif
- **Hard Shadows**: Bayangan offset 4px tanpa blur untuk efek 3D yang tajam
- **Interaksi Visual**: Hover dengan translate dan active states yang responsif

### Layar Autentikasi

Tampilan pertama adalah layar login/signup dengan:

- Tab navigation untuk beralih antara Login dan Signup
- Form input untuk username dan password
- Hint akun demo untuk pengujian cepat

### Layar Dashboard

Setelah login, akses dashboard dengan:

- **Header**: Username saat ini dan tombol Logout
- **Status Grid**: Menampilkan saldo bersama, status kupon, dan stok dalam real-time
- **Actions Grid**: Tombol untuk Transfer, Claim Coupon, dan Checkout dengan input fields
- **Log Container**: Menampilkan respons dari setiap aksi dengan warna-kode (hijau=sukses, oranye=error)
- **Auto-refresh**: Status diperbarui setiap 500ms untuk menampilkan perubahan real-time
- **Reset Button**: Mengembalikan lab ke status awal

## 🚀 Memulai Dengan Cepat

### Prasyarat

- Node.js 14+ dan npm
- Python 3.6+ (untuk skrip exploit Python)
- Bash dan curl (untuk skrip exploit Bash)
- Browser modern (Chrome, Firefox, Safari, Edge)

### Pengaturan

````bash
# Navigasi ke direktori lab
cd /path/to/race-condition-lab

# Instal dependensi
npm Strategi 1: Menggunakan Dashboard Frontend (Rekomendasi untuk Pemula)

1. **Login** dengan akun Anda atau buat akun baru
2. **Buka 2-3 tab browser** dengan URL yang sama
3. **Login di setiap tab** dengan akun yang berbeda (atau akun yang sama jika ingin test lebih extreme)
4. **Koordinasi aksi**: Klik tombol Transfer (atau Coupon/Checkout) secara bersamaan di beberapa tab
5. **Amati hasilnya**: Lihat bagaimana saldo bisa menjadi negatif atau kupon bisa dipakai berkali-kali
6. **Reset Lab**: Klik tombol "RESET LAB" untuk memulai ulang

**Contoh Pengujian Transfer**:
- Tab 1 (User A): Masukkan 800 dan klik "TRANSFER"
- Tab 2 (User B): Masukkan 800 dan klik "TRANSFER" (waktu klik hampir bersamaan)
- **Hasil**: Kedua transfer berhasil meskipun saldo total hanya 1000!

### Strategi 2: Menggunakan Skrip Exploit Python

```bash
# Instal dependensi (jika belum)
pip install requests

# Daftar/Login terlebih dahulu untuk mendapatkan sessionId
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "testpass"}'

# Response akan berisi sessionId. Copy dan gunakan di command berikut:

# Eksploitasi transfer dengan 5 request bersamaan
python3 exploit-race.py --endpoint transfer --threads 5 --session YOUR_SESSION_ID

# Eksploitasi kupon dengan 10 request bersamaan
python3 exploit-race.py --endpoint coupon --threads 10 --session YOUR_SESSION_ID

# Eksploitasi checkout dengan kuantitas custom
python3 exploit-race.py --endpoint checkout --threads 3 --quantity 5 --session YOUR_SESSION_ID
````

**Hasil yang Diharapkan**:

- **Transfer**: Saldo menjadi negatif ❌ (semua transfer berhasil meskipun exceeds balance)
- **Kupon**: Diskon diterapkan berkali-kali ❌ (semua request melihat kupon sebagai belum digunakan)
- **Checkout**: Stok menjadi negatif ❌ (semua request melihat stok > 0)

### Strategi 3: Menggunakan Skrip Exploit Node.js

_Catatan: Jalankan terlebih dahulu `npm install node-fetch@2` jika belum terinstal_

```bash
# Daftar dan dapatkan sessionId
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser2", "password": "testpass2"}'

# Eksploitasi dengan sessionId
node exploit-race.js --endpoint transfer --threads 5 --session YOUR_SESSION_ID

node exploit-race.js --endpoint coupon --threads 10 --session YOUR_SESSION_ID

node exploit-race.js --endpoint checkout --threads 3 --quantity 5 --session YOUR_SESSION_ID
```

### Strategi 4: Menggunakan Skrip Exploit Bash/Curl

````bash
# Buat skrip dapat dijalankan
chmod +x exploit-race.sh

# Daftar dan dapatkan sessionId
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser3", "password": "testpass3"}'

# Eksploitasi dengan sessionId
bash exploit-race.sh --endpoint transfer --threads 5 --session YOUR_SESSION_ID

bash exploit-race.sh --endpoint coupon --threads 10 --session YOUR_SESSION_ID

bash exploit-race.sh --endpoint checkout --threads 3 --quantity 5 --session YOUR_SESSION_ID

- Transfer: Saldo menjadi negatif ❌
- Kupon: Kupon masih ditandai sebagai digunakan tetapi diskon diterapkan berkali-kali ❌
- Checkout: Stok menjadi negatif ❌

### Menggunakan Skrip Exploit Node.js

_Catatan: Jalankan terlebih dahulu `npm install node-fetch@2` jika belum terinstal_

```bash
# Eksploitasi transfer dengan 5 request bersamaan
node exploit-race.js --endpoint transfer --threads 5

# Eksploitasi kupon dengan 10 request bersamaan
node exploit-race.js --endpoint coupon --threads 10

# Eksploitasi checkout dengan kuantitas custom
node exploit-race.js --endpoint checkout --threads 3 --quantity 5
````

### Menggunakan Skrip Exploit Bash/Curl

```bash
# Buat skrip dapat dijalankan
chmod +x exploit-race.sh

# Eksploitasi transfer dengan 5 request bersamaan
bash exploit-race.sh --endpoint transfer --threads 5

# Eksploitasi kupon dengan 10 request bersamaan
bash exploit-race.sh --endpoint coupon --threads 10

# Eksploitasi checkout dengan kuantitas custom
bash exploit-race.sh --endpoint checkout --threads 3 --quantity 5
```

## 📊 Referensi API

### Sistem Autentikasi

#### POST `/api/auth/signup`

Mendaftarkan akun pengguna baru dan membuat session.

**Request:**

```json
{
  "username": "newuser",
  "password": "password123"
}
```

**Response (Sukses):**

```json
{
  "success": true,
  "message": "Signup successful",
  "sessionId": "abc123def456ghi789",
  "username": "newuser"
}
```

**Response (Gagal):**

```json
{
  "success": false,
  "message": "Username already exists"
}
```

#### POST `/api/auth/login`

Masuk dengan username dan password yang terdaftar.

**Request:**

```json
{
  "username": "existinguser",
  "password": "password123"
}
```

**Response (Sukses):**

```json
{
  "success": true,
  "message": "Login successful",
  "sessionId": "xyz987abc654def321",
  "username": "existinguser"
}
```

**Response (Gagal):**

```json
{
  "success": false,
  "message": "Invalid username or password"
}
```

#### POST `/api/auth/logout`

Logout dan menghapus session.

**Request Header:**

```
x-session-id: abc123def456ghi789
```

**Response:**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### GET `/api/auth/me`

Mendapatkan informasi pengguna yang sedang login.

**Request Header:**

```
x-session-id: abc123def456ghi789
```

**Response:**

```json
{
  "username": "currentuser"
}
```

### Endpoint Vulnerable (Memerlukan Autentikasi)

Semua endpoint vulnerable memerlukan header `x-session-id`:

```
x-session-id: YOUR_SESSION_ID
```

#### GET `/api/status`

Mengembalikan status saat ini dari sistem bersama (shared state untuk semua pengguna).

**Response:**

```json
{
  "balance": 1000,
  "coupons": [
    {
      "code": "DISKON100",
      "used": false
    }
  ],
  "stock": 5,
  "timestamp": "2026-03-12T10:30:45.123Z"
}
```

#### POST `/api/transfer` ⚠️ RENTAN

Transfer uang dari rekening bersama (rentan terhadap race conditions).

**Request:**

```
Header: x-session-id: YOUR_SESSION_ID
Body: { "amount": 500 }
```

**Response (Sukses):**

```json
{
  "success": true,
  "message": "Transfer of $500 successful",
  "newBalance": 500,
  "timestamp": "2026-03-12T10:30:45.123Z"
}
```

**Response (Gagal - Rentan):**

```json
{
  "success": true,
  "message": "Transfer of $800 successful",
  "newBalance": -800,
  "timestamp": "2026-03-12T10:30:45.123Z"
}
```

#### POST `/api/coupon` ⚠️ RENTAN

Menerapkan kupon single-use untuk diskon 20% dari saldo bersama (rentan terhadap race conditions).

**Request:**

```
Header: x-session-id: YOUR_SESSION_ID
Body: {}
```

**Response (Sukses & Rentan):**

```json
{
  "success": true,
  "message": "Coupon DISKON100 applied successfully",
  "discountPercentage": 20,
  "discountAmount": "200.00",
  "newBalance": "800.00",
  "timestamp": "2026-03-12T10:30:45.123Z"
}
```

#### POST `/api/checkout` ⚠️ RENTAN

Membeli item dari stok bersama (rentan terhadap race conditions).

**Request:**

```
Header: x-session-id: YOUR_SESSION_ID
Body: { "quantity": 3 }
```

**Response (Sukses & Rentan):**

```json
{
  "success": true,
  "message": "Checkout successful",
  "quantity": 3,
  "pricePerUnit": 10,
  "totalPrice": 30,
  "newStock": 2,
  "timestamp": "2026-03-12T10:30:45.123Z"
}
```

#### POST `/api/reset`

Reset lab ke status awal (tidak memerlukan autentikasi, untuk keperluan testing).

**Response:**

```json
{
  "success": true,
  "message": "Lab state has been reset to initial values",
  "state": {
    "balance": 1000,
    "coupons": [{ "code": "DISKON100", "used": false }],
    "stock": 5
  },
  "timestamp": "2026-03-12T10:30:45.123Z"
}
```

## 🛡️ Cara Memperbaiki Kerentanan Ini

### 1. **Gunakan Operasi Atomic**

```javascript
// ❌ RENTAN
if (balance >= amount) {
  await sleep(2000);
  balance -= amount;
}

// ✅ DIPERBAIKI - Operasi atomic
balance = Math.max(balance - amount, balance); // Operasi tunggal
```

### 2. **Gunakan Transaksi Database**

```javascript
// ✅ DIPERBAIKI - Transaksi database
await db.transaction(async (trx) => {
  const current = await trx("accounts").where("id", userId).first();
  if (current.balance >= amount) {
    await trx("accounts")
      .where("id", userId)
      .update({
        balance: current.balance - amount,
      });
  }
});
```

### 3. **Gunakan Locks/Mutexes**

```javascript
const { Mutex } = require("async-lock");
const balanceMutex = new Mutex();

await balanceMutex.lock(async () => {
  if (balance >= amount) {
    balance -= amount;
  }
});
```

### 4. **Gunakan Pessimistic Locking**

```javascript
// Kunci baris sebelum membaca
const row = await db.raw("SELECT * FROM accounts WHERE id = ? FOR UPDATE", [
  userId,
]);
if (row.balance >= amount) {
  await update(row.id, { balance: row.balance - amount });
}
```

## 📁 Struktur Proyek

```
race-condition-lab/
├── server.js              # Server Express dengan sistem auth dan endpoint rentan
├── index.html             # Dashboard frontend dengan desain Neo-Brutalist
├── exploit-race.py        # Skrip pengujian bersamaan Python
├── exploit-race.js        # Skrip pengujian bersamaan Node.js
├── exploit-race.sh        # Skrip pengujian bersamaan Bash/Curl
├── package.json           # Dependensi dan skrip Node.js
└── README.md              # File ini
```

## 🧪 Contoh Pengujian

### Test 1: Double Spending (Transfer Bersamaan)

**Menggunakan Dashboard**:

1. Buka `http://localhost:3000` di 2 tab
2. Login dengan user1 di tab 1 dan user2 di tab 2
3. Di tab 1: Masukkan 900 dan klik Transfer
4. Di tab 2: Masukkan 900 dan klik Transfer (klik hampir bersamaan)
5. Lihat di kedua tab: Saldo bisa menjadi `-800` ❌

**Menggunakan Skrip Python**:

```bash
python3 exploit-race.py --endpoint transfer --threads 10 --amount 200 --session YOUR_SESSION_ID
```

**Diharapkan**: Saldo akhir menjadi negatif (misalnya, -1000)

### Test 2: Multiple Coupon Uses (Kupon Bersamaan)

**Menggunakan Dashboard**:

1. Buka `http://localhost:3000` di 3 tab
2. Login dengan user yang berbeda di setiap tab
3. Di setiap tab: Klik "CLAIM COUPON" bersamaan
4. Lihat hasilnya: Konsumsi balance melebihi 20% awal ❌

**Menggunakan Skrip Bash**:

```bash
bash exploit-race.sh --endpoint coupon --threads 5 --session YOUR_SESSION_ID
```

**Diharapkan**: Diskon diterapkan berkali-kali meskipun kupon single-use
via Dashboard)

```
[INFO] Login successful
[INFO] Fetching status...
Current Balance: $1000
[SUCCESS] Transfer of $800 successful
[SUCCESS] Transfer of $900 successful
[ERROR] Final Balance: $-700
⚠️  RACE CONDITION DETECTED!
```

### Exploit Berhasil (Python Script)

```
🔐 Race Condition Vulnerability Exploit (Python)
Target: http://localhost:3000

======================================================================
EXPLOITING: transfer
======================================================================

🔄 Resetting lab state...
Initial State:
  💰 Balance: $1000
  🎟️  Coupon (DISKON100): ❌ NOT USED
  📦 Stock: 5 units

🎯 Sending 10 concurrent requests (amount: $200 each)...

  Request 1: ✅ SUCCESS - Balance: $800
  Request 2: ✅ SUCCESS - Balance: $600
  Request 3: ✅ SUCCESS - Balance: $400
  Request 4: ✅ SUCCESS - Balance: $200
  Request 5: ✅ SUCCESS - Balance: $0
  Request 6: ✅ SUCCESS - Balance: $-200
  Request 7: ✅ SUCCESS - Balance: $-400
  Request 8: ✅ SUCCESS - Balance: $-600
  Request 9: ✅ SUCCESS - Balance: $-800
  Request 10: ✅ SUCCESS - Balance: $-1000

Final State (after 2.15s):
  💰 Balance: $-1000
  🎟️  Coupon (DISKON100): ❌ NOT USED
  📦 Stock: 5 units yang saling bergantung
3. **Implementasikan optimistic atau pessimistic locking** untuk akses sumber daya bersama
4. **Gunakan mutexes/semaphores** untuk melindungi section kritis dalam kode
5. **Uji race conditions** dengan alat pengujian bersamaan dan load testing
6. **Autentikasi ≠ Keamanan**: Sistem autentikasi yang baik tidak membuat race conditions hilang
7. **Review kode sensitif keamanan** dengan extra scrutiny, terutama check-then-act patterns
8. **Pertimbangkan eventual consistency** patterns untuk sistem terdistribusi
9. **Version control dan audit logs** untuk melacak perubahan sumber daya bersama
10. **Monitoring dan alerting** untuk mendeteksi aktivitas mencurigakan
  Total Transferred: $2000 (melebihi balance 2x!)

🎯 TOCTOU Vulnerability](https://en.wikipedia.org/wiki/Time-of-check_to_time-of-use)
- [Operasi Atomic](https://en.wikipedia.org/wiki/Linearizability)
- [Database Transactions](https://en.wikipedia.org/wiki/Database_transaction)
- [Mutex and Locks](https://en.wikipedia.org/wiki/Lock_(computer_science)
  Request 1: ✅ SUCCESS
  Request 2: ✅ SUCCESS
  Request 3: ✅ SUCCESS
  Request 4: ✅ SUCCESS dengan skenario multi-pengguna
- Mengapa operasi atomic dan locks sangat penting
- Bagaimana autentikasi dapat coexist dengan race condition vulnerabilities
- Cara menguji kerentanan ini dengan berbagai metode
- Cara memperbaiki kode yang rentan secara aman

**Jangan pernah** gunakan pola vulnerableOT USED
  📦 Stock: 5 units

ANALYSIS:

  Initial Balance: $1000
  Final Balance: $-4000
  Total Transferred: $5000

  🚨 VULNERABILITY EXPLOITED!
  Balance went negative! Race condition allowed transfers exceeding available balance.

======================================================================
```

## 🔐 Best Practices Keamanan

1. **Selalu gunakan operasi atomic** saat memeriksa dan memodifikasi status
2. **Gunakan transaksi database** untuk operasi multi-langkah
3. **Implementasikan optimistic atau pessimistic locking** jika diperlukan
4. **Gunakan mutexes/semaphores** untuk akses sumber daya bersama
5. **Uji race conditions** dengan alat pengujian bersamaan
6. **Review kode sensitif keamanan** dengan extra scrutiny
7. **Pertimbangkan eventual consistency** patterns untuk sistem terdistribusi

## 📚 Pembelajaran Lebih Lanjut

**sengaja rentan**

- [OWASP: Race Conditions](https://owasp.org/www-community/attacks/Race_condition)
- [CWE-362: Concurrent Execution using Shared Resource with Improper Synchronization](https://cwe.mitre.org/data/definitions/362.html)
- [Kerentanan TOCTOU](https://en.wikipedia.org/wiki/Time-of-check_to_time-of-use)
- [Operasi Atomic](https://en.wikipedia.org/wiki/Linearizability)

## 🎓 Penggunaan Pendidikan

Lab ini dirancang untuk **tujuan pendidikan semata**. Lab ini mendemonstrasikan:

- Bagaimana race conditions bekerja dalam praktik
- Mengapa pola yang aman penting
- Cara menguji kerentanan ini
- Cara memperbaiki kode yang rentan

**Jangan pernah** gunakan pola ini dalam kode produksi!

## 📄 Lisensi

MIT License - Educational Use Only

## ⚠️ Disclaimer

Kode ini sengaja rentan untuk tujuan pendidikan. Jangan gunakan pola-pola ini dalam sistem produksi. Selalu ikuti best practices keamanan saat mengembangkan aplikasi nyata.

---

**Selamat Belajar! 🚀**

Jika Anda memiliki pertanyaan atau saran, jangan ragu untuk berkontribusi atau membuka issue.
