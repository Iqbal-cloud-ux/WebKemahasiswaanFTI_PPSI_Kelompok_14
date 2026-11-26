const { sendError } = require('../utils/responseHandler');
const { tanganiGalat } = require('../utils/galat');
const suratService = require('../services/suratService');

const unduhSuratTerbit = async (req, res) => {
  try {
    const pengajuanId = Number(req.params.pengajuanId);
    if (!Number.isInteger(pengajuanId) || pengajuanId <= 0) {
      return sendError(res, 'Pengajuan tidak ditemukan', 404);
    }

    const { pdf, namaFile } = await suratService.suratTerbit(
      pengajuanId,
      { id: req.user.id, role: req.user.role },
      req.ip
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdf.length,
      'Content-Disposition': `attachment; filename="${namaFile}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    return res.end(pdf);
  } catch (error) {
    return tanganiGalat(res, error, 'Unduh Surat Terbit');
  }
};

module.exports = { unduhSuratTerbit };
