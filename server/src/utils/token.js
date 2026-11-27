const jwt = require('jsonwebtoken');

// Sesi berakhir bila tidak aktif (usulan docs: 30 menit). Selama pengguna aktif,
// client memperpanjang token lewat POST /api/auth/refresh.
const MASA_SESI = process.env.JWT_EXPIRES_IN || '30m';

// v = users.versi_token (migrasi 008). Token yang versinya tidak sama dengan database ditolak
// (middlewares/authMiddleware.js), sehingga logout dan ganti kata sandi langsung mencabut token lama.
const buatToken = (user) => jwt.sign(
  { id: user.id, identifier: user.identifier, nama: user.nama, role: user.role, v: Number(user.versi_token || 0) },
  process.env.JWT_SECRET,
  { expiresIn: MASA_SESI }
);

module.exports = { buatToken };
