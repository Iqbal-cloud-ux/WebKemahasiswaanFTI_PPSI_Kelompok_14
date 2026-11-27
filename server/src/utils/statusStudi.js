// Status akun pengguna (keputusan tim 27 November 2026, migrasi 007).
// Mahasiswa boleh login bila:
//   1. akunnya tidak dinonaktifkan manual (is_active),
//   2. belum lulus, atau masih dalam masa tenggang 30 hari setelah tgl_lulus
//      (hanya untuk mengunduh surat; tidak bisa membuat pengajuan baru), dan
//   3. semester berjalan paling banyak 14 + tambahan_semester (perpanjangan karena cuti).
// Peran lain hanya diperiksa is_active.
const { hitungSemester } = require('./semester');

const MAKS_SEMESTER = 14;
const MASA_TENGGANG_HARI = 30;

const PESAN_NONAKTIF = 'Akun Anda dinonaktifkan. Hubungi Staf Akademik untuk mengaktifkannya kembali';

// Nilai DATE dari database bisa berupa objek Date atau teks 'YYYY-MM-DD'; hasilnya tengah malam waktu lokal.
const keTanggal = (nilai) => {
  if (!nilai) return null;
  if (nilai instanceof Date) {
    return Number.isNaN(nilai.getTime()) ? null : new Date(nilai.getFullYear(), nilai.getMonth(), nilai.getDate());
  }
  const cocok = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(nilai));
  return cocok ? new Date(Number(cocok[1]), Number(cocok[2]) - 1, Number(cocok[3])) : null;
};

const teksTanggal = (tanggal) => `${tanggal.getFullYear()}-${String(tanggal.getMonth() + 1).padStart(2, '0')}-${String(tanggal.getDate()).padStart(2, '0')}`;
const tanggalIndonesia = (tanggal) => tanggal.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

// user: baris users (role, is_active, angkatan, tgl_lulus, tambahan_semester).
// Hasil: { kode, label, bolehLogin, bolehAjukan, pesan, semester, batasSemester, tutupPada }.
const statusStudi = (user, sekarang = new Date()) => {
  if (Number(user?.is_active ?? 1) === 0) {
    return { kode: 'nonaktif', label: 'Nonaktif', bolehLogin: false, bolehAjukan: false, pesan: PESAN_NONAKTIF };
  }
  if (user?.role !== 'mahasiswa') {
    return { kode: 'aktif', label: 'Aktif', bolehLogin: true, bolehAjukan: true, pesan: null };
  }

  const lulus = keTanggal(user.tgl_lulus);
  if (lulus) {
    const tutup = new Date(lulus.getFullYear(), lulus.getMonth(), lulus.getDate() + MASA_TENGGANG_HARI);
    if (sekarang < tutup) {
      return {
        kode: 'masa_tenggang',
        label: 'Lulus (masa tenggang)',
        bolehLogin: true,
        bolehAjukan: false,
        pesan: `Anda tercatat sudah lulus. Akun masih bisa dipakai untuk melihat dan mengunduh surat sampai ${tanggalIndonesia(tutup)}, tetapi tidak bisa membuat pengajuan baru.`,
        tutupPada: teksTanggal(tutup),
      };
    }
    return {
      kode: 'lulus',
      label: 'Lulus',
      bolehLogin: false,
      bolehAjukan: false,
      pesan: 'Akun ditutup karena Anda sudah lulus. Hubungi Staf Akademik bila ada keperluan.',
      tutupPada: teksTanggal(tutup),
    };
  }

  const semester = hitungSemester(user.angkatan, sekarang);
  const batasSemester = MAKS_SEMESTER + Number(user.tambahan_semester || 0);
  if (semester && semester > batasSemester) {
    return {
      kode: 'lewat_masa_studi',
      label: 'Lewat masa studi',
      bolehLogin: false,
      bolehAjukan: false,
      pesan: `Akun ditutup karena masa studi sudah melewati ${batasSemester} semester. Bila Anda pernah cuti, hubungi Staf Akademik untuk perpanjangan.`,
      semester,
      batasSemester,
    };
  }
  return { kode: 'aktif', label: 'Aktif', bolehLogin: true, bolehAjukan: true, pesan: null, semester, batasSemester };
};

module.exports = { MAKS_SEMESTER, MASA_TENGGANG_HARI, keTanggal, teksTanggal, tanggalIndonesia, statusStudi };
