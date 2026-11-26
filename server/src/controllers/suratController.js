const { sendError, sendSuccess } = require('../utils/responseHandler');
const { tanganiGalat } = require('../utils/galat');
const suratService = require('../services/suratService');

const daftarArsip = async (req, res) => {
  try {
    const data = await suratService.daftarArsip(
      { id: req.user.id, role: req.user.role },
      req.ip
    );
    return sendSuccess(res, 'Arsip surat berhasil dimuat', data);
  } catch (error) {
    return tanganiGalat(res, error, 'Daftar Arsip Surat');
  }
};

const unduhQrSurat = async (req, res) => {
  try {
    const pengajuanId = Number(req.params.pengajuanId);
    if (!Number.isInteger(pengajuanId) || pengajuanId <= 0) {
      return sendError(res, 'Pengajuan tidak ditemukan', 404);
    }

    const png = await suratService.qrSuratTerbit(
      pengajuanId,
      { id: req.user.id, role: req.user.role },
      req.ip
    );
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': png.length,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    return res.end(png);
  } catch (error) {
    return tanganiGalat(res, error, 'Kode QR Surat Terbit');
  }
};

const unduhSuratTerbit = async (req, res) => {
  try {
    const pengajuanId = Number(req.params.pengajuanId);
    if (!Number.isInteger(pengajuanId) || pengajuanId <= 0) {
      return sendError(res, 'Pengajuan tidak ditemukan', 404);
    }

    const { pdf, namaFile } = await suratService.suratTerbit(
      pengajuanId,
      { id: req.user.id, role: req.user.role },
      req.ip,
      req.query.mode === 'pratinjau'
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdf.length,
      'Content-Disposition': `${req.query.mode === 'pratinjau' ? 'inline' : 'attachment'}; filename="${namaFile}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    return res.end(pdf);
  } catch (error) {
    return tanganiGalat(res, error, 'Unduh Surat Terbit');
  }
};

module.exports = { daftarArsip, unduhQrSurat, unduhSuratTerbit };
