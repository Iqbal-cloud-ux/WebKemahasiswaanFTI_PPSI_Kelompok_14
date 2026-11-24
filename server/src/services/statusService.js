// Satu-satunya tempat yang boleh mengubah pengajuan.status (AGENTS.md aturan 2, docs/alur-status.md).
// Setiap perpindahan: ubah status, tulis riwayat_status, kirim notifikasi ke mahasiswa, tulis log.
// Fungsi di sini menerima koneksi transaksi (conn) dari pemanggil agar semuanya ikut satu transaksi
// bersama perubahan lain (misalnya simpan berkas atau terbitkan surat). Lihat utils/transaksi.js.
const { GalatAplikasi } = require('../utils/galat');
const { LogAktivitas } = require('../models/logModel');

// Perpindahan yang diizinkan: TRANSISI[dari][ke] = peran yang boleh memicunya.
const TRANSISI = {
  diajukan: { diverifikasi: ['staf'], perlu_perbaikan: ['staf'], ditolak: ['staf'] },
  perlu_perbaikan: { diajukan: ['mahasiswa'] },
  diverifikasi: { pending_kakor: ['staf'] },
  pending_kakor: { pending_wadek1: ['kakor'], diverifikasi: ['kakor'] },
  pending_wadek1: { pending_dekan: ['wadek1'], diverifikasi: ['wadek1'] },
  pending_dekan: { disetujui: ['dekan'], ditolak: ['dekan'], diverifikasi: ['dekan'] },
};

// Label antarmuka untuk mahasiswa (docs/alur-status.md).
const LABEL_STATUS = {
  diajukan: 'Diajukan',
  perlu_perbaikan: 'Perlu Perbaikan',
  diverifikasi: 'Diverifikasi',
  pending_kakor: 'Menunggu Persetujuan',
  pending_wadek1: 'Menunggu Persetujuan',
  pending_dekan: 'Menunggu Persetujuan',
  disetujui: 'Selesai',
  ditolak: 'Ditolak',
};

// Label rinci untuk staf dan pimpinan (mereka boleh melihat tahap paraf).
const LABEL_TAHAP = {
  ...LABEL_STATUS,
  pending_kakor: 'Menunggu Paraf Kepala Kantor',
  pending_wadek1: 'Menunggu Paraf Wakil Dekan 1',
  pending_dekan: 'Menunggu Keputusan Dekan',
};

const TAHAP_PIMPINAN = ['pending_kakor', 'pending_wadek1', 'pending_dekan'];

// Catatan wajib untuk: minta perbaikan, tolak, dan kembalikan draf dari pimpinan ke staf.
const butuhCatatan = (dari, ke) => ke === 'perlu_perbaikan' || ke === 'ditolak'
  || (TAHAP_PIMPINAN.includes(dari) && ke === 'diverifikasi');

// Catatan pimpinan saat mengembalikan draf ditujukan untuk staf, bukan mahasiswa.
const pesanNotifikasi = (dari, ke, catatan) => {
  if (ke === 'diajukan') {
    return dari === 'perlu_perbaikan'
      ? 'Perbaikan berkas Anda sudah diterima dan menunggu pemeriksaan ulang oleh Staf Akademik.'
      : 'Pengajuan Anda sudah diterima dan menunggu pemeriksaan berkas oleh Staf Akademik.';
  }
  if (ke === 'perlu_perbaikan') return `Berkas pengajuan Anda perlu diperbaiki. Catatan Staf Akademik: ${catatan}`;
  if (ke === 'diverifikasi') {
    return TAHAP_PIMPINAN.includes(dari)
      ? 'Surat Anda sedang direvisi oleh Staf Akademik sebelum diajukan kembali ke pimpinan.'
      : 'Berkas Anda sudah diverifikasi. Surat sedang disusun oleh Staf Akademik.';
  }
  if (TAHAP_PIMPINAN.includes(ke)) return 'Surat Anda sedang menunggu persetujuan pimpinan.';
  if (ke === 'disetujui') return 'Surat Anda sudah terbit dan dapat diunduh.';
  if (ke === 'ditolak') return `Pengajuan Anda ditolak. Alasan: ${catatan}`;
  return `Status pengajuan Anda berubah menjadi ${LABEL_STATUS[ke] || ke}.`;
};

