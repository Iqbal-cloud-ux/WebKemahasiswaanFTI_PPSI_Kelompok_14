const express = require('express');
const router = express.Router();
const { periksaKeaslian } = require('../controllers/verifikasiController');
const { buatPembatasLaju } = require('../middlewares/pembatasLaju');

// Endpoint publik tanpa login. Setiap pemeriksaan surat yang ditemukan dicatat di public_verification,
// jadi jumlah permintaan per IP dibatasi agar tabel itu tidak bisa dibanjiri.
const batasiVerifikasi = buatPembatasLaju({
  batas: 30,
  jendelaMs: 10 * 60 * 1000,
  pesan: 'Terlalu banyak pemeriksaan keaslian surat dari perangkat ini.',
});

router.post('/', batasiVerifikasi, periksaKeaslian);

module.exports = router;
