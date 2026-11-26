const dekanService = require('../services/dekanService');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { tanganiGalat } = require('../utils/galat');

const idDari = (req) => {
  const id = Number(req.params.pengajuanId);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const antrean = async (req, res) => {
  try {
    return sendSuccess(res, 'Daftar surat menunggu keputusan Dekan', await dekanService.antrean());
  } catch (error) {
    return tanganiGalat(res, error, 'Antrean Keputusan Dekan');
  }
};

const riwayat = async (req, res) => {
  try {
    return sendSuccess(res, 'Riwayat keputusan Dekan', await dekanService.riwayat(req.user.id));
  } catch (error) {
    return tanganiGalat(res, error, 'Riwayat Keputusan Dekan');
  }
};

const detail = async (req, res) => {
  try {
    const id = idDari(req);
    if (!id) return sendError(res, 'Pengajuan tidak ditemukan', 404);
    return sendSuccess(res, 'Detail pemeriksaan surat', await dekanService.detail(id));
  } catch (error) {
    return tanganiGalat(res, error, 'Detail Keputusan Dekan');
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

const setujui = keputusan(dekanService.setujui, 'Surat disetujui dan berhasil diterbitkan', 'Setujui Surat');
const kembalikan = keputusan(dekanService.kembalikan, 'Draf dikembalikan ke Staf Akademik untuk direvisi', 'Kembalikan Surat');
const tolak = keputusan(dekanService.tolak, 'Pengajuan ditolak', 'Tolak Pengajuan');

module.exports = { antrean, riwayat, detail, setujui, kembalikan, tolak };
