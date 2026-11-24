const fs = require('fs');
const drafService = require('../services/drafService');
const { catatAktivitas } = require('../models/logModel');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { tanganiGalat } = require('../utils/galat');

const idDari = (req) => {
  const id = Number(req.params.pengajuanId);
  return Number.isInteger(id) && id > 0 ? id : null;
};
const aktorDari = (req) => ({ id: req.user.id, ip: req.ip });

const kirimPdf = (res, buffer, namaFile) => {
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Length': buffer.length,
    'Content-Disposition': `inline; filename="${namaFile}"`,
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  return res.end(buffer);
};

// GET /api/draf (staf): pengajuan terverifikasi beserta status drafnya.
const daftar = async (req, res) => {
  try {
    return sendSuccess(res, 'Daftar draf surat', await drafService.daftarDraf());
  } catch (error) {
    return tanganiGalat(res, error, 'Daftar Draf');
  }
};

// GET /api/draf/:pengajuanId (staf): isi draf untuk editor.
const detail = async (req, res) => {
  try {
    const id = idDari(req);
    if (!id) return sendError(res, 'Pengajuan tidak ditemukan', 404);
    return sendSuccess(res, 'Detail draf surat', await drafService.ambilDraf(id));
  } catch (error) {
    return tanganiGalat(res, error, 'Detail Draf');
  }
};

// PUT /api/draf/:pengajuanId  { isi_draf } (staf): simpan draf dan buat PDF draf.
const simpan = async (req, res) => {
  try {
    const id = idDari(req);
    if (!id) return sendError(res, 'Pengajuan tidak ditemukan', 404);
    return sendSuccess(res, 'Draf surat berhasil disimpan', await drafService.simpanDraf(id, req.body.isi_draf, aktorDari(req)));
  } catch (error) {
    return tanganiGalat(res, error, 'Simpan Draf');
  }
};

// POST /api/draf/:pengajuanId/pratinjau  { isi_draf } (staf): PDF dari isi yang belum disimpan.
const pratinjau = async (req, res) => {
  try {
    const id = idDari(req);
    if (!id) return sendError(res, 'Pengajuan tidak ditemukan', 404);
    return kirimPdf(res, await drafService.pratinjauDraf(id, req.body.isi_draf), 'pratinjau-draf.pdf');
  } catch (error) {
    return tanganiGalat(res, error, 'Pratinjau Draf');
  }
};

// POST /api/draf/:pengajuanId/teruskan (staf): kirim ke Kepala Kantor.
const teruskan = async (req, res) => {
  try {
    const id = idDari(req);
    if (!id) return sendError(res, 'Pengajuan tidak ditemukan', 404);
    return sendSuccess(res, 'Draf diteruskan ke Kepala Kantor', await drafService.teruskanDraf(id, aktorDari(req)));
  } catch (error) {
    return tanganiGalat(res, error, 'Teruskan Draf');
  }
};

// GET /api/draf/:pengajuanId/pdf (staf dan pimpinan): PDF draf tersimpan. Pembukaan dicatat di log.
const pdf = async (req, res) => {
  try {
    const id = idDari(req);
    if (!id) return sendError(res, 'Pengajuan tidak ditemukan', 404);
    const { lokasi, namaFile } = await drafService.lokasiPdfDraf(id);
    await catatAktivitas({ userId: req.user.id, action: 'buka_draf', description: `Membuka PDF draf pengajuan #${id}`, ipAddress: req.ip });
    return kirimPdf(res, await fs.promises.readFile(lokasi), namaFile);
  } catch (error) {
    return tanganiGalat(res, error, 'PDF Draf');
  }
};

module.exports = { daftar, detail, simpan, pratinjau, teruskan, pdf };
