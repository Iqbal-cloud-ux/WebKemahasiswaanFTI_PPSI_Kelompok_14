const express = require('express');
const router = express.Router();
const { ambilRekap, eksporRekap } = require('../controllers/rekapController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, checkRole('staf'), ambilRekap);
router.get('/ekspor', verifyToken, checkRole('staf'), eksporRekap);

module.exports = router;
