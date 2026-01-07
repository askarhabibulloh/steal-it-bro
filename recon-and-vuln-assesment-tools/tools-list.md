| No. | Nama Tool           | Metode Instalasi     | Deskripsi Singkat                                               | Keterangan API KEY |
| :-- | :------------------ | :------------------- | :-------------------------------------------------------------- | :----------------- |
| 1.  | `amass`             | `go install`         | Enumerasi subdomain tingkat lanjut menggunakan berbagai teknik. | Opsional           |
| 2.  | `subfinder`         | `go install`         | Enumerasi subdomain pasif dari banyak sumber data.              | Opsional           |
| 3.  | `assetfinder`       | `go install`         | Menemukan domain dan subdomain yang terkait dengan target.      | Tidak              |
| 4.  | `findomain`         | Download Binary      | Alat enumerasi subdomain yang sangat cepat.                     | Opsional           |
| 5.  | `sublist3r`         | `pip install`        | Enumerasi subdomain menggunakan mesin pencari.                  | Tidak              |
| 6.  | `github-subdomains` | `go install`         | Menemukan subdomain melalui repositori GitHub.                  | Memerlukan API     |
| 7.  | `dnsx`              | `go install`         | Utilitas DNS untuk memvalidasi dan query data DNS.              | Tidak              |
| 8.  | `ffuf`              | `go install`         | _Fuzzer_ web untuk _brute-force_ subdomain atau direktori.      | Tidak              |
| 9.  | `httpx`             | `go install`         | _Prober_ HTTP/HTTPS untuk mengidentifikasi server web aktif.    | Tidak              |
| 10. | `waybackurls`       | `go install`         | Mengambil URL dari Wayback Machine milik Internet Archive.      | Tidak              |
| 11. | `gau`               | `go install`         | Mengambil URL yang diketahui dari berbagai sumber online.       | Tidak              |
| 12. | `nuclei`            | `go install`         | Pemindai kerentanan cepat berbasis template.                    | Tidak              |
| 13. | `nikto`             | `apt-get`            | Pemindai kerentanan server web klasik.                          | Tidak              |
| 14. | `gowitness`         | `go install`         | Mengambil tangkapan layar (screenshot) dari situs web.          | Tidak              |
| 15. | `nmap`              | `apt-get`            | Pemindai jaringan untuk menemukan host dan layanan.             | Tidak              |
| 16. | `crtsh`             | (Virtual / API Call) | Mencari data dari log transparansi sertifikat.                  | Tidak              |
| 17. | `naabu`             | `go install`         | Pemindai port yang cepat dan andal.                             | Tidak              |
| 18. | `gobuster`          | `go install`         | Melakukan _brute-force_ untuk direktori/file dan subdomain DNS. | Tidak              |
| 19. | `arjun`             | `pip install`        | Menemukan parameter HTTP yang tersembunyi.                      | Tidak              |
| 20. | `wappalyzer-cli`    | `npm install`        | Mengidentifikasi teknologi yang digunakan di situs web.         | Tidak              |
| 21. | `shodan (CLI)`      | `pip install`        | Antarmuka baris perintah untuk mesin pencari Shodan.            | Memerlukan API     |
| 22. | `sqlmap`            | `apt-get` / `pip`    | Alat deteksi dan eksploitasi injeksi SQL otomatis.              | Tidak              |
| 23. | `aquatone`          | `go install`         | Inspeksi visual situs web dalam jumlah besar.                   | Tidak              |
| 24. | `katana`            | `go install`         | Web crawler dan spider generasi baru yang sangat cepat.         | Tidak              |
| 25. | `dirsearch`         | `pip install`        | Alat brute-force direktori/path web (alternatif Gobuster).      | Tidak              |
| 26. | `wpscan`            | `gem install`        | Pemindai keamanan khusus untuk CMS WordPress.                   | Opsional           |
| 27. | `subjack`           | `go install`         | Mendeteksi kerentanan subdomain takeover.                       | Tidak              |
| 28. | `trufflehog`        | `go install`         | Mencari kredensial/rahasia yang bocor di kode sumber.           | Tidak              |
| 29. | `masscan`           | `apt-get`            | Pemindai port internet-scale (sangat cepat).                    | Tidak              |
| 30. | `whatweb`           | `apt-get`            | Mengidentifikasi CMS, platform blog, paket statistik, dll.      | Tidak              |
| 31. | `dalfox`            | `go install`         | Pemindai kerentanan XSS (Cross-Site Scripting) yang kuat.       | Tidak              |
| 32. | `commix`            | `pip install`        | Alat eksploitasi otomatis untuk kerentanan Command Injection.   | Tidak              |
| 33. | `hydra`             | `apt-get`            | Pemecah kata sandi login jaringan (SSH, FTP, Web, dll).         | Tidak              |
| 34. | `theHarvester`      | `pip install`        | Mengumpulkan email, subdomain, dan nama dari sumber publik.     | Opsional           |
| 35. | `searchsploit`      | `apt-get` / `git`    | Pencarian offline untuk database Exploit-DB.                    | Tidak              |
| 36. | `feroxbuster`       | Download Binary      | Penemuan konten rekursif yang cepat (alternatif Gobuster).      | Tidak              |
| 37. | `XSStrike`          | `git` / `pip`        | Suite deteksi XSS canggih dengan fuzzing cerdas.                | Tidak              |
| 38. | `metasploit`        | Installer Script     | Framework eksploitasi dan pemindaian kerentanan yang luas.      | Tidak              |
| 39. | `recon-ng`          | `git` / `pip`        | Framework rekognisi web lengkap (modular).                      | Opsional           |
| 40. | `paramspider`       | `git` / `pip`        | Mining parameter dari arsip web (passive).                      | Tidak              |
| 41. | `rustscan`          | `cargo` / `.deb`     | Port scanner modern yang sangat cepat dan cerdas.               | Tidak              |
| 42. | `LinkFinder`        | `pip` / `git`        | Menemukan endpoint tersembunyi dalam file JavaScript.           | Tidak              |
| 43. | `cloud_enum`        | `pip` / `git`        | Enumerasi sumber daya publik di AWS, Azure, dan GCP.            | Tidak              |
| 44. | `kiterunner`        | `go install`         | Penemuan endpoint dan rute API (context-aware).                 | Tidak              |
| 45. | `wafw00f`           | `pip install`        | Mengidentifikasi dan memetakan Web Application Firewall.        | Tidak              |
| 46. | `joomscan`          | `git` / `apt`        | Pemindai kerentanan khusus untuk CMS Joomla.                    | Tidak              |

