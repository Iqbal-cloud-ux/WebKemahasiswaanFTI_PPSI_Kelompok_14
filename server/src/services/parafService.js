// Paraf berjenjang oleh Kepala Kantor lalu Wakil Dekan 1 (#88, docs/alur-status.md).
// - Setujui dan Paraf: pending_kakor -> pending_wadek1, atau pending_wadek1 -> pending_dekan.
// - Kembalikan (wajib catatan): kembali ke diverifikasi, draf berstatus "dikembalikan" untuk direvisi staf.
// Setiap keputusan dicatat satu baris di tabel persetujuan. Keputusan Dekan ada di #91 (terpisah).
const db = require('../config/db');
const Pengajuan = require('../models/pengajuanModel');
const { LogAktivitas } = require('../models/logModel');
const { ubahStatus } = require('./statusService');
const { denganTransaksi } = require('../utils/transaksi');
const { GalatAplikasi } = require('../utils/galat');

const TAHAP = { kakor: 'pending_kakor', wadek1: 'pending_wadek1' };
const BERIKUTNYA = { kakor: 'pending_wadek1', wadek1: 'pending_dekan' };
const NAMA_PERAN = { kakor: 'Kepala Kantor', wadek1: 'Wakil Dekan 1', dekan: 'Dekan' };
const CATATAN_MAKS = 1000;

// Antrean draf yang menunggu paraf peran ini, yang paling lama menunggu lebih dulu.
const antrean = async (role) => {
  const [rows] = await db.query(
    `SELECT p.id, p.no_referensi, p.status, p.created_at, p.updated_at, j.nama_layanan,
       u.nama AS mahasiswa_nama, u.identifier AS mahasiswa_nim, s.updated_at AS draf_updated_at
     FROM pengajuan p
     JOIN jenis_layanan j ON j.id = p.jenis_layanan_id
     JOIN users u ON u.id = p.mahasiswa_id
     LEFT JOIN surat_resmi s ON s.pengajuan_id = p.id
     WHERE p.status = ?
     ORDER BY p.updated_at, p.id`,
    [TAHAP[role]]
  );
  return rows.map((row) => ({
    pengajuan_id: row.id,
    no_referensi: row.no_referensi,
    status: row.status,
    nama_layanan: row.nama_layanan,
    mahasiswa: { nama: row.mahasiswa_nama, nim: row.mahasiswa_nim },
    created_at: row.created_at,
    masuk_tahap_at: row.updated_at,
  }));
};

const daftarPersetujuan = async (pengajuanId, executor = db) => {
  const [rows] = await executor.query(
    `SELECT ps.id, ps.role_pimpinan, ps.status, ps.catatan, ps.created_at, u.nama AS pimpinan_nama
     FROM persetujuan ps JOIN users u ON u.id = ps.pimpinan_id
     WHERE ps.pengajuan_id = ? ORDER BY ps.created_at, ps.id`,
    [pengajuanId]
  );
  return rows;
};

// Detail untuk halaman Detail Pemeriksaan Surat: ringkasan pengajuan, berkas, riwayat paraf, dan isi draf.
const detail = async (pengajuanId) => {
  const pengajuan = await Pengajuan.cariDetail(pengajuanId);
  if (!pengajuan) throw new GalatAplikasi('Pengajuan tidak ditemukan', 404);
  const [[surat]] = await db.query('SELECT status_draf, isi_draf, file_draf_path, updated_at FROM surat_resmi WHERE pengajuan_id = ?', [pengajuanId]);
  if (!surat?.isi_draf) throw new GalatAplikasi('Pengajuan ini belum memiliki draf surat', 404);
  const [berkas, persetujuan] = await Promise.all([Pengajuan.daftarBerkas(pengajuanId), daftarPersetujuan(pengajuanId)]);
  return {
    pengajuan,
    berkas,
    persetujuan,
    draf: { status_draf: surat.status_draf, ada_pdf: Boolean(surat.file_draf_path), updated_at: surat.updated_at },
  };
};

const teksCatatan = (catatan) => {
  const teks = typeof catatan === 'string' ? catatan.trim() : '';
  if (teks.length > CATATAN_MAKS) throw new GalatAplikasi(`Catatan maksimal ${CATATAN_MAKS} karakter`, 400);
  return teks;
};

