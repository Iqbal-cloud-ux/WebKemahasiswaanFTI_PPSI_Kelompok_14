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

// Semester dan tahun akademik berjalan untuk surat, dengan aturan yang sama: Agustus sampai Desember =
// Ganjil tahun itu; Januari sampai Juli = Genap tahun akademik yang dimulai tahun sebelumnya.
// Contoh: November 2026 = Ganjil 2026/2027; Maret 2027 = Genap 2026/2027.
const semesterAkademik = (tanggal = new Date()) => {
  const tahun = tanggal.getFullYear();
  const ganjil = tanggal.getMonth() + 1 >= BULAN_MULAI_GANJIL;
  const awal = ganjil ? tahun : tahun - 1;
  return { semester: ganjil ? 'Ganjil' : 'Genap', tahunAkademik: `${awal}/${awal + 1}` };
};

module.exports = { hitungSemester, semesterAkademik };
