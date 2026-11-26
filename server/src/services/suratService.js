const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const { catatAktivitas } = require('../models/logModel');
const { GalatAplikasi } = require('../utils/galat');

const FOLDER_UPLOADS = path.resolve(__dirname, '../../uploads');

const suratTerbit = async (pengajuanId, aktor, ipAddress) => {
  const [[row]] = await db.query(
    `SELECT p.no_referensi, p.mahasiswa_id, p.status, s.status_draf, s.no_surat, s.file_pdf_path
     FROM pengajuan p
     LEFT JOIN surat_resmi s ON s.pengajuan_id = p.id
     WHERE p.id = ?`,
    [pengajuanId]
  );
  if (!row) throw new GalatAplikasi('Pengajuan tidak ditemukan', 404);
  if (aktor.role === 'mahasiswa' && Number(row.mahasiswa_id) !== Number(aktor.id)) {
    throw new GalatAplikasi('Anda tidak berhak mengunduh surat ini', 403);
  }
  if (row.status !== 'disetujui' || row.status_draf !== 'terbit' || !row.file_pdf_path) {
    throw new GalatAplikasi('Surat belum diterbitkan oleh Dekan', 409);
  }

  const lokasi = path.resolve(FOLDER_UPLOADS, row.file_pdf_path);
  if (!lokasi.startsWith(FOLDER_UPLOADS + path.sep) || path.extname(lokasi).toLowerCase() !== '.pdf') {
    throw new GalatAplikasi('Berkas surat tidak dapat dibuka', 400);
  }
  const info = await fs.promises.stat(lokasi).catch((error) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  if (!info?.isFile()) {
    throw new GalatAplikasi('PDF surat tidak ditemukan di server. Hubungi Staf Akademik.', 404);
  }

  const pdf = await fs.promises.readFile(lokasi);
  await catatAktivitas({
    userId: aktor.id,
    action: 'unduh_surat',
    description: `Mengunduh surat terbit pengajuan ${row.no_referensi}`,
    ipAddress,
  });

  const nomor = String(row.no_surat || row.no_referensi).replace(/[^a-zA-Z0-9._-]/g, '_');
  return { pdf, namaFile: `Surat-${nomor}.pdf` };
};

module.exports = { suratTerbit };
