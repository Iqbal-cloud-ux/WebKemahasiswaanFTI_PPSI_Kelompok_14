const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { sendSuccess, sendError } = require('../utils/responseHandler');

const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return sendError(res, 'NIM/NIP/Email dan Password wajib diisi', 400);
    }

    const user = await User.findByIdentifierOrEmail(identifier);
    if (!user) {
      return sendError(res, 'Kredensial tidak valid (User tidak ditemukan)', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return sendError(res, 'Kredensial tidak valid (Password salah)', 401);
    }

    const payload = {
      id: user.id,
      identifier: user.identifier,
      nama: user.nama,
      role: user.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret_key', {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });

    const userData = {
      id: user.id,
      identifier: user.identifier,
      nama: user.nama,
      email: user.email,
      role: user.role,
      prodi: user.prodi,
      token
    };

    return sendSuccess(res, 'Login berhasil', userData);
  } catch (error) {
    console.error('Error Login:', error);
    return sendError(res, 'Terjadi kesalahan pada server', 500);
  }
};

module.exports = { login };