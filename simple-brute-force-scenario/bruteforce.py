# hacker.py
import hashlib
import time

print("==============================================")
print("🦹 SIMULASI SISI PERETAS (BRUTE FORCE TOOL)")
print("==============================================")

# --- Peretas memasukkan informasi yang bocor ---
# (Salin dan tempel output dari skrip server.py di sini)

secret_key = "kunciRahasiaDariServerYangBocor_123!@#"
target_hash = "5bd14caea8180be6dffcd4173a51931b66b1f3b852ba34d8fa9724a4b03894f0"
nama_file_wordlist = "worlist.txt"

print(f"\nTarget Hash: {target_hash}")
print(f"Menggunakan Wordlist: {nama_file_wordlist}\n")
time.sleep(1) # Jeda sesaat

password_ditemukan = False

try:
    # Membuka dan membaca file wordlist
    with open(nama_file_wordlist, 'r') as file:
        # Loop untuk setiap baris (kata) di dalam file
        for kata_tebakan in file:
            # .strip() untuk menghapus spasi atau baris baru yang tidak diinginkan
            tebakan = kata_tebakan.strip()
            
            print(f"[?] Mencoba password: '{tebakan}'")

            # Peretas meniru proses hashing server
            string_tebakan_hash = tebakan + secret_key
            hash_hasil_tebakan = hashlib.sha256(string_tebakan_hash.encode()).hexdigest()

            # Membandingkan hash hasil tebakan dengan hash target
            if hash_hasil_tebakan == target_hash:
                print("\n----------------------------------------------")
                print(f"✅ BERHASIL! PASSWORD DITEMUKAN!")
                print(f"Password Asli adalah: {tebakan}")
                print("----------------------------------------------")
                password_ditemukan = True
                break # Hentikan loop
            
            time.sleep(0.1) # Jeda untuk simulasi

except FileNotFoundError:
    print(f"[!] ERROR: File wordlist '{nama_file_wordlist}' tidak ditemukan!")
    print("[!] Pastikan file tersebut ada di folder yang sama dengan skrip ini.")

if not password_ditemukan:
    print("\n----------------------------------------------")
    print("❌ GAGAL! Password tidak ada dalam wordlist.")
    print("----------------------------------------------")