
# Entropy Calculator

Script ini menghitung **entropi informasi** dari sebuah teks masukan berdasarkan frekuensi kemunculan setiap karakter. Entropi diukur dengan menggunakan formula teori informasi.

## Fitur

1. Menghitung frekuensi kemunculan setiap karakter.
2. Menghitung probabilitas \( P_j \) dari setiap karakter.
3. Menghitung self-information \( I(X_j) = \log_2(1/P_j) \).
4. Menghitung kontribusi entropi \( h_j = P_j \cdot I(X_j) \).
5. Menghitung total entropi \( H = \sum h_j \).

## Prasyarat

- Python 3.x
- Modul `math` dan `json` (terintegrasi di Python standar)

## Cara Penggunaan

1. Jalankan script di terminal:

   ```bash
   python entropy_calculator.py
   ```

2. Masukkan teks pada prompt:

   ```plaintext
   Input: your_text_here
   ```

3. Script akan menampilkan langkah-langkah perhitungan berikut:
   - Daftar simbol dan frekuensi kemunculan.
   - Probabilitas masing-masing simbol.
   - Self-information setiap simbol.
   - Kontribusi entropi \( h_j \) masing-masing simbol.
   - Total entropi \( H \).

## Penjelasan Alur

### 1. Input
Teks masukan diproses karakter per karakter untuk menghitung frekuensi simbol.

### 2. Probabilitas
Probabilitas setiap simbol dihitung dengan rumus:
\[ P_j = \frac{\text{frekuensi simbol}}{\text{total karakter}} \]

### 3. Self-Information
Self-information dihitung dengan rumus:
\[ I(X_j) = \log_2\left(\frac{1}{P_j}\right) \]

### 4. Kontribusi Entropi
Kontribusi entropi dihitung dengan:
\[ h_j = P_j \cdot I(X_j) \]

### 5. Entropi Total
Entropi total dihitung dengan menjumlahkan semua \( h_j \):
\[ H = \sum h_j \]

## Contoh Output

Jika Anda memasukkan teks `hello`, berikut adalah langkah-langkah dan hasilnya:

```plaintext
Input: hello

[
  {
    "symbol": "h",
    "count": 1
  },
  {
    "symbol": "e",
    "count": 1
  },
  {
    "symbol": "l",
    "count": 2
  },
  {
    "symbol": "o",
    "count": 1
  }
]

[
  {
    "symbol": "h",
    "probabilitas": 0.2
  },
  {
    "symbol": "e",
    "probabilitas": 0.2
  },
  {
    "symbol": "l",
    "probabilitas": 0.4
  },
  {
    "symbol": "o",
    "probabilitas": 0.2
  }
]

[
  {
    "selfInfo": 2.322,
    "probabilitas": 0.2
  },
  {
    "selfInfo": 2.322,
    "probabilitas": 0.2
  },
  {
    "selfInfo": 1.322,
    "probabilitas": 0.4
  },
  {
    "selfInfo": 2.322,
    "probabilitas": 0.2
  }
]

[0.464, 0.464, 0.529, 0.464]

Entropi: 1.921

Jumlah Karakter: 5
```

## Catatan

- Script ini dirancang untuk menghitung entropi karakter dari teks masukan dan dapat digunakan sebagai alat pembelajaran teori informasi.
- Pastikan teks masukan hanya berisi karakter yang valid (ASCII atau Unicode).

## ⚖️ Lisensi

Steal it bro