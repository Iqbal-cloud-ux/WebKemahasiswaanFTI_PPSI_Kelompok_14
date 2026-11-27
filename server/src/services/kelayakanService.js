// Syarat peserta per layanan yang diperiksa sistem sebelum pengajuan dikirim
// (docs/persyaratan-layanan.md). Layanan tanpa aturan di sini boleh diajukan semua mahasiswa.
const db = require('../config/db');
const { hitungSemester } = require('../utils/semester');
const { statusStudi } = require('../utils/statusStudi');

const BOLEH = { boleh: true, alasan: null };

const ATURAN = {
  // Layanan 4: mahasiswa S1, aktif mulai semester 3, hanya sekali selama masa studi.
  // [BELUM FINAL] status "reguler" belum disimpan; yang diperiksa hanya jenjang S1.
  'PENYESUAIAN-UKT': async (executor, { layanan, mahasiswa }) => {
    if (!mahasiswa.jenjang || !mahasiswa.angkatan) {
      return { boleh: false, alasan: 'Data jenjang atau angkatan Anda belum tercatat. Hubungi Staf Akademik untuk melengkapinya.' };
    }
    if (String(mahasiswa.jenjang).toUpperCase() !== 'S1') {
      return { boleh: false, alasan: 'Layanan ini hanya untuk mahasiswa S1.' };
    }
    const semester = hitungSemester(mahasiswa.angkatan);
    if (!semester || semester < 3) {
      return { boleh: false, alasan: `Layanan ini baru bisa diajukan mulai semester 3 (semester Anda saat ini: ${semester || 1}).` };
    }
    const [[{ jumlah }]] = await executor.query(
      `SELECT COUNT(*) AS jumlah FROM pengajuan
       WHERE mahasiswa_id = ? AND jenis_layanan_id = ? AND status <> 'ditolak'`,
      [mahasiswa.id, layanan.id]
    );
    if (jumlah > 0) {
      return { boleh: false, alasan: 'Layanan ini hanya boleh diajukan sekali selama masa studi, dan Anda sudah pernah mengajukannya.' };
    }
    return BOLEH;
  },
};

// layanan: { id, kode_layanan }, mahasiswa: baris users (id, jenjang, angkatan).
// Mahasiswa yang sudah lulus (masa tenggang) tidak boleh membuat pengajuan baru untuk layanan apa pun.
const periksaKelayakan = async ({ layanan, mahasiswa }, executor = db) => {
  const status = statusStudi(mahasiswa);
  if (!status.bolehAjukan) return { boleh: false, alasan: status.pesan };
  const aturan = ATURAN[layanan.kode_layanan];
  return aturan ? aturan(executor, { layanan, mahasiswa }) : BOLEH;
};

module.exports = { periksaKelayakan };
