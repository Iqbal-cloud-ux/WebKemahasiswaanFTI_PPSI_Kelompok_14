const express = require('express');
const router = express.Router();
const { periksaKeaslian } = require('../controllers/verifikasiController');

router.post('/', periksaKeaslian);

module.exports = router;