const bolehPindah = (dari, ke, role) => Boolean(TRANSISI[dari]?.[ke]?.includes(role));

const tulisRiwayatDanNotifikasi = async (conn, { pengajuan, dari, ke, aktorId, catatan, ipAddress }) => {
  await conn.query(
    `INSERT INTO riwayat_status (pengajuan_id, user_id, status_sebelumnya, status_baru, catatan)
     VALUES (?, ?, ?, ?, ?)`,
    [pengajuan.id, aktorId, dari, ke, catatan || null]
  );
  await conn.query(
    `INSERT INTO notifikasi (user_id, pengajuan_id, judul, pesan) VALUES (?, ?, ?, ?)`,
    [pengajuan.mahasiswa_id, pengajuan.id, `Pengajuan ${pengajuan.no_referensi}: ${LABEL_STATUS[ke] || ke}`,
      pesanNotifikasi(dari, ke, catatan)]
  );
  await LogAktivitas.create({
    userId: aktorId,
    action: 'ubah_status',
    description: `Pengajuan ${pengajuan.no_referensi}: ${dari || '-'} -> ${ke}`,
    ipAddress,
  }, conn);
};

// Dipanggil sekali saat pengajuan baru disimpan (status awal 'diajukan', tanpa status sebelumnya).
const catatPengajuanBaru = (conn, { pengajuan, aktorId, ipAddress }) => tulisRiwayatDanNotifikasi(conn, {
  pengajuan, dari: null, ke: 'diajukan', aktorId, catatan: null, ipAddress,
});

// Memindahkan status satu pengajuan. aktor = { id, role } dari token.
// Mengunci baris pengajuan (FOR UPDATE) agar dua orang tidak memindahkan status yang sama bersamaan.
const ubahStatus = async (conn, { pengajuanId, statusBaru, aktor, catatan = '', ipAddress = null }) => {
  const [[pengajuan]] = await conn.query(
    'SELECT id, no_referensi, mahasiswa_id, status FROM pengajuan WHERE id = ? FOR UPDATE',
    [pengajuanId]
  );
  if (!pengajuan) throw new GalatAplikasi('Pengajuan tidak ditemukan', 404);

  const dari = pengajuan.status;
  const ke = statusBaru;
  if (!TRANSISI[dari]?.[ke]) {
    throw new GalatAplikasi(
      `Status pengajuan tidak bisa diubah dari "${LABEL_TAHAP[dari] || dari}" menjadi "${LABEL_TAHAP[ke] || ke}"`,
      409
    );
  }
  if (!bolehPindah(dari, ke, aktor.role)) {
    throw new GalatAplikasi('Anda tidak berwenang mengubah status pengajuan ini', 403);
  }
  if (aktor.role === 'mahasiswa' && pengajuan.mahasiswa_id !== aktor.id) {
    throw new GalatAplikasi('Anda tidak berwenang mengubah status pengajuan ini', 403);
  }

  const teksCatatan = typeof catatan === 'string' ? catatan.trim() : '';
  if (butuhCatatan(dari, ke) && !teksCatatan) {
    throw new GalatAplikasi(ke === 'ditolak' ? 'Alasan penolakan wajib diisi' : 'Catatan wajib diisi', 400);
  }

  // catatan_revisi hanya untuk catatan yang ditujukan ke mahasiswa (perbaikan atau penolakan);
  // dikosongkan lagi saat mahasiswa mengajukan ulang.
  const catatanRevisi = ke === 'perlu_perbaikan' || ke === 'ditolak' ? teksCatatan : null;
  if (ke === 'perlu_perbaikan' || ke === 'ditolak' || ke === 'diajukan') {
    await conn.query('UPDATE pengajuan SET status = ?, catatan_revisi = ? WHERE id = ?', [ke, catatanRevisi, pengajuan.id]);
  } else {
    await conn.query('UPDATE pengajuan SET status = ? WHERE id = ?', [ke, pengajuan.id]);
  }

  await tulisRiwayatDanNotifikasi(conn, { pengajuan, dari, ke, aktorId: aktor.id, catatan: teksCatatan, ipAddress });
  return { ...pengajuan, status: ke, statusSebelumnya: dari };
};

module.exports = { TRANSISI, LABEL_STATUS, LABEL_TAHAP, TAHAP_PIMPINAN, bolehPindah, catatPengajuanBaru, ubahStatus };
