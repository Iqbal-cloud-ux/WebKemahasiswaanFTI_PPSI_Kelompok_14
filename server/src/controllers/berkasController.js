// Membuka berkas persyaratan (#73). Berkas memuat data sensitif (AGENTS.md aturan 1):
// hanya pemilik pengajuan, staf, dan pimpinan yang boleh membuka, dan setiap pembukaan dicatat di log.
const fs = require('fs');
const path = require('path');
const Pengajuan = require('../models/pengajuanModel');
const { catatAktivitas } = require('../models/logModel');
const { sendError } = require('../utils/responseHandler');
const { tanganiGalat } = require('../utils/galat');

const FOLDER_UPLOADS = path.resolve(__dirname, '../../uploads');
const TIPE_KONTEN = { '.pdf': 'application/pdf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };
const PERAN_PEMERIKSA = ['staf', 'kakor', 'wadek1', 'dekan'];

// GET /api/berkas/:id
const bukaBerkas = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return sendError(res, 'Berkas tidak ditemukan', 404);

    const berkas = await Pengajuan.cariBerkas(id);
    if (!berkas) return sendError(res, 'Berkas tidak ditemukan', 404);

    const pemilik = req.user.role === 'mahasiswa' && berkas.mahasiswa_id === req.user.id;
    if (!pemilik && !PERAN_PEMERIKSA.includes(req.user.role)) {
      return sendError(res, 'Anda tidak berhak membuka berkas ini', 403);
    }

    // Pastikan path tetap di dalam folder uploads (mencegah path traversal dari data yang rusak).
    const lokasi = path.resolve(FOLDER_UPLOADS, berkas.file_path);
    const tipe = TIPE_KONTEN[path.extname(lokasi).toLowerCase()];
    if (!lokasi.startsWith(FOLDER_UPLOADS + path.sep) || !tipe) {
      return sendError(res, 'Berkas tidak dapat dibuka', 400);
    }
    const info = await fs.promises.stat(lokasi).catch(() => null);
    if (!info?.isFile()) {
      return sendError(res, 'Berkas tidak ditemukan di server. Hubungi Staf Akademik.', 404);
    }

    await catatAktivitas({
      userId: req.user.id,
      action: 'buka_berkas',
      description: `Membuka berkas "${berkas.nama_syarat}" pengajuan ${berkas.no_referensi}`,
      ipAddress: req.ip,
    });

    res.set({
      'Content-Type': tipe,
      'Content-Length': info.size,
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(berkas.original_name)}`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
    });
    return fs.createReadStream(lokasi)
      .on('error', (error) => {
        console.error('Error Kirim Berkas:', error);
        res.destroy();
      })
      .pipe(res);
  } catch (error) {
    return tanganiGalat(res, error, 'Buka Berkas');
  }
};

module.exports = { bukaBerkas };
