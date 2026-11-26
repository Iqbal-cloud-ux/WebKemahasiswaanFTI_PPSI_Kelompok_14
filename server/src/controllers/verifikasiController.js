const { sendSuccess } = require('../utils/responseHandler');
const { tanganiGalat } = require('../utils/galat');
const { verifikasiSurat } = require('../services/verifikasiService');

const periksaKeaslian = async (req, res) => {
  try {
    const hasil = await verifikasiSurat({
      nomor: req.body?.nomor,
      hash: req.body?.hash,
      userAgent: req.get('user-agent'),
      ipAddress: req.ip,
    });
    return sendSuccess(
      res,
      hasil.valid ? 'Surat terverifikasi' : 'Surat tidak dapat diverifikasi',
      hasil
    );
  } catch (error) {
    return tanganiGalat(res, error, 'Verifikasi Surat');
  }
};

module.exports = { periksaKeaslian };
