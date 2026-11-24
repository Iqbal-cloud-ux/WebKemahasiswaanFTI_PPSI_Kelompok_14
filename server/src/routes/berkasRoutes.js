const express = require('express');
const router = express.Router();
const { bukaBerkas } = require('../controllers/berkasController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Hak akses per berkas (pemilik, staf, pimpinan) diperiksa di controller.
router.get('/:id', verifyToken, bukaBerkas);

module.exports = router;
