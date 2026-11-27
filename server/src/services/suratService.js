const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const { LogAktivitas } = require('../models/logModel');
const { GalatAplikasi } = require('../utils/galat');

const FOLDER_UPLOADS = path.resolve(__dirname, '../../uploads');

const pastikanStaf = (aktor) => {
  if (aktor?.role !== 'staf') throw new GalatAplikasi('Hanya Staf Akademik yang dapat melihat arsip surat', 403);
};

const lokasiBerkas = (filePath, ekstensi) => {
  const lokasi = path.resolve(FOLDER_UPLOADS, filePath || '');
  if (!lokasi.startsWith(FOLDER_UPLOADS + path.sep) || path.extname(lokasi).toLowerCase() !== ekstensi) {
    throw new GalatAplikasi('Berkas surat tidak dapat dibuka', 400);
  }
  return lokasi;
};

const bacaBerkasTerbit = async (filePath, ekstensi, label) => {
  const lokasi = lokasiBerkas(filePath, ekstensi);
  const info = await fs.promises.stat(lokasi).catch((error) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  if (!info?.isFile()) throw new GalatAplikasi(`${label} tidak ditemukan di server. Hubungi Staf Akademik.`, 404);
  return fs.promises.readFile(lokasi);
};

// aktor (opsional): bila mahasiswa, kepemilikan diperiksa SEBELUM status surat, agar mahasiswa lain
// tidak bisa mengetahui status pengajuan orang lain dari pesan "belum diterbitkan".
const ambilSuratTerbit = async (pengajuanId, aktor = null) => {
  const [[row]] = await db.query(
    `SELECT p.no_referensi, p.mahasiswa_id, p.status, s.status_draf, s.no_surat,
       s.file_pdf_path, s.qr_code_path, s.hash_sha256, s.tgl_terbit,
       u.nama AS mahasiswa_nama, u.identifier AS mahasiswa_nim, j.nama_layanan
     FROM pengajuan p
     JOIN users u ON u.id = p.mahasiswa_id
     JOIN jenis_layanan j ON j.id = p.jenis_layanan_id
     LEFT JOIN surat_resmi s ON s.pengajuan_id = p.id
     WHERE p.id = ?`,
    [pengajuanId]
  );
  if (!row) throw new GalatAplikasi('Pengajuan tidak ditemukan', 404);
  if (aktor?.role === 'mahasiswa' && Number(row.mahasiswa_id) !== Number(aktor.id)) {
    throw new GalatAplikasi('Anda tidak berhak mengunduh surat ini', 403);
  }
  if (row.status !== 'disetujui' || row.status_draf !== 'terbit') {
    throw new GalatAplikasi('Surat belum diterbitkan oleh Dekan', 409);
  }
  return row;
};

const daftarArsip = async (aktor, ipAddress) => {
  pastikanStaf(aktor);
  const [rows] = await db.query(
    `SELECT p.id AS pengajuan_id, p.no_referensi, s.no_surat,
       u.nama AS mahasiswa_nama, u.identifier AS mahasiswa_nim, j.nama_layanan,
       DATE_FORMAT(s.tgl_terbit, '%Y-%m-%d') AS tgl_terbit, s.hash_sha256
     FROM pengajuan p
     JOIN surat_resmi s ON s.pengajuan_id = p.id
     JOIN users u ON u.id = p.mahasiswa_id
     JOIN jenis_layanan j ON j.id = p.jenis_layanan_id
     WHERE p.status = 'disetujui' AND s.status_draf = 'terbit'
       AND s.file_pdf_path IS NOT NULL AND s.tgl_terbit IS NOT NULL
     ORDER BY s.tgl_terbit DESC, s.id DESC`
  );

  await LogAktivitas.create({
    userId: aktor.id,
    action: 'lihat_arsip_surat',
    description: `Melihat daftar arsip surat (${rows.length} surat)`,
    ipAddress,
  });
  return rows.map((row) => ({
    pengajuan_id: row.pengajuan_id,
    no_referensi: row.no_referensi,
    no_surat: row.no_surat,
    mahasiswa: { nama: row.mahasiswa_nama, nim: row.mahasiswa_nim },
    nama_layanan: row.nama_layanan,
    tgl_terbit: row.tgl_terbit,
    hash_sha256: row.hash_sha256,
  }));
};

const qrSuratTerbit = async (pengajuanId, aktor, ipAddress) => {
  pastikanStaf(aktor);
  const row = await ambilSuratTerbit(pengajuanId);
  if (!row.qr_code_path) throw new GalatAplikasi('Kode QR surat tidak ditemukan', 404);
  const qrPng = await bacaBerkasTerbit(row.qr_code_path, '.png', 'Kode QR surat');
  await LogAktivitas.create({
    userId: aktor.id,
    action: 'lihat_kode_verifikasi',
    description: `Melihat kode verifikasi surat pengajuan ${row.no_referensi}`,
    ipAddress,
  });
  return qrPng;
};

const suratTerbit = async (pengajuanId, aktor, ipAddress, pratinjau = false) => {
  const row = await ambilSuratTerbit(pengajuanId, aktor);
  if (!row.file_pdf_path) throw new GalatAplikasi('Surat belum diterbitkan oleh Dekan', 409);
  const pdf = await bacaBerkasTerbit(row.file_pdf_path, '.pdf', 'PDF surat');
  await LogAktivitas.create({
    userId: aktor.id,
    action: pratinjau ? 'lihat_surat' : 'unduh_surat',
    description: `${pratinjau ? 'Melihat' : 'Mengunduh'} surat terbit pengajuan ${row.no_referensi}`,
    ipAddress,
  });

  const nomor = String(row.no_surat || row.no_referensi).replace(/[^a-zA-Z0-9._-]/g, '_');
  return { pdf, namaFile: `Surat-${nomor}.pdf` };
};

module.exports = { daftarArsip, qrSuratTerbit, suratTerbit };
