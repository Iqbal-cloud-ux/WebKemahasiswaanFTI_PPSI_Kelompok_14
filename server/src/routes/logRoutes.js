const express = require('express');
const router = express.Router();
const { daftar } = require('../controllers/logController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// Khusus Dekan. Hanya GET: log aktivitas tidak bisa diubah atau dihapus lewat API (AGENTS.md aturan 5).
router.get('/', verifyToken, checkRole('dekan'), daftar);

module.exports = router;
