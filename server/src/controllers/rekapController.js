const { sendError, sendSuccess } = require('../utils/responseHandler');
const { tanganiGalat } = require('../utils/galat');
const rekapService = require('../services/rekapService');

const bacaFilter = (query) => ({
  mulai: query.mulai,
  sampai: query.sampai,
  jenisLayananId: query.jenis_layanan_id,
  status: query.status,
});

const ambilRekap = async (req, res) => {
  try {
    const data = await rekapService.ambilRekap(
      bacaFilter(req.query),
      { id: req.user.id, role: req.user.role }
    );
    res.set({ 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' });
    return sendSuccess(res, 'Rekapitulasi berhasil dimuat', data);
  } catch (error) {
    return tanganiGalat(res, error, 'Rekapitulasi Laporan');
  }
};

const eksporRekap = async (req, res) => {
  if (req.query.format !== 'csv') return sendError(res, 'Format ekspor tidak didukung', 400);
  try {
    const { buffer, namaFile } = await rekapService.eksporCsv(
      bacaFilter(req.query),
      { id: req.user.id, role: req.user.role },
      req.ip
    );
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Length': buffer.length,
      'Content-Disposition': `attachment; filename="${namaFile}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    return res.end(buffer);
  } catch (error) {
    return tanganiGalat(res, error, 'Ekspor Rekapitulasi');
  }
};

module.exports = { ambilRekap, eksporRekap };
