const express = require('express');
const router = express.Router();
const {
  unduhFormulir, daftarLayanan, daftarKelola, tambahLayanan, ubahLayanan, ubahStatusLayanan, hapusLayanan, simpanTemplate, aturNomorUrut,
} = require('../controllers/layananController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// Semua peran yang sudah login boleh melihat daftar layanan aktif.
router.get('/', verifyToken, daftarLayanan);
// Formulir terisi data untuk layanan yang memakai formulir unduhan (misalnya Tidak Menerima Beasiswa).
router.post('/:id/formulir', verifyToken, checkRole('mahasiswa'), unduhFormulir);

// Kelola layanan, syarat, dan template: khusus Staf Akademik (#79).
router.get('/kelola', verifyToken, checkRole('staf'), daftarKelola);
router.post('/', verifyToken, checkRole('staf'), tambahLayanan);
// Didaftarkan sebelum '/:id' agar "nomor-surat" tidak dibaca sebagai id layanan.
router.put('/nomor-surat', verifyToken, checkRole('staf'), aturNomorUrut);
router.put('/:id', verifyToken, checkRole('staf'), ubahLayanan);
router.patch('/:id/status', verifyToken, checkRole('staf'), ubahStatusLayanan);
router.delete('/:id', verifyToken, checkRole('staf'), hapusLayanan);
router.put('/:id/template', verifyToken, checkRole('staf'), simpanTemplate);

module.exports = router;
