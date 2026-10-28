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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    req.user = decoded; // Menyimpan data payload user (id, identifier, role, nama) ke objek request
    next();
  } catch (error) {
    return sendError(res, 'Token tidak valid atau sudah kadaluwarsa', 403);
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