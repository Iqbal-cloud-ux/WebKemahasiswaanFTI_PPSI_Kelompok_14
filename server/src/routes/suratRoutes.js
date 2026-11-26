const express = require('express');
const router = express.Router();
const { daftarArsip, unduhQrSurat, unduhSuratTerbit } = require('../controllers/suratController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.get('/arsip', verifyToken, checkRole('staf'), daftarArsip);
router.get('/arsip/:pengajuanId/qr', verifyToken, checkRole('staf'), unduhQrSurat);

router.get(
  '/:pengajuanId/pdf',
  verifyToken,
  checkRole('mahasiswa', 'staf', 'kakor', 'wadek1', 'dekan'),
  unduhSuratTerbit
);

module.exports = router;
