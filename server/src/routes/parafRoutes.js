const express = require('express');
const router = express.Router();
const { antrean, riwayat, detail, setujui, kembalikan } = require('../controllers/parafController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// Paraf berjenjang (#88): khusus Kepala Kantor dan Wakil Dekan 1.
// Tahap yang boleh diproses tiap peran diperiksa statusService (kakor: pending_kakor, wadek1: pending_wadek1).
const pimpinan = [verifyToken, checkRole('kakor', 'wadek1')];

router.get('/antrean', ...pimpinan, antrean);
router.get('/riwayat', ...pimpinan, riwayat);
router.get('/:pengajuanId', ...pimpinan, detail);
router.post('/:pengajuanId/setujui', ...pimpinan, setujui);
router.post('/:pengajuanId/kembalikan', ...pimpinan, kembalikan);

module.exports = router;
