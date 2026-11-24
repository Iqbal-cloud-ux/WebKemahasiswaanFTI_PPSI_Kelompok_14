const express = require('express');
const router = express.Router();
const {
  daftarLayanan, daftarKelola, tambahLayanan, ubahLayanan, ubahStatusLayanan, hapusLayanan, simpanTemplate,
} = require('../controllers/layananController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// Semua peran yang sudah login boleh melihat daftar layanan aktif.
router.get('/', verifyToken, daftarLayanan);

// Kelola layanan, syarat, dan template: khusus Staf Akademik (#79).
router.get('/kelola', verifyToken, checkRole('staf'), daftarKelola);
router.post('/', verifyToken, checkRole('staf'), tambahLayanan);
router.put('/:id', verifyToken, checkRole('staf'), ubahLayanan);
router.patch('/:id/status', verifyToken, checkRole('staf'), ubahStatusLayanan);
router.delete('/:id', verifyToken, checkRole('staf'), hapusLayanan);
router.put('/:id/template', verifyToken, checkRole('staf'), simpanTemplate);

module.exports = router;