## Status Docker Friendly

Berikut adalah analisis satu per satu mengenai apakah tools dalam daftar tersebut **Docker Friendly** atau tidak, beserta alasannya.

Secara umum, hampir semua _tools_ berbasis CLI (Command Line Interface) untuk keamanan siber sangat **Docker Friendly**. Docker justru sering menjadi metode instalasi yang disarankan untuk menghindari konflik _dependency_ (ketergantungan) pada sistem operasi utama (host).

### Detail Analisis

1. **`amass`**

   - **Status:** **Docker Friendly**
   - **Alasan:** Tersedia _official image_ dari pengembang. Karena ditulis dalam Go, ia dapat dikompilasi menjadi _binary_ statis yang berjalan sempurna di container ringan (Alpine).

2. **`subfinder`**

   - **Status:** **Docker Friendly**
   - **Alasan:** ProjectDiscovery menyediakan _official image_. Tidak memiliki dependensi eksternal yang rumit, hanya butuh koneksi internet.

3. **`assetfinder`**

   - **Status:** **Docker Friendly**
   - **Alasan:** _Binary_ Go sederhana. Sangat mudah dibuatkan Dockerfile (cukup `COPY` binary-nya). Tidak butuh akses _root_ khusus.

4. **`findomain`**

   - **Status:** **Docker Friendly**
   - **Alasan:** _Binary_ Rust yang berdiri sendiri (_standalone_). Berjalan sangat baik di Docker tanpa dependensi tambahan.

5. **`sublist3r`**

   - **Status:** **Docker Friendly**
   - **Alasan:** Skrip Python. Mudah dijalankan di Docker asalkan `requirements.txt` diinstal. Mengisolasi _library_ Python di Docker justru lebih bersih daripada di host.

6. **`github-subdomains`**

   - **Status:** **Docker Friendly**
   - **Alasan:** _Binary_ Go sederhana. Hanya melakukan _query_ ke API GitHub, tidak ada interaksi sistem yang kompleks.

7. **`dnsx`**

   - **Status:** **Docker Friendly**
   - **Alasan:** ProjectDiscovery menyediakan _official image_. Sangat efisien di dalam container untuk resolusi DNS massal.

8. **`ffuf`**

   - **Status:** **Docker Friendly**
   - **Alasan:** Tersedia _official image_. Karena ini adalah alat HTTP fuzzer, ia tidak memerlukan akses level kernel, hanya koneksi jaringan standar.

