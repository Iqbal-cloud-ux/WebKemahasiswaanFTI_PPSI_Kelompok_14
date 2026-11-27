// Manajemen Data dan Akun (#131), khusus Staf Akademik.
const akunService = require('../services/akunService');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { tanganiGalat } = require('../utils/galat');

const idDariParam = (req) => {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
};
const aktorDari = (req) => ({ id: req.user.id, role: req.user.role });

// GET /api/akun
const daftar = async (req, res) => {
  try {
    return sendSuccess(res, 'Daftar akun', await akunService.daftarAkun(aktorDari(req)));
  } catch (error) {
    return tanganiGalat(res, error, 'Daftar Akun');
  }
};

// PUT /api/akun/:id  { identifier, nama, email, no_hp, prodi, jenjang, angkatan }
const ubah = async (req, res) => {
  try {
    const id = idDariParam(req);
    if (!id) return sendError(res, 'Akun tidak ditemukan', 404);
    const hasil = await akunService.ubahDataMahasiswa({ id, data: req.body, aktor: aktorDari(req), ipAddress: req.ip });
    const pesan = hasil.berubah.length ? 'Data akun berhasil disimpan' : 'Tidak ada data yang berubah';
    return sendSuccess(res, pesan, hasil);
  } catch (error) {
    return tanganiGalat(res, error, 'Ubah Data Akun');
  }
};

// PATCH /api/akun/:id/aktifkan
const aktifkan = async (req, res) => {
  try {
    const id = idDariParam(req);
    if (!id) return sendError(res, 'Akun tidak ditemukan', 404);
    const akun = await akunService.aktifkanAkun({ id, aktor: aktorDari(req), ipAddress: req.ip });
    return sendSuccess(res, 'Akun berhasil diaktifkan', akun);
  } catch (error) {
    return tanganiGalat(res, error, 'Aktifkan Akun');
  }
};

// POST /api/akun/:id/reset-sandi: kata sandi sementara hanya dikirim di respons ini.
const resetSandi = async (req, res) => {
  try {
    const id = idDariParam(req);
    if (!id) return sendError(res, 'Akun tidak ditemukan', 404);
    const hasil = await akunService.resetKataSandi({ id, aktor: aktorDari(req), ipAddress: req.ip });
    res.set('Cache-Control', 'no-store');
    return sendSuccess(res, 'Kata sandi berhasil direset', hasil);
  } catch (error) {
    return tanganiGalat(res, error, 'Reset Kata Sandi');
  }
};

module.exports = { daftar, ubah, aktifkan, resetSandi };
