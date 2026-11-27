const path = require('path');
const Pengajuan = require('../models/pengajuanModel');
const { buatPengajuan, ajukanUlang } = require('../services/pengajuanService');
const { periksaPengajuan } = require('../services/pemeriksaanService');
const { daftarAktivitas } = require('../services/aktivitasService');
const { TAHAP_PIMPINAN } = require('../services/statusService');
const { hapusBerkas } = require('../middlewares/unggahBerkas');
const { ISIAN_LAYANAN, KEPERLUAN_TETAP } = require('../utils/templateSurat');

const FOLDER_UPLOADS = path.resolve(__dirname, '../../uploads');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { tanganiGalat } = require('../utils/galat');

// POST /api/pengajuan (mahasiswa, multipart/form-data)
// Field: jenis_layanan_id, keperluan, no_hp (opsional), data_isian (JSON, untuk layanan yang punya isian
// tambahan), berkas_<id syarat> (satu berkas per syarat).
const kirimPengajuan = async (req, res) => {
  try {
    const hasil = await buatPengajuan({
      mahasiswaId: req.user.id,
      jenisLayananId: req.body.jenis_layanan_id,
      keperluan: req.body.keperluan,
      noHp: req.body.no_hp,
      dataIsian: req.body.data_isian,
      files: req.files || [],
      ipAddress: req.ip,
    });
    return sendSuccess(res, 'Pengajuan berhasil dikirim', hasil, 201);
  } catch (error) {
    // Pengajuan tidak tersimpan, jadi berkas yang sudah diunggah juga dibuang.
    await hapusBerkas(req.files);
    return tanganiGalat(res, error, 'Kirim Pengajuan');
  }
};

// GET /api/pengajuan/saya (mahasiswa): semua pengajuan milik mahasiswa yang login.
const daftarPengajuanSaya = async (req, res) => {
  try {
    return sendSuccess(res, 'Daftar pengajuan Anda', await Pengajuan.daftarMilikMahasiswa(req.user.id));
  } catch (error) {
    return tanganiGalat(res, error, 'Daftar Pengajuan Saya');
  }
};

// GET /api/pengajuan/:id: detail, berkas, dan riwayat status.
// Mahasiswa hanya boleh membuka pengajuan miliknya; staf dan pimpinan boleh membuka semua.
const detailPengajuan = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return sendError(res, 'Pengajuan tidak ditemukan', 404);

    const pengajuan = await Pengajuan.cariDetail(id);
    if (!pengajuan) return sendError(res, 'Pengajuan tidak ditemukan', 404);

    const untukMahasiswa = req.user.role === 'mahasiswa';
    if (untukMahasiswa && pengajuan.mahasiswa_id !== req.user.id) {
      return sendError(res, 'Anda tidak berhak membuka pengajuan ini', 403);
    }

    const [berkas, riwayat] = await Promise.all([Pengajuan.daftarBerkas(id), Pengajuan.riwayat(id)]);
    // Catatan pimpinan saat mengembalikan draf ditujukan untuk staf; tidak ditampilkan ke mahasiswa.
    const riwayatTampil = untukMahasiswa
      ? riwayat.map((r) => (TAHAP_PIMPINAN.includes(r.status_sebelumnya) && r.status_baru === 'diverifikasi' ? { ...r, catatan: null } : r))
      : riwayat;

    // Label isian tambahan dan keperluan tetap layanan ini, untuk ditampilkan di halaman detail dan perbaikan.
    const kode = pengajuan.layanan.kode_layanan;
    return sendSuccess(res, 'Detail pengajuan', {
      ...pengajuan, berkas, riwayat: riwayatTampil, isian: ISIAN_LAYANAN[kode] || [], keperluan_tetap: KEPERLUAN_TETAP[kode] || null,
    });
  } catch (error) {
    return tanganiGalat(res, error, 'Detail Pengajuan');
  }
};

// GET /api/pengajuan (staf): seluruh pengajuan untuk halaman Daftar Pengajuan.
const daftarSemuaPengajuan = async (req, res) => {
  try {
    return sendSuccess(res, 'Daftar pengajuan', await Pengajuan.daftarSemua());
  } catch (error) {
    return tanganiGalat(res, error, 'Daftar Semua Pengajuan');
  }
};

// GET /api/pengajuan/aktivitas?jumlah=8 (staf): perpindahan status terbaru untuk Beranda Staf.
const aktivitasTerbaru = async (req, res) => {
  try {
    return sendSuccess(res, 'Aktivitas terbaru', await daftarAktivitas({ id: req.user.id, role: req.user.role }, req.query.jumlah));
  } catch (error) {
    return tanganiGalat(res, error, 'Aktivitas Terbaru');
  }
};

// POST /api/pengajuan/:id/pemeriksaan (staf)
// Body: { keputusan: 'verifikasi' | 'perbaikan' | 'tolak', catatan, berkas: [{ id, status_verifikasi, catatan }] }
const periksa = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return sendError(res, 'Pengajuan tidak ditemukan', 404);
    const hasil = await periksaPengajuan({
      pengajuanId: id,
      keputusan: req.body.keputusan,
      catatan: req.body.catatan,
      berkas: req.body.berkas,
      aktor: { id: req.user.id, role: req.user.role },
      ipAddress: req.ip,
    });
    const pesan = { diverifikasi: 'Pengajuan berhasil diverifikasi', perlu_perbaikan: 'Pengajuan dikembalikan ke mahasiswa untuk diperbaiki', ditolak: 'Pengajuan ditolak' };
    return sendSuccess(res, pesan[hasil.status], hasil);
  } catch (error) {
    return tanganiGalat(res, error, 'Pemeriksaan Pengajuan');
  }
};

// PUT /api/pengajuan/:id/ajukan-ulang (mahasiswa pemilik, multipart/form-data)
// Field: berkas_<id syarat> untuk berkas pengganti, keperluan dan data_isian (opsional, bila ingin diubah).
const ajukanUlangPengajuan = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      await hapusBerkas(req.files);
      return sendError(res, 'Pengajuan tidak ditemukan', 404);
    }
    const { hasil, berkasLama } = await ajukanUlang({
      pengajuanId: id,
      mahasiswaId: req.user.id,
      keperluan: req.body.keperluan,
      dataIsian: req.body.data_isian,
      files: req.files || [],
      ipAddress: req.ip,
    });
    // File lama baru dihapus setelah database berhasil diperbarui.
    await hapusBerkas(berkasLama.map((filePath) => ({ path: path.join(FOLDER_UPLOADS, filePath) })));
    return sendSuccess(res, 'Perbaikan berhasil dikirim dan menunggu pemeriksaan ulang', hasil);
  } catch (error) {
    await hapusBerkas(req.files);
    return tanganiGalat(res, error, 'Ajukan Ulang Pengajuan');
  }
};

module.exports = {
  kirimPengajuan, daftarPengajuanSaya, detailPengajuan, daftarSemuaPengajuan, aktivitasTerbaru, periksa, ajukanUlangPengajuan,
};
