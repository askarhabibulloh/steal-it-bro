# 🔐 Laboratorium Kerentanan Race Condition

Sebuah laboratorium pendidikan Node.js/Express yang mendemonstrasikan kerentanan **TOCTOU (Time-of-Check to Time-of-Use)** race condition dengan delay yang disengaja dan simulasi database dalam memori.

## 📚 Tujuan Pembelajaran

Laboratorium ini mengajarkan:

- **Race Conditions**: Memahami bagaimana request yang bersamaan dapat saling mengganggu
- **Kerentanan TOCTOU**: Celah antara memeriksa suatu kondisi dan bertindak berdasarkannya
- **Implikasi Keamanan**: Bagaimana pola yang tidak aman dapat dieksploitasi dalam sistem dunia nyata
- **Pengujian Bersamaan**: Menggunakan Python, Node.js, dan Bash untuk menguji sistem yang rentan
- **Strategi Perbaikan**: Mengapa operasi atomic, transaksi database, dan kunci sangat penting

## 🎯 Skenario Kerentanan

### 1. Transfer Saldo (Double-Spending)

- **Kerentanan**: Multiple transfer bersamaan melebihi saldo yang tersedia
- **Cara Kerjanya**:
  1. Periksa apakah balance >= amount
  2. Tidur 2 detik (jendela race)
  3. Kurangi amount dari balance
- **Eksploitasi**: Dua transfer bersamaan sebesar $1000 dapat berhasil meskipun saldo hanya $1000

### 2. Penggunaan Kupon (Bypass Single-Use)

- **Kerentanan**: Kupon single-use dapat digunakan berkali-kali
- **Cara Kerjanya**:
  1. Periksa apakah coupon.used === false
  2. Tidur 2 detik (jendela race)
  3. Atur coupon.used = true dan terapkan diskon
- **Eksploitasi**: Dua request bersamaan dapat sama-sama menerapkan diskon yang sama

### 3. Penipisan Stok (Overselling)

- **Kerentanan**: Stok dapat menjadi negatif dengan menjual lebih dari yang tersedia
- **Cara Kerjanya**:
  1. Periksa apakah stock > 0
  2. Tidur 2 detik (jendela race)
  3. Kurangi stok
- **Eksploitasi**: Multiple checkout bersamaan dapat menjual lebih banyak item daripada yang tersedia

## 🚀 Memulai Dengan Cepat

### Prasyarat

- Node.js 14+ dan npm
- Python 3.6+ (untuk skrip exploit Python)
- Bash dan curl (untuk skrip exploit Bash)

### Pengaturan

```bash
# Navigasi ke direktori lab
cd /path/to/race-condition-lab

# Instal dependensi
npm install

# Mulai server
npm start
```

Server akan dimulai di `http://localhost:3000`

### Akses Dashboard

Buka browser Anda dan kunjungi: **http://localhost:3000**

Anda akan melihat dashboard real-time yang menampilkan:

- Saldo saat ini
- Status kupon
- Jumlah stok
- Tombol aksi untuk memicu kerentanan
- Log respons

## 🔥 Mengeksploitasi Kerentanan

### Menggunakan Dashboard Frontend

1. Klik salah satu tombol aksi (**Transfer**, **Use Coupon**, **Checkout**)
2. Masukkan nilai (jumlah untuk transfer, kuantitas untuk checkout)
3. Klik tombol dan pantau log respons
4. **Reset Lab** untuk memulihkan status awal

### Menggunakan Skrip Exploit Python

```bash
# Instal dependensi
pip install requests

# Eksploitasi transfer dengan 5 request bersamaan
python3 exploit-race.py --endpoint transfer --threads 5

# Eksploitasi kupon dengan 10 request bersamaan
python3 exploit-race.py --endpoint coupon --threads 10

# Eksploitasi checkout dengan kuantitas custom
python3 exploit-race.py --endpoint checkout --threads 3 --quantity 5
```

**Hasil yang Diharapkan**: Status akhir menunjukkan kerentanan

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
```

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

### GET `/api/status`

Mengembalikan status saat ini dari sistem.

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
  "timestamp": "2024-03-12T10:30:45.123Z"
}
```

### POST `/api/transfer`

Transfer uang dari rekening (rentan terhadap race conditions).

**Request:**

```json
{
  "amount": 500
}
```

**Response (Sukses):**

```json
{
  "success": true,
  "message": "Transfer of $500 successful",
  "newBalance": 500,
  "timestamp": "2024-03-12T10:30:45.123Z"
}
```

### POST `/api/coupon`

Menerapkan kupon single-use untuk diskon 20% (rentan terhadap race conditions).

**Request:**

```json
{}
```

**Response (Sukses):**

```json
{
  "success": true,
  "message": "Coupon DISKON100 applied successfully",
  "discountPercentage": 20,
  "discountAmount": "200.00",
  "newBalance": "800.00",
  "timestamp": "2024-03-12T10:30:45.123Z"
}
```

### POST `/api/checkout`

Membeli item dari stok (rentan terhadap race conditions).

**Request:**

```json
{
  "quantity": 3
}
```

**Response (Sukses):**

```json
{
  "success": true,
  "message": "Checkout successful",
  "quantity": 3,
  "pricePerUnit": 10,
  "totalPrice": 30,
  "newStock": 2,
  "timestamp": "2024-03-12T10:30:45.123Z"
}
```

### POST `/api/reset`

Reset lab ke status awal.

**Request:**

```json
{}
```

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
  "timestamp": "2024-03-12T10:30:45.123Z"
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
├── server.js              # Server Express dengan endpoint rentan
├── index.html             # Dashboard frontend (Tailwind CSS)
├── exploit-race.py        # Skrip pengujian bersamaan Python
├── exploit-race.js        # Skrip pengujian bersamaan Node.js
├── exploit-race.sh        # Skrip pengujian bersamaan Bash/Curl
├── package.json           # Dependensi dan skrip Node.js
└── README.md              # File ini
```

## 🧪 Contoh Pengujian

### Test 1: Double Spending

```bash
# Terminal 1: Mulai server
npm start

# Terminal 2: Jalankan exploit
python3 exploit-race.py --endpoint transfer --threads 10 --amount 500
```

**Diharapkan**: Saldo menjadi negatif (misalnya, -4000)

### Test 2: Multiple Coupon Uses

```bash
bash exploit-race.sh --endpoint coupon --threads 5
```

**Diharapkan**: Saldo dikurangi berkali-kali meskipun kupon single-use

### Test 3: Stock Overselling

```bash
node exploit-race.js --endpoint checkout --threads 15 --quantity 1
```

**Diharapkan**: Stok menjadi negatif (misalnya, -10)

## 📝 Contoh Output Konsol

### Exploit Berhasil (Transfer)

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

🎯 Sending 5 concurrent requests...

  Request 1: ✅ SUCCESS
  Request 2: ✅ SUCCESS
  Request 3: ✅ SUCCESS
  Request 4: ✅ SUCCESS
  Request 5: ✅ SUCCESS

Final State (after 2.15s):
  💰 Balance: $-4000
  🎟️  Coupon (DISKON100): ❌ NOT USED
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
