function penalty(
  lompatKiri,
  lompatTengah,
  lompatKanan,
  tendangKiri,
  tendangTengah,
  tendangKanan
) {
  const jumlahSimulasi = 3000;
  let gol = 0;
  for (let i = 0; i < jumlahSimulasi; i++) {
    const nilaiTendang = (Math.random() * 100).toFixed(2);
    const nilaiLompat = (Math.random() * 100).toFixed(2);
    let arahTendangan;
    let arahLompatan;
    if (nilaiTendang < tendangKiri) {
      arahTendangan = "Kiri";
    } else if (nilaiTendang < tendangKiri + tendangTengah) {
      arahTendangan = "Tengah";
    } else {
      arahTendangan = "Kanan";
    }
    if (nilaiLompat < lompatKiri) {
      arahLompatan = "Kiri";
    } else if (nilaiLompat < lompatKiri + lompatTengah) {
      arahLompatan = "Tengah";
    } else {
      arahLompatan = "Kanan";
    }
    console.log("Arah Lompatan : " + arahLompatan);
    console.log("Arah Tendangan : " + arahTendangan);
    if (arahTendangan !== arahLompatan) {
      gol++;
      console.log("Gol\n");
    } else {
      console.log("Tidak Gol\n");
    }
  }
  console.log(
    lompatKiri,
    lompatTengah,
    lompatKanan,
    tendangKiri,
    tendangTengah,
    tendangKanan
  );
  console.log("\nJumlah Gol : " + gol);
  console.log("Jumlah Simulasi : " + jumlahSimulasi);
  console.log(
    "Persentase Gol : " + ((gol / jumlahSimulasi) * 100).toFixed(2) + "%"
  );
}
penalty(15, 35, 50, 77, 6, 17);