9. **`httpx`**

   - **Status:** **Docker Friendly**
   - **Alasan:** ProjectDiscovery menyediakan _official image_. Berjalan identik dengan di host.

10. **`waybackurls`**

    - **Status:** **Docker Friendly**
    - **Alasan:** _Binary_ Go sederhana yang hanya melakukan HTTP GET ke API Wayback Machine.

11. **`gau` (Get All Urls)**

    - **Status:** **Docker Friendly**
    - **Alasan:** Sama seperti `waybackurls`, _binary_ Go yang ringan dan tidak butuh akses sistem khusus.

12. **`nuclei`**

    - **Status:** **Docker Friendly**
    - **Alasan:** ProjectDiscovery menyediakan _official image_. Sangat populer dijalankan via Docker untuk CI/CD pipeline. Template bisa di-mount via volume.

13. **`nikto`**

    - **Status:** **Docker Friendly**
    - **Alasan:** Tersedia _image_ komunitas/resmi. Karena berbasis Perl dan banyak dependensi lama, menjalankannya di Docker jauh lebih aman dan bersih daripada mengotori host.

14. **`gowitness`**

    - **Status:** **Docker Friendly (dengan catatan)**
    - **Alasan:** Membutuhkan browser (Chrome/Chromium) secara _headless_ untuk mengambil screenshot. Image Docker-nya akan lebih besar karena harus berisi browser tersebut, tetapi tetap berjalan lancar.

15. **`nmap`**

    - **Status:** **Docker Friendly (dengan catatan)**
    - **Alasan:** Untuk pemindaian standar (TCP Connect), ia berjalan lancar. Namun, untuk fitur unggulan seperti OS Detection (`-O`) atau SYN Scan (`-sS`), Nmap butuh akses _raw sockets_. Di Docker, Anda harus menjalankannya dengan `--privileged` atau `--cap-add=NET_ADMIN` agar perilakunya 100% sama dengan host (root).

16. **`crtsh`**

    - **Status:** **Docker Friendly**
    - **Alasan:** Biasanya berupa skrip sederhana (Python/Bash) yang melakukan _query_ ke database crt.sh via PostgreSQL atau HTTP. Mudah dikemas.

17. **`naabu`**

    - **Status:** **Docker Friendly (dengan catatan)**
    - **Alasan:** Sama seperti Nmap. Untuk kecepatan maksimal (SYN scan), ia butuh hak akses `libpcap` yang memerlukan _flag_ `--privileged` atau kapabilitas jaringan khusus pada container.

18. **`gobuster`**

    - **Status:** **Docker Friendly**
    - **Alasan:** Tersedia _official image_. Alat _brute-force_ HTTP/DNS standar yang tidak butuh akses kernel khusus.

19. **`arjun`**

    - **Status:** **Docker Friendly**
    - **Alasan:** Skrip Python murni. Sangat mudah dikemas dalam container Python.

20. **`wappalyzer-cli`**

    - **Status:** **Docker Friendly**
    - **Alasan:** Berbasis Node.js/npm. Docker adalah lingkungan native yang sangat baik untuk aplikasi Node.

21. **`shodan (CLI)`**

    - **Status:** **Docker Friendly**
    - **Alasan:** Pustaka Python sederhana. Hanya butuh API Key yang bisa dioper (pass) sebagai _environment variable_.

22. **`sqlmap`**

    - **Status:** **Docker Friendly**
    - **Alasan:** Tersedia _official image_. Mengisolasi sqlmap di Docker mencegah konflik versi Python di host.

23. **`aquatone`**

    - **Status:** **Docker Friendly (dengan catatan)**
    - **Alasan:** Mirip `gowitness`. Membutuhkan instalasi Chromium/Chrome di dalam container untuk melakukan inspeksi visual/screenshot.

24. **`katana`**

    - **Status:** **Docker Friendly (dengan catatan)**
    - **Alasan:** Crawler modern ini mendukung _headless browsing_. Jika mode _headless_ diaktifkan, image Docker harus memiliki browser terinstal. Jika hanya mode standar (HTTP), sangat ringan.

25. **`dirsearch`**

    - **Status:** **Docker Friendly**
    - **Alasan:** Skrip Python populer. Tersedia Dockerfile resmi di repositorinya.

26. **`wpscan`**

    - **Status:** **Docker Friendly**
    - **Alasan:** Tersedia _official image_. Karena berbasis Ruby (Gems), menjalankannya di Docker sangat disarankan untuk menghindari masalah versi Ruby di host.

