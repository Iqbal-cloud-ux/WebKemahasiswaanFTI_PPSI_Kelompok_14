const express = require('express');
const router = express.Router();
const {
  kirimPengajuan, daftarPengajuanSaya, detailPengajuan, daftarSemuaPengajuan, periksa, ajukanUlangPengajuan,
} = require('../controllers/pengajuanController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');
const { terimaBerkasPersyaratan } = require('../middlewares/unggahBerkas');

// Peran diperiksa SEBELUM berkas diterima, agar peran lain tidak bisa mengisi disk server.
router.post('/', verifyToken, checkRole('mahasiswa'), terimaBerkasPersyaratan, kirimPengajuan);
router.get('/', verifyToken, checkRole('staf'), daftarSemuaPengajuan);
router.get('/saya', verifyToken, checkRole('mahasiswa'), daftarPengajuanSaya);
router.get('/:id', verifyToken, checkRole('mahasiswa', 'staf', 'kakor', 'wadek1', 'dekan'), detailPengajuan);
router.post('/:id/pemeriksaan', verifyToken, checkRole('staf'), periksa);
router.put('/:id/ajukan-ulang', verifyToken, checkRole('mahasiswa'), terimaBerkasPersyaratan, ajukanUlangPengajuan);

module.exports = router;
