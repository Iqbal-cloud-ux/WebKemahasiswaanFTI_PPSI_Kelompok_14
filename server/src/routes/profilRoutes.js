const express = require('express');
const router = express.Router();
const { lihatProfil, ubahKontak, ubahKataSandi } = require('../controllers/profilController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Setiap peran hanya bisa melihat dan mengubah profilnya sendiri (id diambil dari token).
router.get('/', verifyToken, lihatProfil);
router.patch('/', verifyToken, ubahKontak);
router.put('/kata-sandi', verifyToken, ubahKataSandi);

module.exports = router;
