const Notifikasi = require('../models/notifikasiModel');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { tanganiGalat } = require('../utils/galat');

// GET /api/notifikasi: notifikasi milik pengguna yang login (terbaru dulu) dan jumlah yang belum dibaca.
const daftarNotifikasi = async (req, res) => {
  try {
    const [data, belumDibaca] = await Promise.all([
      Notifikasi.daftarMilik(req.user.id),
      Notifikasi.jumlahBelumDibaca(req.user.id),
    ]);
    return sendSuccess(res, 'Daftar notifikasi', { notifikasi: data, belum_dibaca: belumDibaca });
  } catch (error) {
    return tanganiGalat(res, error, 'Daftar Notifikasi');
  }
};

// PATCH /api/notifikasi/:id/baca
const bacaNotifikasi = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0 || !(await Notifikasi.milikUser(req.user.id, id))) {
      return sendError(res, 'Notifikasi tidak ditemukan', 404);
    }
    await Notifikasi.tandaiDibaca(req.user.id, id);
    return sendSuccess(res, 'Notifikasi ditandai sudah dibaca');
  } catch (error) {
    return tanganiGalat(res, error, 'Baca Notifikasi');
  }
};

// PATCH /api/notifikasi/baca-semua
const bacaSemuaNotifikasi = async (req, res) => {
  try {
    await Notifikasi.tandaiSemuaDibaca(req.user.id);
    return sendSuccess(res, 'Semua notifikasi ditandai sudah dibaca');
  } catch (error) {
    return tanganiGalat(res, error, 'Baca Semua Notifikasi');
  }
};

module.exports = { daftarNotifikasi, bacaNotifikasi, bacaSemuaNotifikasi };
