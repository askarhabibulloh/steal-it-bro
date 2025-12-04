# XSS Lab JavaScript Version

Versi JavaScript dari XSS Lab menggunakan Node.js, Express, dan SQLite untuk pembelajaran Cross-Site Scripting (XSS) vulnerabilities.

## Fitur
- User authentication (register/login)
- Blog posts dengan gambar
- Sistem komentar
- SQLite database (tidak perlu setup database terpisah)
- Responsive design

## Instalasi

1. Install dependencies:
```bash
cd JavaScript
npm install
```

2. Jalankan aplikasi:
```bash
npm start
```

Atau untuk development dengan auto-reload:
```bash
npm run dev
```

3. Buka browser ke `http://localhost:3000`

## Struktur File
```
JavaScript/
├── server.js          # Main server file
├── package.json       # Dependencies
├── xss_lab.db        # SQLite database (auto-generated)
├── public/           # Static files
│   ├── css/
│   │   └── style.css
│   ├── images/
│   └── favicon.svg
└── README.md
```

## Perbedaan dengan Versi PHP
- Menggunakan SQLite instead of MySQL
- Single file server.js untuk semua routes
- Tidak perlu web server terpisah (Apache/Nginx)
- Auto-generated HTML templates dalam JavaScript

## Educational Purpose
Aplikasi ini dibuat untuk tujuan edukasi cybersecurity. Beberapa vulnerability sengaja dibiarkan untuk pembelajaran XSS attacks dalam lingkungan yang aman.