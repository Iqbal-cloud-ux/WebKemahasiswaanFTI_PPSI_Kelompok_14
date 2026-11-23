const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { sendSuccess, sendError } = require('../utils/responseHandler');

const createUserData = (user) => {
  const payload = {
    id: user.id,
    identifier: user.identifier,
    nama: user.nama,
    role: user.role
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret_key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });

  return {
    id: user.id,
    identifier: user.identifier,
    nama: user.nama,
    email: user.email,
    role: user.role,
    prodi: user.prodi,
    token
  };
};

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

    return sendSuccess(res, 'Login berhasil', createUserData(user));
  } catch (error) {
    console.error('Error Login:', error);
    return sendError(res, 'Terjadi kesalahan pada server', 500);
  }
};

const loginStaff = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return sendError(res, 'NIP/Email dan Password wajib diisi', 400);
    }

    const user = await User.findByIdentifierOrEmail(identifier);
    if (!user || user.role !== 'staf') {
      return sendError(res, 'NIP/Email atau kata sandi salah', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, 'NIP/Email atau kata sandi salah', 401);
    }

    return sendSuccess(res, 'Login Staff Akademik berhasil', createUserData(user));
  } catch (error) {
    console.error('Error Login Staff Akademik:', error);
    return sendError(res, 'Terjadi kesalahan pada server', 500);
  }
};

module.exports = { login, loginStaff };