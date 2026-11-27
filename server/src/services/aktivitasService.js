// Aktivitas Terbaru di Beranda Staf: perpindahan status pengajuan terakhir (tabel riwayat_status),
// disusun menjadi kalimat yang mudah dibaca. Sengaja tidak memakai log_aktivitas, karena isinya
// juga login, alamat IP, dan pembukaan berkas yang tidak perlu tampil di beranda.
const db = require('../config/db');
const { GalatAplikasi } = require('../utils/galat');
const { TAHAP_PIMPINAN } = require('./statusService');

const JUMLAH_BAWAAN = 8;
const JUMLAH_MAKS = 30;
const CATATAN_MAKS = 120;

const pastikanStaf = (aktor) => {
  if (aktor?.role !== 'staf') throw new GalatAplikasi('Hanya Staf Akademik yang dapat melihat aktivitas terbaru', 403);
};

// Judul aktivitas dari satu baris riwayat_status.
const judulAktivitas = ({ status_sebelumnya: dari, status_baru: ke, no_referensi: no }) => {
  if (ke === 'diajukan') return dari === 'perlu_perbaikan' ? `Perbaikan ${no} dikirim ulang` : `Pengajuan ${no} diterima`;
  if (ke === 'perlu_perbaikan') return `Pengajuan ${no} diminta perbaikan`;
  if (ke === 'diverifikasi') return TAHAP_PIMPINAN.includes(dari) ? `Draf ${no} dikembalikan untuk revisi` : `Pengajuan ${no} diverifikasi`;
  if (ke === 'pending_kakor') return `Draf ${no} diteruskan ke Kepala Kantor`;
  if (ke === 'pending_wadek1') return `Draf ${no} diparaf Kepala Kantor`;
  if (ke === 'pending_dekan') return `Draf ${no} diparaf Wakil Dekan 1`;
  if (ke === 'disetujui') return `Surat ${no} diterbitkan`;
  if (ke === 'ditolak') return dari === 'pending_dekan' ? `Pengajuan ${no} ditolak Dekan` : `Pengajuan ${no} ditolak`;
  return `Status ${no} berubah`;
};

// Ditandai di beranda: diminta perbaikan, ditolak, atau draf dikembalikan pejabat.
const perluPerhatian = ({ status_sebelumnya: dari, status_baru: ke }) => ke === 'perlu_perbaikan' || ke === 'ditolak'
  || (ke === 'diverifikasi' && TAHAP_PIMPINAN.includes(dari));

const potong = (teks) => (teks.length > CATATAN_MAKS ? `${teks.slice(0, CATATAN_MAKS - 1)}…` : teks);

const daftarAktivitas = async (aktor, jumlah = JUMLAH_BAWAAN) => {
  pastikanStaf(aktor);
  const batas = Math.min(Math.max(Number.parseInt(jumlah, 10) || JUMLAH_BAWAAN, 1), JUMLAH_MAKS);
  const [rows] = await db.query(
    `SELECT r.id, r.status_sebelumnya, r.status_baru, r.catatan, r.created_at,
       p.id AS pengajuan_id, p.no_referensi, j.nama_layanan, a.nama AS pelaku_nama
     FROM riwayat_status r
     JOIN pengajuan p ON p.id = r.pengajuan_id
     JOIN jenis_layanan j ON j.id = p.jenis_layanan_id
     LEFT JOIN users a ON a.id = r.user_id
     ORDER BY r.created_at DESC, r.id DESC
     LIMIT ?`,
    [batas]
  );
  return rows.map((row) => {
    const catatan = typeof row.catatan === 'string' ? row.catatan.trim() : '';
    return {
      id: row.id,
      pengajuan_id: row.pengajuan_id,
      status_baru: row.status_baru,
      judul: judulAktivitas(row),
      perhatian: perluPerhatian(row),
      keterangan: [row.pelaku_nama || 'Sistem', row.nama_layanan, catatan && `"${potong(catatan)}"`].filter(Boolean).join(' · '),
      waktu: row.created_at,
    };
  });
};

module.exports = { judulAktivitas, perluPerhatian, daftarAktivitas };
