const parafService = require('../services/parafService');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { tanganiGalat } = require('../utils/galat');

const idDari = (req) => {
  const id = Number(req.params.pengajuanId);
  return Number.isInteger(id) && id > 0 ? id : null;
};

// GET /api/paraf/antrean (kakor, wadek1): draf yang menunggu paraf peran yang login.
const antrean = async (req, res) => {
  try {
    return sendSuccess(res, 'Antrean draf menunggu pemeriksaan', await parafService.antrean(req.user.role));
  } catch (error) {
    return tanganiGalat(res, error, 'Antrean Paraf');
  }
};

// GET /api/paraf/riwayat (kakor, wadek1): keputusan yang pernah diambil pimpinan yang login.
const riwayat = async (req, res) => {
  try {
    return sendSuccess(res, 'Riwayat pengesahan', await parafService.riwayat(req.user.id));
  } catch (error) {
    return tanganiGalat(res, error, 'Riwayat Paraf');
  }
};

// GET /api/paraf/:pengajuanId: detail pemeriksaan surat.
const detail = async (req, res) => {
  try {
    const id = idDari(req);
    if (!id) return sendError(res, 'Pengajuan tidak ditemukan', 404);
    return sendSuccess(res, 'Detail pemeriksaan surat', await parafService.detail(id));
  } catch (error) {
    return tanganiGalat(res, error, 'Detail Paraf');
  }
};

const keputusan = (jalankan, pesan, konteks) => async (req, res) => {
  try {
    const id = idDari(req);
    if (!id) return sendError(res, 'Pengajuan tidak ditemukan', 404);
    const hasil = await jalankan({
      pengajuanId: id,
      aktor: { id: req.user.id, role: req.user.role },
      catatan: req.body.catatan,
      ipAddress: req.ip,
    });
    return sendSuccess(res, pesan, hasil);
  } catch (error) {
    return tanganiGalat(res, error, konteks);
  }
};

// POST /api/paraf/:pengajuanId/setujui  { catatan? }
const setujui = keputusan(parafService.setujui, 'Draf diparaf dan diteruskan ke tahap berikutnya', 'Setujui Paraf');
// POST /api/paraf/:pengajuanId/kembalikan  { catatan }
const kembalikan = keputusan(parafService.kembalikan, 'Draf dikembalikan ke Staf Akademik untuk direvisi', 'Kembalikan Draf');

module.exports = { antrean, riwayat, detail, setujui, kembalikan };
