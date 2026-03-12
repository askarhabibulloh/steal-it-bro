# 🏁 Race Condition Lab

Laboratorium pendidikan untuk memahami dan mengeksploitasi **race condition vulnerabilities** dalam aplikasi web dengan sistem autentikasi multi-user. Dibangun dengan Node.js/Express dan antarmuka **Neo-Brutalist** yang modern.

## 🎯 Tujuan Pembelajaran

- Memahami **TOCTOU (Time-of-Check to Time-of-Use)** vulnerabilities
- Mengenal pola **check-then-act** yang rentan race condition
- Mempelajari dampak race condition dalam sistem **multi-user**
- Menguji exploit dengan berbagai metode (dashboard, scripts)
- Mempelajari cara memperbaiki kerentanan ini

## ✨ Fitur Terbaru

### 🎨 Neo-Brutalist UI

- Desain bold dengan border tebal dan hard shadows
- Layout desktop-optimized (1200px container)
- Responsive design dengan breakpoints yang tepat
- Real-time log dengan warna kode

### 🔐 Sistem Autentikasi Lengkap

- Signup, Login, Logout dengan session management
- Per-user balance (setiap user punya saldo sendiri)
- Session-based authentication dengan header `x-session-id`

### 🏪 E-commerce Simulation

- **Transfer**: Kirim uang ke user lain
- **Checkout**: Beli produk HP ($50) atau Laptop ($100)
- **Coupon DISKON100**: Dapatkan checkout gratis
- **Shared Stock**: Stok HP dan Laptop dibagi semua user
- **Items Shipped**: Track total item yang sudah dibeli

### ⚠️ Vulnerable Endpoints

- **POST `/api/transfer`**: Race condition pada per-user balance
- **POST `/api/checkout`**: Race condition pada shared stock dan coupon count
- **Intentional delay**: 2 detik untuk memperlebar race window

## 🚀 Quick Start

### Prerequisites

