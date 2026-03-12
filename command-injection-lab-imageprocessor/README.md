# Lab Command Injection: Pemroses Gambar

Lab ini adalah latihan langsung untuk memahami dan mengeksploitasi kerentanan command injection di aplikasi web. Aplikasi ini adalah layanan pemrosesan gambar sederhana yang sengaja dibuat rentan.

## Menjalankan Lab

Untuk menjalankan lab, Anda harus sudah menginstal `docker` dan `docker-compose`.

1.  Salin (clone) repositori ini.
2.  Buka direktori yang berisi file `docker-compose.yml`.
3.  Jalankan perintah berikut untuk membangun dan memulai aplikasi:

    ```bash
    docker-compose up -d
    ```

4.  Aplikasi akan tersedia di [http://localhost:5000](http://localhost:5000).

## Kerentanan

Aplikasi ini menggunakan perintah `convert` dari ImageMagick untuk mengubah ukuran gambar. Perintah tersebut dibuat dengan menggabungkan input pengguna secara langsung ke dalam sebuah string, yang kemudian dieksekusi oleh shell.

Kode yang rentan ada di `app.py`:

```python
def execute_image_magick(input_path, output_path, width):
    """
    Execute ImageMagick command with user input (intentionally vulnerable).
    This function demonstrates command injection vulnerability.
    """
    # VULNERABLE: shell=True with direct string concatenation
    command = f"convert {input_path} -resize {width}x {output_path}"
    
    try:
        # Execute command with shell=True (vulnerable to injection)
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=10
        )
        
        # ... (sisa fungsi)
```

Parameter `width` diambil dari pengguna dan tidak dibersihkan sebelum digunakan dalam perintah. Hal ini memungkinkan penyerang untuk menyisipkan perintah sewenang-wenang.

## Tujuan

Tujuan Anda adalah mengeksploitasi kerentanan command injection ini untuk membaca isi file flag yang terletak di `/var/secret_data_flag.txt`.

## Petunjuk

*   Anda dapat menggunakan pemisah perintah shell seperti `;`, `&&`, atau `||` untuk menyisipkan perintah.
*   Output dari perintah yang disisipkan akan ditampilkan di halaman web.
*   Anda dapat menggunakan perintah seperti `ls`, `cat`, `whoami`, dll. untuk menjelajahi sistem dan menemukan flag.
*   Parameter `width` adalah titik injeksi.

## Penafian

Lab ini hanya untuk tujuan pendidikan. Jangan gunakan teknik yang dipelajari di sini pada sistem yang tidak Anda miliki atau tidak memiliki izin untuk diuji.
