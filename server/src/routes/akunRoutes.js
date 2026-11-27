const express = require('express');
const router = express.Router();
const { daftar, ubah, aktifkan, resetSandi } = require('../controllers/akunController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// Manajemen Data dan Akun (#131): khusus Staf Akademik.
const staf = [verifyToken, checkRole('staf')];

router.get('/', ...staf, daftar);
router.put('/:id', ...staf, ubah);
router.patch('/:id/aktifkan', ...staf, aktifkan);
router.post('/:id/reset-sandi', ...staf, resetSandi);

module.exports = router;
