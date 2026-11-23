const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/responseHandler');

// 1. Middleware Verifikasi Token JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <TOKEN>"

  if (!token) {
    return sendError(res, 'Akses ditolak. Token tidak ditemukan', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Menyimpan data payload user (id, identifier, role, nama) ke objek request
    next();
  } catch {
    // 401 = belum/tidak lagi terautentikasi. 403 khusus untuk peran yang tidak berhak.
    return sendError(res, 'Sesi tidak valid atau sudah berakhir. Silakan masuk kembali', 401);
  }
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