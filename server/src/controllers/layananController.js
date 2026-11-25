const Layanan = require('../models/layananModel');
const User = require('../models/userModel');
const { periksaKelayakan } = require('../services/kelayakanService');
const layananService = require('../services/layananService');
const {
  VARIABEL, ISIAN_LAYANAN, KEPERLUAN_TETAP, FORMULIR_MAHASISWA, LAYANAN_TANPA_NOMOR,
} = require('../utils/templateSurat');
const { buatFormulirMahasiswa } = require('../services/drafService');
const { PENANDA_NOMOR } = require('../utils/nomorSurat');
const db = require('../config/db');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { tanganiGalat } = require('../utils/galat');

// GET /api/layanan: layanan aktif beserta syarat dokumennya.
// Untuk mahasiswa, tiap layanan diberi "kelayakan" agar formulir bisa menonaktifkan layanan
// yang belum boleh diajukan beserta alasannya. Server tetap memeriksa ulang saat pengajuan dikirim.
const daftarLayanan = async (req, res) => {
  try {
    // isian: kolom tambahan yang diisi mahasiswa; keperluan_tetap: bila terisi, kolom Keperluan tidak ditampilkan.
    const layanan = (await Layanan.daftarAktif()).map((item) => ({
      ...item,
      isian: ISIAN_LAYANAN[item.kode_layanan] || [],
      keperluan_tetap: KEPERLUAN_TETAP[item.kode_layanan] || null,
      // Nama syarat tempat mengunggah formulir yang sudah ditandatangani, bila layanan memakai formulir unduhan.
      formulir_syarat: FORMULIR_MAHASISWA[item.kode_layanan] || null,
    }));
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

// GET /api/layanan/kelola (staf): semua layanan termasuk nonaktif, beserta template, daftar variabel,
// penanda format nomor surat, dan nomor urut surat terakhir tahun berjalan.
const daftarKelola = async (req, res) => {
  try {
    return sendSuccess(res, 'Daftar layanan untuk dikelola', {
      layanan: (await Layanan.daftarKelola()).map((item) => ({ ...item, tanpa_nomor: LAYANAN_TANPA_NOMOR.includes(item.kode_layanan) })),
      variabel: VARIABEL,
      penanda_nomor: PENANDA_NOMOR,
      nomor_urut: await layananService.ambilNomorUrut(db),
    });
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
// PUT /api/layanan/:id/template  { header_surat, body_template, footer_surat, format_nomor }
const simpanTemplate = aksi('Simpan Template', 'Template surat berhasil disimpan', (id, req) => layananService.simpanTemplate(id, req.body, aktorDari(req)));
// PUT /api/layanan/nomor-surat  { nomor_terakhir }: nomor urut surat terakhir tahun berjalan.
const aturNomorUrut = aksi('Atur Nomor Urut Surat', 'Nomor urut surat berhasil disimpan', (id, req) => layananService.aturNomorUrut(req.body, aktorDari(req)));

// POST /api/layanan/:id/formulir (mahasiswa)  { data_isian, no_hp }: formulir terisi data untuk dicetak dan ditandatangani.
const unduhFormulir = async (req, res) => {
  try {
    const id = idDariParam(req);
    if (!id) return sendError(res, 'Layanan tidak ditemukan', 404);
    const pdf = await buatFormulirMahasiswa(id, req.user.id, req.body.data_isian, req.body.no_hp);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': pdf.length,
      'Content-Disposition': 'attachment; filename="formulir-pernyataan.pdf"',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    return res.end(pdf);
  } catch (error) {
    return tanganiGalat(res, error, 'Unduh Formulir');
  }
};

module.exports = {
  unduhFormulir,
  daftarLayanan, daftarKelola, tambahLayanan, ubahLayanan, ubahStatusLayanan, hapusLayanan, simpanTemplate, aturNomorUrut,
};
