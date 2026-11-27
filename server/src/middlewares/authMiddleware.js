const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { sendError } = require('../utils/responseHandler');
const { statusStudi } = require('../utils/statusStudi');

// Selama akun wajib mengganti kata sandi sementara (migrasi 008), hanya permintaan ini yang dilayani.
const BOLEH_SAAT_WAJIB_GANTI_SANDI = new Set([
  'GET /api/auth/me',
  'POST /api/auth/refresh',
  'POST /api/auth/logout',
  'GET /api/profil',
  'PUT /api/profil/kata-sandi',
]);

// 1. Middleware Verifikasi Token JWT
// Selain tanda tangan token, akun diperiksa ulang di database pada setiap permintaan, agar akun
// yang dinonaktifkan, dihapus, diganti perannya, atau ditutup karena lulus/lewat masa studi
// (utils/statusStudi.js) tidak bisa dipakai sampai tokennya habis. Token yang versinya lebih lama
// dari users.versi_token (sesudah logout atau ganti kata sandi) juga ditolak.
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <TOKEN>"

  if (!token) {
    return sendError(res, 'Akses ditolak. Token tidak ditemukan', 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    // 401 = belum/tidak lagi terautentikasi. 403 khusus untuk peran yang tidak berhak.
    return sendError(res, 'Sesi tidak valid atau sudah berakhir. Silakan masuk kembali', 401);
  }

  try {
    const akun = await User.statusAkses(decoded.id);
    if (!akun) return sendError(res, 'Akun tidak ditemukan. Silakan masuk kembali', 401);
    const status = statusStudi(akun);
    if (!status.bolehLogin) return sendError(res, status.pesan, 401);
    if (akun.role !== decoded.role) {
      return sendError(res, 'Peran akun Anda telah berubah. Silakan masuk kembali', 401);
    }
    if (Number(akun.versi_token || 0) !== Number(decoded.v || 0)) {
      return sendError(res, 'Sesi ini sudah tidak berlaku karena Anda keluar atau kata sandi diganti. Silakan masuk kembali', 401);
    }
    const permintaan = `${req.method} ${`${req.baseUrl}${req.path}`.replace(/\/+$/, '')}`;
    if (Number(akun.wajib_ganti_sandi || 0) === 1 && !BOLEH_SAAT_WAJIB_GANTI_SANDI.has(permintaan)) {
      return sendError(res, 'Ganti kata sandi sementara Anda terlebih dahulu', 403);
    }
  } catch (error) {
    console.error('Error Periksa Akun:', error);
    return sendError(res, 'Terjadi kesalahan pada server. Coba lagi beberapa saat lagi', 500);
  }

  req.user = decoded; // Menyimpan data payload user (id, identifier, role, nama) ke objek request
  return next();
};

// 2. Middleware Control Hak Akses Berdasarkan Role (RBAC)
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return sendError(
        res, 
        `Akses ditolak. Role '${req.user?.role || 'Guest'}' tidak memiliki izin mengakses fitur ini`, 
        403
      );
    }
    next();
  };
};

module.exports = { verifyToken, checkRole };