const express = require('express');
const router = express.Router();
const { antrean, riwayat, detail, setujui, kembalikan, tolak } = require('../controllers/dekanController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

const dekan = [verifyToken, checkRole('dekan')];

router.get('/antrean', ...dekan, antrean);
router.get('/riwayat', ...dekan, riwayat);
router.get('/:pengajuanId', ...dekan, detail);
router.post('/:pengajuanId/setujui', ...dekan, setujui);
router.post('/:pengajuanId/kembalikan', ...dekan, kembalikan);
router.post('/:pengajuanId/tolak', ...dekan, tolak);

module.exports = router;
