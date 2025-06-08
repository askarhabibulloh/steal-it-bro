# server.py
import hashlib

print("==============================================")
print("⚙️  SIMULASI SISI SERVER")
print("==============================================")

# Password asli yang dimasukkan oleh pengguna
password_asli_user = "baseball123"

# Secret key yang seharusnya tersimpan aman di server (misal: di .env)
secret_key = "kunciRahasiaDariServerYangBocor_123!@#"

# Proses hashing di server:
# Menggabungkan password dengan secret key, lalu di-hash menggunakan SHA256
string_untuk_hash = password_asli_user + secret_key
hash_di_database = hashlib.sha256(string_untuk_hash.encode()).hexdigest()

print(f"\nPassword Asli Pengguna: '{password_asli_user}'")
print(f"Secret Key Server: '{secret_key}'")

print("\n--- INFORMASI YANG BOCOR KE PERETAS ---")
print(f"Secret Key: {secret_key}")
print(f"Hash Password: {hash_di_database}")
print("---------------------------------------")
print("\nSIMPAN INFORMASI DI ATAS UNTUK DIGUNAKAN DI SKRIP HACKER.")