# To-Do List dengan Timer

Aplikasi manajemen tugas berbasis web yang menyertakan fungsi pelacakan waktu (stopwatch) untuk masing-masing item tugas.

## Deskripsi Fitur

- **Timer Per Tugas**: Setiap item daftar tugas memiliki stopwatch independen untuk mencatat durasi aktivitas.
- **Manajemen Timer**: Sistem hanya mengizinkan satu timer berjalan dalam satu waktu. Jika timer baru dimulai, timer yang sedang aktif akan berhenti secara otomatis.
- **Penyimpanan Data**: Menggunakan LocalStorage browser untuk menyimpan data tugas dan akumulasi waktu sehingga data tetap ada setelah halaman dimuat ulang.
- **Status Tugas**: Fitur untuk menandai tugas selesai, menghapus tugas, dan memfilter tampilan berdasarkan status (Semua, Aktif, Selesai).
- **Otomasi**: Timer akan berhenti secara otomatis jika sebuah tugas ditandai sebagai selesai.

## Cara Penggunaan

1. Tambahkan teks tugas pada kolom input dan simpan.
2. Gunakan tombol play pada item tugas untuk memulai penghitungan waktu.
3. Gunakan tombol pause untuk menghentikan penghitungan waktu sementara.
4. Klik pada checkbox untuk menandai tugas telah selesai.
5. Klik tombol hapus untuk menghilangkan tugas dari daftar.

## Spesifikasi Teknis

- Antarmuka: HTML5 dan CSS3.
- Logika: Vanilla JavaScript.
- Ikonografi: Font Awesome.
- Tipografi: Google Fonts (Outfit).
- Penyimpanan: Web Storage API (LocalStorage).

## Struktur File

- index.html: Struktur dokumen dan elemen UI.
- style.css: Definisi gaya, layout, dan animasi.
- script.js: Logika fungsionalitas tugas dan sistem timer.
- README.md: Dokumentasi teknis aplikasi.
