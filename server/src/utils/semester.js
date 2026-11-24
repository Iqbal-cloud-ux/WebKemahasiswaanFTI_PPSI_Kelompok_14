// Semester berjalan dihitung dari angkatan (tahun masuk). Semester ganjil dianggap mulai Agustus
// (docs/persyaratan-layanan.md, layanan 4). Contoh: angkatan 2023 pada November 2026 = semester 7.
const BULAN_MULAI_GANJIL = 8;

const hitungSemester = (angkatan, tanggal = new Date()) => {
  const tahunMasuk = Number(angkatan);
  if (!Number.isInteger(tahunMasuk) || tahunMasuk <= 0) return null;
  const selisihTahun = tanggal.getFullYear() - tahunMasuk;
  const semester = tanggal.getMonth() + 1 >= BULAN_MULAI_GANJIL ? selisihTahun * 2 + 1 : selisihTahun * 2;
  return semester > 0 ? semester : null;
};

module.exports = { hitungSemester };
