// Log Aktivitas (hanya baca), khusus Dekan.
const { daftarLog } = require('../services/logService');
const { sendSuccess } = require('../utils/responseHandler');
const { tanganiGalat } = require('../utils/galat');

// GET /api/log?cari=&peran=&aksi=&mulai=YYYY-MM-DD&sampai=YYYY-MM-DD&halaman=1&per_halaman=25
const daftar = async (req, res) => {
  try {
    return sendSuccess(res, 'Log aktivitas', await daftarLog(req.query, { id: req.user.id, role: req.user.role }));
  } catch (error) {
    return tanganiGalat(res, error, 'Log Aktivitas');
  }
};

module.exports = { daftar };
