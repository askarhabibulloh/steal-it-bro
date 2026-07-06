# PureTrack

PoC aplikasi tracker GPS offline berbasis browser. Tujuannya untuk mengecek apakah tracking lokasi tetap bisa dipakai tanpa ketergantungan ke Wi-Fi atau data provider, selama perangkat masih punya akses ke GPS dan browser mengizinkan geolocation.

## Isi project

- `index.html` - tampilan utama aplikasi
- `style.css` - styling antarmuka
- `app.js` - logika tracking, rendering, dan export
- `manifest.json` - konfigurasi PWA
- `service-worker.js` - cache offline untuk asset aplikasi

## Fitur

- tracking lokasi lewat `navigator.geolocation`
- hitung durasi, jarak, pace, dan elevation gain
- render jejak track di canvas
- ganti theme, accent color, dan mode tampilan 2D/3D
- export hasil rekaman ke GPX, SVG, dan PNG
- cache file aplikasi supaya bisa dibuka lagi saat offline setelah pernah dimuat

## Cara jalanin

Karena ini PWA dan memakai service worker, lebih aman dijalankan lewat local server, bukan buka file langsung dari filesystem.

Contoh:

```bash
python3 -m http.server 8000
```

Lalu buka:

```text
http://localhost:8000
```

## Cara pakai

1. Buka aplikasi di browser yang mendukung geolocation.
2. Izinkan akses lokasi.
3. Klik `Mulai` untuk mulai merekam.
4. Klik `Berhenti` saat selesai.
5. Kalau sudah ada track, export ke GPX, SVG, atau PNG.

## Catatan

- Aplikasi ini tetap butuh GPS dari perangkat. Offline di sini berarti tidak bergantung pada koneksi internet untuk proses tracking, bukan berarti lokasi bisa didapat tanpa hardware GPS.
- Akurasi lokasi tergantung perangkat, kondisi langit, dan izin browser.
- Data track disimpan di sesi browser dan preferensi disimpan di `localStorage`.
- Service worker hanya menyimpan cache asset aplikasi, bukan menyimpan riwayat track secara permanen.

## Batasan PoC

- belum ada sinkronisasi cloud
- belum ada manajemen file track
- belum ada autentikasi
- belum ada penyimpanan historis di backend

## Tujuan

Repositori ini dipakai untuk eksperimen kecil: apakah workflow tracking GPS bisa tetap sederhana, lebih privat, dan tetap berjalan tanpa koneksi internet aktif setelah aplikasi dimuat.
