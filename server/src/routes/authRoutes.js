const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');
const { verifyToken, checkRole } = require('../middlewares/authMiddleware');

// Public Route
router.post('/login', login);

// Protected Route 1: Bisa diakses oleh SEMUA role yang punya Token JWT Valid
router.get('/me', verifyToken, (req, res) => {
  res.json({
    success: true,
    message: 'Akses diterima! Kamu terautentikasi.',
    user: req.user
  });
});

// Protected Route 2: Khusus Role STAF AKADEMIK saja
router.get('/khusus-staf', verifyToken, checkRole('staf'), (req, res) => {
  res.json({
    success: true,
    message: 'Selamat datang Staf Akademik FTI! Kamu memiliki akses penuh di route ini.'
  });
});

module.exports = router;