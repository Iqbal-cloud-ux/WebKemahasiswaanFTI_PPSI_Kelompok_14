const express = require('express');
const router = express.Router();
const { daftar, detail, simpan, pratinjau, teruskan, pdf } = require('../controllers/drafController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// Penyusunan draf: khusus Staf Akademik (#81, #82). PDF draf juga dibuka pimpinan saat memeriksa (#88).
router.get('/', verifyToken, checkRole('staf'), daftar);
router.get('/:pengajuanId', verifyToken, checkRole('staf'), detail);
router.put('/:pengajuanId', verifyToken, checkRole('staf'), simpan);
router.post('/:pengajuanId/pratinjau', verifyToken, checkRole('staf'), pratinjau);
router.post('/:pengajuanId/teruskan', verifyToken, checkRole('staf'), teruskan);
router.get('/:pengajuanId/pdf', verifyToken, checkRole('staf', 'kakor', 'wadek1', 'dekan'), pdf);

module.exports = router;
