const express = require('express');
const router = express.Router();
const { unduhSuratTerbit } = require('../controllers/suratController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.get(
  '/:pengajuanId/pdf',
  verifyToken,
  checkRole('mahasiswa', 'staf', 'kakor', 'wadek1', 'dekan'),
  unduhSuratTerbit
);

module.exports = router;
