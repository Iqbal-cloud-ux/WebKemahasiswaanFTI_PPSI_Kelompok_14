const Layanan = require('../models/layananModel');
const User = require('../models/userModel');
const { periksaKelayakan } = require('../services/kelayakanService');
const layananService = require('../services/layananService');
const { VARIABEL } = require('../utils/templateSurat');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { tanganiGalat } = require('../utils/galat');

// GET /api/layanan: layanan aktif beserta syarat dokumennya.
// Untuk mahasiswa, tiap layanan diberi "kelayakan" agar formulir bisa menonaktifkan layanan
// yang belum boleh diajukan beserta alasannya. Server tetap memeriksa ulang saat pengajuan dikirim.
const daftarLayanan = async (req, res) => {
  try {
    const layanan = await Layanan.daftarAktif();
    if (req.user.role !== 'mahasiswa') {
      return sendSuccess(res, 'Daftar layanan', layanan);
    }
    const mahasiswa = await User.findById(req.user.id);
    const hasil = await Promise.all(layanan.map(async (item) => ({
      ...item,
      kelayakan: await periksaKelayakan({ layanan: item, mahasiswa }),
    })));
    return sendSuccess(res, 'Daftar layanan', hasil);
  } catch (error) {
    return tanganiGalat(res, error, 'Daftar Layanan');
  }
};

// GET /api/layanan/kelola (staf): semua layanan termasuk nonaktif, beserta template dan daftar variabel.
const daftarKelola = async (req, res) => {
  try {
    return sendSuccess(res, 'Daftar layanan untuk dikelola', { layanan: await Layanan.daftarKelola(), variabel: VARIABEL });
  } catch (error) {
    return tanganiGalat(res, error, 'Daftar Kelola Layanan');
  }
};

const idDariParam = (req) => {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
};
const aktorDari = (req) => ({ id: req.user.id, ip: req.ip });

// Pembungkus agar setiap aksi kelola layanan punya penanganan id dan galat yang sama.
const aksi = (konteks, pesan, jalankan, status = 200) => async (req, res) => {
  try {
    const id = idDariParam(req);
    if (req.params.id !== undefined && !id) return sendError(res, 'Layanan tidak ditemukan', 404);
    return sendSuccess(res, pesan, await jalankan(id, req), status);
  } catch (error) {
    return tanganiGalat(res, error, konteks);
  }
};

// POST /api/layanan  { kode_layanan, nama_layanan, deskripsi, syarat: [{ nama_syarat, is_required }] }
const tambahLayanan = aksi('Tambah Layanan', 'Layanan berhasil ditambahkan', (id, req) => layananService.buatLayanan(req.body, aktorDari(req)), 201);
// PUT /api/layanan/:id  (body sama dengan tambah; syarat lama dikirim beserta id-nya)
const ubahLayanan = aksi('Ubah Layanan', 'Layanan berhasil disimpan', (id, req) => layananService.ubahLayanan(id, req.body, aktorDari(req)));
// PATCH /api/layanan/:id/status  { is_active }
const ubahStatusLayanan = aksi('Ubah Status Layanan', 'Status layanan berhasil diubah', (id, req) => layananService.ubahStatusLayanan(id, Boolean(req.body.is_active), aktorDari(req)));
// DELETE /api/layanan/:id
const hapusLayanan = aksi('Hapus Layanan', 'Layanan berhasil dihapus', (id, req) => layananService.hapusLayanan(id, aktorDari(req)));
// PUT /api/layanan/:id/template  { header_surat, body_template, footer_surat }
const simpanTemplate = aksi('Simpan Template', 'Template surat berhasil disimpan', (id, req) => layananService.simpanTemplate(id, req.body, aktorDari(req)));

module.exports = { daftarLayanan, daftarKelola, tambahLayanan, ubahLayanan, ubahStatusLayanan, hapusLayanan, simpanTemplate };