27. **`subjack`**

    - **Status:** **Docker Friendly**
    - **Alasan:** _Binary_ Go. Hanya melakukan pengecekan DNS CNAME. Sangat ringan.

28. **`trufflehog`**

    - **Status:** **Docker Friendly**
    - **Alasan:** Tersedia _official image_. Sangat sering digunakan dalam pipeline CI/CD berbasis Docker untuk memindai _secrets_.

29. **`masscan`**

    - **Status:** **Docker Friendly (dengan catatan)**
    - **Alasan:** Masscan memiliki _TCP stack_ sendiri (bypass kernel). Wajib dijalankan dengan `--privileged` dan `--net=host` agar berfungsi benar dan menangkap paket balasan. Tanpa itu, ia tidak akan bekerja seperti di host.

30. **`whatweb`**

    - **Status:** **Docker Friendly**
    - **Alasan:** Berbasis Ruby. Mudah dikemas dan dijalankan tanpa dependensi aneh.

31. **`dalfox`**

    - **Status:** **Docker Friendly**
    - **Alasan:** Tersedia _official image_. Alat XSS scanner berbasis Go yang mandiri.

32. **`commix`**

    - **Status:** **Docker Friendly**
    - **Alasan:** Skrip Python. Tidak ada kebutuhan sistem level rendah.

33. **`hydra`**

    - **Status:** **Docker Friendly**
    - **Alasan:** Tersedia di banyak _base image_ keamanan (seperti Kali Linux atau Alpine). Hanya melakukan koneksi jaringan standar (login attempt).

34. **`theHarvester`**

    - **Status:** **Docker Friendly**
    - **Alasan:** Tersedia _official image_. Mengelola dependensi Python yang cukup banyak menjadi lebih mudah dengan Docker.

35. **`searchsploit`**

    - **Status:** **Docker Friendly**
    - **Alasan:** Pada dasarnya hanya mencari _string_ dalam database lokal (CSV/JSON). Database Exploit-DB bisa di-_mount_ sebagai volume agar tetap _update_.

36. **`feroxbuster`**

    - **Status:** **Docker Friendly**
    - **Alasan:** Tersedia _official image_. _Binary_ Rust yang sangat cepat dan stabil di container.

37. **`XSStrike`**

    - **Status:** **Docker Friendly**
    - **Alasan:** Skrip Python. Namun, fitur _crawling_-nya terkadang butuh konfigurasi tambahan jika target memblokir _user-agent_ default, tapi secara teknis berjalan baik di Docker.

38. **`metasploit`**

    - **Status:** **Docker Friendly**
    - **Alasan:** Tersedia _official image_ dari Rapid7. Instalasi Metasploit di host seringkali rumit dan berat; Docker adalah solusi terbaik untuk menjalankannya secara instan.

39. **`recon-ng`**

    - **Status:** **Docker Friendly**
    - **Alasan:** Framework berbasis Python. Docker memudahkan manajemen modul dan dependensinya.

40. **`paramspider`**

    - **Status:** **Docker Friendly**
    - **Alasan:** Skrip Python sederhana untuk _mining_ parameter dari arsip web.

41. **`rustscan`**

    - **Status:** **Docker Friendly (dengan catatan)**
    - **Alasan:** Rustscan adalah _wrapper_ pintar untuk Nmap. Ia butuh Nmap terinstal di dalam container dan akses _root_ (privilege) untuk melakukan _syn scan_ cepat sebelum mengoper ke Nmap.

42. **`LinkFinder`**

    - **Status:** **Docker Friendly**
    - **Alasan:** Skrip Python yang mem-parsing file JS. Tidak butuh akses jaringan aneh, hanya teks processing.

43. **`cloud_enum`**

    - **Status:** **Docker Friendly**
    - **Alasan:** Skrip Python yang melakukan HTTP request ke _public cloud resources_.

44. **`kiterunner`**

    - **Status:** **Docker Friendly**
    - **Alasan:** ProjectDiscovery (sekarang AssetNote) menyediakan _binary_ Go. Sangat efisien di Docker.

45. **`wafw00f`**

    - **Status:** **Docker Friendly**
    - **Alasan:** Skrip Python ringan untuk deteksi WAF.

46. **`joomscan`**
    - **Status:** **Docker Friendly**
    - **Alasan:** Skrip Perl. Mudah dijalankan di container yang memiliki interpreter Perl.

estimasi kebutuhan storage untuk semua tools : 10 GB , siapkan 15 GB untuk jaga jaga