const catatPersetujuan = (conn, { pengajuanId, aktor, status, catatan }) => conn.query(
  'INSERT INTO persetujuan (pengajuan_id, pimpinan_id, role_pimpinan, status, catatan) VALUES (?, ?, ?, ?, ?)',
  [pengajuanId, aktor.id, aktor.role, status, catatan || null]
);

// Setujui dan Paraf. ubahStatus memastikan pengajuan sedang di tahap peran ini.
const setujui = ({ pengajuanId, aktor, catatan, ipAddress }) => {
  if (!BERIKUTNYA[aktor.role]) throw new GalatAplikasi('Peran ini tidak memberi paraf', 403);
  const teks = teksCatatan(catatan);
  return denganTransaksi(async (conn) => {
    // Catatan paraf bersifat internal: disimpan di persetujuan saja, tidak di riwayat_status yang dibaca mahasiswa.
    const hasil = await ubahStatus(conn, { pengajuanId, statusBaru: BERIKUTNYA[aktor.role], aktor, ipAddress });
    await catatPersetujuan(conn, { pengajuanId, aktor, status: 'approved', catatan: teks });
    await LogAktivitas.create({ userId: aktor.id, action: 'paraf', description: `${NAMA_PERAN[aktor.role]} memaraf draf pengajuan ${hasil.no_referensi}`, ipAddress }, conn);
    return { pengajuan_id: hasil.id, no_referensi: hasil.no_referensi, status: hasil.status };
  });
};

// Kembalikan dengan catatan: pengajuan kembali ke diverifikasi dan draf ditandai "dikembalikan".
const kembalikan = ({ pengajuanId, aktor, catatan, ipAddress }) => {
  if (!TAHAP[aktor.role]) throw new GalatAplikasi('Peran ini tidak memberi paraf', 403);
  const teks = teksCatatan(catatan);
  if (!teks) throw new GalatAplikasi('Tuliskan catatan revisi untuk Staf Akademik', 400);
  return denganTransaksi(async (conn) => {
    const hasil = await ubahStatus(conn, { pengajuanId, statusBaru: 'diverifikasi', aktor, catatan: teks, ipAddress });
    await catatPersetujuan(conn, { pengajuanId, aktor, status: 'returned', catatan: teks });
    await conn.query("UPDATE surat_resmi SET status_draf = 'dikembalikan' WHERE pengajuan_id = ?", [pengajuanId]);
    await LogAktivitas.create({ userId: aktor.id, action: 'kembalikan_draf', description: `${NAMA_PERAN[aktor.role]} mengembalikan draf pengajuan ${hasil.no_referensi}`, ipAddress }, conn);
    return { pengajuan_id: hasil.id, no_referensi: hasil.no_referensi, status: hasil.status };
  });
};

// Riwayat Pengesahan: keputusan yang pernah diambil pimpinan ini, beserta statistiknya.
const riwayat = async (pimpinanId) => {
  const [rows] = await db.query(
    `SELECT ps.id, ps.pengajuan_id, ps.status AS keputusan, ps.catatan, ps.created_at,
       p.no_referensi, p.status AS status_pengajuan, j.nama_layanan, u.nama AS mahasiswa_nama, u.identifier AS mahasiswa_nim
     FROM persetujuan ps
     JOIN pengajuan p ON p.id = ps.pengajuan_id
     JOIN jenis_layanan j ON j.id = p.jenis_layanan_id
     JOIN users u ON u.id = p.mahasiswa_id
     WHERE ps.pimpinan_id = ?
     ORDER BY ps.created_at DESC, ps.id DESC`,
    [pimpinanId]
  );
  const data = rows.map((row) => ({
    id: row.id,
    pengajuan_id: row.pengajuan_id,
    no_referensi: row.no_referensi,
    keputusan: row.keputusan,
    catatan: row.catatan,
    created_at: row.created_at,
    status_pengajuan: row.status_pengajuan,
    nama_layanan: row.nama_layanan,
    mahasiswa: { nama: row.mahasiswa_nama, nim: row.mahasiswa_nim },
  }));
  return {
    statistik: {
      total: data.length,
      diparaf: data.filter((d) => d.keputusan === 'approved').length,
      dikembalikan: data.filter((d) => d.keputusan === 'returned').length,
    },
    riwayat: data,
  };
};

module.exports = { antrean, detail, setujui, kembalikan, riwayat };