- Node.js 14+ dan npm
- Browser modern (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone repository (jika belum)
# cd ke direktori lab

# Install dependencies
npm install

# Start server
node server.js
```

Server akan berjalan di `http://localhost:3000`

## 🖥️ Menggunakan Dashboard

### 1. Akses Dashboard

Buka `http://localhost:3000` di browser.

### 2. Login atau Signup

- **Demo account**: `user1` / `pass1`
- Atau buat account baru melalui form Signup

### 3. Dashboard Features

- **Header**: Username dan balance saat ini
- **Shared State**: Coupon count dan stock HP/Laptop (dibagi semua user)
- **Transfer**: Kirim uang ke user lain
- **Checkout**: Beli produk dengan optional coupon
- **Log**: Real-time log dengan warna kode (hijau=sukses, oranye=error)
- **Reset**: Reset semua state ke kondisi awal

### 4. Testing Race Conditions

**Metode 1: Multiple Browser Tabs**

```bash
# Tab 1: Login dengan user1
# Tab 2: Login dengan user2 (atau user yang sama)
# Lakukan aksi bersamaan di kedua tab:
# - Transfer amount besar
# - Checkout dengan quantity besar
# - Gunakan coupon DISKON100
```

**Metode 2: Multiple User Sessions**

```bash
# Buka terminal berbeda
# Session 1: curl dengan sessionId user1
# Session 2: curl dengan sessionId user2
# Kirim request bersamaan
```

## 🔧 API Reference

### Authentication Endpoints

#### POST `/api/auth/signup`

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass"}'
```

#### POST `/api/auth/login`

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user1","password":"pass1"}'
```

#### POST `/api/auth/logout`

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "x-session-id: YOUR_SESSION_ID"
```

### Vulnerable Endpoints (Require Authentication)

#### GET `/api/status`

```bash
curl http://localhost:3000/api/status \
  -H "x-session-id: YOUR_SESSION_ID"
```

#### POST `/api/transfer` ⚠️ VULNERABLE

```bash
curl -X POST http://localhost:3000/api/transfer \
  -H "Content-Type: application/json" \
  -H "x-session-id: YOUR_SESSION_ID" \
  -d '{"amount":500,"recipientUsername":"user2"}'
```

**Vulnerability**: Check balance → sleep 2s → update balance

#### POST `/api/checkout` ⚠️ VULNERABLE

```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -H "x-session-id: YOUR_SESSION_ID" \
  -d '{"quantity":2,"productType":"hp","couponCode":"DISKON100"}'
```

**Vulnerability**: Check stock/coupon → sleep 2s → update stock/coupon

#### GET `/api/coupons/available`

```bash
curl http://localhost:3000/api/coupons/available
```

### Utility Endpoints

#### POST `/api/reset`

```bash
curl -X POST http://localhost:3000/api/reset
```

#### GET `/api/health`

```bash
curl http://localhost:3000/api/health
```

## 🧪 Exploit Scripts

### Python (`exploit-race.py`)

```bash
# Dapatkan sessionId terlebih dahulu
SESSION_ID="your_session_id_here"

# Exploit transfer dengan 5 concurrent requests
python3 exploit-race.py --endpoint transfer --threads 5 --session $SESSION_ID

# Exploit checkout dengan 3 concurrent requests
python3 exploit-race.py --endpoint checkout --threads 3 --session $SESSION_ID
```

### Node.js (`exploit-race.js`)

```bash
# Install dependencies jika perlu
npm install node-fetch@2

# Exploit dengan sessionId
node exploit-race.js --endpoint transfer --threads 5 --session $SESSION_ID
```

### Bash (`exploit-race.sh`)

```bash
# Make executable
chmod +x exploit-race.sh

# Exploit dengan sessionId
bash exploit-race.sh --endpoint checkout --threads 3 --session $SESSION_ID
```

## 🎯 Skenario Vulnerable

### 1. Transfer Overspending

**Scenario**: User A transfer $800, User B transfer $800 bersamaan
**Expected**: Salah satu gagal karena balance tidak cukup
**Actual**: Keduanya berhasil → balance negatif
**Root Cause**: Check balance → sleep → update (TOCTOU)

### 2. Checkout Overselling

**Scenario**: Multiple users checkout HP bersamaan
**Expected**: Stok cukup untuk semua atau beberapa gagal
**Actual**: Semua berhasil → stok negatif
**Root Cause**: Check stock → sleep → update stock

### 3. Coupon Reuse

**Scenario**: Multiple users pakai DISKON100 bersamaan
**Expected**: Hanya 1 user dapat checkout gratis
**Actual**: Multiple users dapat checkout gratis
**Root Cause**: Check coupon count → sleep → update count

## 🛡️ Cara Memperbaiki

### 1. Atomic Operations

```javascript
// ❌ VULNERABLE
if (balance >= amount) {
  await sleep(2000);
  balance -= amount;
}

// ✅ FIXED - Atomic operation
balance = Math.max(balance - amount, 0);
```

### 2. Database Transactions

```javascript
// ✅ FIXED - Database transaction
await db.transaction(async (trx) => {
  const user = await trx("users").where("id", userId).first();
  if (user.balance >= amount) {
    await trx("users")
      .where("id", userId)
      .update({ balance: user.balance - amount });
  }
});
```

### 3. Mutex/Locks

```javascript
const { Mutex } = require("async-mutex");
const mutex = new Mutex();

await mutex.runExclusive(async () => {
  if (balance >= amount) {
    balance -= amount;
  }
});
```

### 4. Optimistic Locking

```javascript
// ✅ FIXED - Optimistic locking dengan version
const result = await db("users")
  .where("id", userId)
  .andWhere("balance", ">=", amount)
  .andWhere("version", currentVersion)
  .update({
    balance: db.raw("balance - ?", [amount]),
    version: currentVersion + 1,
  });

if (result === 0) {
  // Concurrent modification detected
  throw new Error("Race condition detected");
}
```

## 📁 Project Structure

```
race-condition-lab/
├── server.js                 # Express server dengan vulnerable endpoints
├── index.html               # Dashboard frontend (HTML only)
├── public/
│   ├── css/
│   │   └── style.css        # All CSS styles (Neo-Brutalist design)
│   └── js/
│       └── app.js           # All JavaScript logic
├── exploit-race.py          # Python exploit script
├── exploit-race.js          # Node.js exploit script
├── exploit-race.sh          # Bash exploit script
├── package.json             # Dependencies
├── package-lock.json        # Lock file
└── README.md                # This file
```

## 🧠 Key Concepts

### TOCTOU (Time-of-Check to Time-of-Use)

- **Check**: Memeriksa kondisi (balance >= amount, stock > 0)
- **Window**: Delay atau concurrent execution
- **Use**: Mengupdate berdasarkan check yang sudah kadaluarsa
- **Result**: State inconsistency

### Race Condition vs. Deadlock

- **Race Condition**: Multiple threads access shared resource, result depends on timing
- **Deadlock**: Multiple threads waiting for each other, no progress
- **This Lab**: Focus on race conditions, not deadlocks

### Shared Resources in This Lab

1. **Per-user balance**: Di-share antara concurrent requests dari user yang sama
2. **Shared stock**: HP dan Laptop stock dibagi semua users
3. **Coupon count**: DISKON100 count dibagi semua users

## 🔍 Testing Methodology

### 1. Manual Testing (Dashboard)

- Multiple browser tabs/windows
- Different user sessions
- Coordinated simultaneous clicks

### 2. Automated Testing (Scripts)

- Concurrent HTTP requests
- Parameter variation (amount, quantity)
- Timing analysis

### 3. Expected Results

- **Success**: Race condition exploited (negative balance/stock)
- **Failure**: Proper synchronization (requests fail appropriately)

## 📚 Learning Resources

- [OWASP: Race Conditions](https://owasp.org/www-community/attacks/Race_condition)
- [CWE-362: Concurrent Execution using Shared Resource](https://cwe.mitre.org/data/definitions/362.html)
- [TOCTOU Vulnerability](https://en.wikipedia.org/wiki/Time-of-check_to_time-of-use)
- [Atomic Operations](https://en.wikipedia.org/wiki/Linearizability)

## ⚠️ Important Notes

### Educational Purpose Only

- Kode ini **sengaja rentan** untuk tujuan pendidikan
- **Jangan gunakan** pattern ini dalam production code
- Selalu implementasikan proper synchronization

### Safety Features

- **Reset endpoint**: Untuk mengembalikan state ke awal
- **Auto-logout**: Session management yang proper
- **Input validation**: Basic validation pada semua endpoints

### Real-world Implications

- Financial systems: Double spending, overdraft
- E-commerce: Overselling, coupon abuse
- Inventory systems: Stock inconsistency
- Booking systems: Double booking

## 🚨 Disclaimer

**FOR EDUCATIONAL PURPOSES ONLY**

Lab ini dirancang untuk:

- Memahami race condition vulnerabilities
- Mempelajari testing methodologies
- Mengimplementasikan proper fixes

**Jangan pernah** deploy code dengan pattern vulnerable ke production environment.

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - Educational Use Only

---

**Happy Learning! 🚀**

Jika ada pertanyaan atau menemukan bug, silakan buka issue di repository.
