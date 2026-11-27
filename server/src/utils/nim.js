// Struktur NIM sarjana Universitas Andalas (10 digit):
//   digit 1-2  = dua digit terakhir tahun masuk (24 = angkatan 2024)
//   digit 3    = kode jenjang (1 = S1; kode lain belum diketahui, jadi jenjangnya diisi staf)
//   digit 4-5  = kode fakultas (15 = Fakultas Teknologi Informasi)
//   digit 6-10 = nomor urut atau kode program studi/registrasi
// Salinan aturan yang sama ada di client/src/utils/nim.js.
const POLA_NIM = /^\d{10}$/;
const KODE_FAKULTAS_FTI = '15';
const JENJANG_DARI_KODE = { 1: 'S1' };

// Mengembalikan { angkatan, jenjang, kodeFakultas } atau null bila bukan 10 digit angka.
const bacaNim = (nim) => {
  const teks = String(nim ?? '').trim();
  if (!POLA_NIM.test(teks)) return null;
  return {
    angkatan: 2000 + Number(teks.slice(0, 2)),
    jenjang: JENJANG_DARI_KODE[teks[2]] || null,
    kodeFakultas: teks.slice(3, 5),
  };
};

// Pesan masalah NIM mahasiswa FTI, atau null bila NIM sah.
const masalahNimFti = (nim, tanggal = new Date()) => {
  const data = bacaNim(nim);
  if (!data) return 'NIM harus 10 digit angka';
  if (data.kodeFakultas !== KODE_FAKULTAS_FTI) {
    return `NIM ini bukan NIM Fakultas Teknologi Informasi (digit ke-4 dan ke-5 harus ${KODE_FAKULTAS_FTI})`;
  }
  if (data.angkatan > tanggal.getFullYear()) return 'Dua digit pertama NIM (tahun masuk) belum mungkin terjadi';
  return null;
};

module.exports = { KODE_FAKULTAS_FTI, bacaNim, masalahNimFti };
