# Room Scheduling Dashboard

Static dashboard untuk menampilkan data penggunaan ruangan dari Google Sheets CSV.

## What changed

- UI diubah ke neo brutalist style yang terinspirasi dari `REFERENSI.html`.
- CSV semua ruang dimuat secara paralel, tetapi tabel tetap ditampilkan berurutan.
- Parsing CSV memakai `papaparse.min.js` lokal dengan fallback parser bawaan.
- Backend rekomendasi dimatikan supaya halaman bisa dijalankan sebagai static files.

## File utama

- `index.html` - halaman utama.
- `styles.css` - tema neo brutalist.
- `scriptasdf.js` - fetch CSV paralel dan render tabel.
- `parserasdf.js` - parser CSV dengan fallback.
- `slot_data.js` - stub agar tidak ada panggilan backend.
- `papaparse.min.js` - salinan lokal PapaParse.

## Run as static files

Jalankan server statis sederhana dari folder project:

```bash
python3 -m http.server 8000
```

Lalu buka `http://localhost:8000`.

## Notes

- Tidak ada lagi dependency ke Flask backend.
- Google Sheets CSV tetap harus bisa diakses dari browser.
- Jika PapaParse gagal dimuat, dashboard otomatis memakai parser fallback.
