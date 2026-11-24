const express = require('express');
const router = express.Router();
const { daftarNotifikasi, bacaNotifikasi, bacaSemuaNotifikasi } = require('../controllers/notifikasiController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Setiap pengguna hanya melihat notifikasinya sendiri (user_id dari token).
router.get('/', verifyToken, daftarNotifikasi);
router.patch('/baca-semua', verifyToken, bacaSemuaNotifikasi);
router.patch('/:id/baca', verifyToken, bacaNotifikasi);

module.exports = router;
