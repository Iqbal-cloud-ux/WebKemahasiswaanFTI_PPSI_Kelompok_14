const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const { catatAktivitas } = require('../models/logModel');
const { catatLoginGagal, resetLoginGagal } = require('../middlewares/loginLimiter');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { statusStudi } = require('../utils/statusStudi');
const { buatToken } = require('../utils/token');

// Hash tiruan agar waktu respons sama saat akun tidak ditemukan (mencegah tebakan lewat waktu).
const HASH_TIRUAN = bcrypt.hashSync('hash-tiruan-untuk-penyamaan-waktu', 10);

// wajib_ganti_sandi (migrasi 008): client menampilkan halaman ganti kata sandi sebelum halaman lain.
const createUserData = (user) => ({
  id: user.id,
  identifier: user.identifier,
  nama: user.nama,
  email: user.email,
  role: user.role,
  prodi: user.prodi,
  jenjang: user.jenjang ?? null,
  angkatan: user.angkatan ?? null,
  no_hp: user.no_hp,
  foto_profil: user.foto_profil ?? null,
  wajib_ganti_sandi: Number(user.wajib_ganti_sandi || 0) === 1,
  token: buatToken(user)
});

const login = async (req, res) => {
  try {
    const identifier = typeof req.body.identifier === 'string' ? req.body.identifier.trim() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!identifier || !password) {
      return sendError(res, 'NIM/NIP/email dan kata sandi wajib diisi', 400);
    }

    // Pesan sengaja sama untuk akun tidak ada dan sandi salah,
    // agar orang lain tidak bisa menebak NIM/email mana yang terdaftar.
    const user = await User.findByIdentifierOrEmail(identifier);
    const isMatch = await bcrypt.compare(password, user ? user.password : HASH_TIRUAN) && Boolean(user);

    if (!isMatch) {
      catatLoginGagal(req);
      await catatAktivitas({
        userId: user ? user.id : null,
        action: 'login_gagal',
        description: user ? 'Login gagal: kata sandi salah' : 'Login gagal: akun tidak ditemukan',
        ipAddress: req.ip
      });
      return sendError(res, 'NIM/NIP/email atau kata sandi salah', 401);
    }

    resetLoginGagal(req);

    // Pesan khusus baru ditampilkan setelah kata sandi benar, agar status akun tidak bocor ke orang lain.
    // Akun nonaktif, mahasiswa yang sudah lulus (lewat masa tenggang), atau lewat masa studi (utils/statusStudi.js).
    const status = statusStudi(user);
    if (!status.bolehLogin) {
      await catatAktivitas({ userId: user.id, action: 'login_ditolak', description: `Login ditolak: ${status.label.toLowerCase()}`, ipAddress: req.ip });
      return sendError(res, status.pesan, 403);
    }

    await catatAktivitas({ userId: user.id, action: 'login', description: 'Login berhasil', ipAddress: req.ip });
    return sendSuccess(res, 'Login berhasil', createUserData(user));
  } catch (error) {
    console.error('Error Login:', error);
    return sendError(res, 'Terjadi kesalahan pada server. Coba lagi beberapa saat lagi', 500);
  }
};

// Memperpanjang sesi pengguna yang masih aktif. Data diambil ulang dari database
// agar akun yang sudah dihapus tidak bisa terus memperpanjang token.
const refresh = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, 'Akun tidak ditemukan. Silakan masuk kembali', 401);
    }
    const status = statusStudi(user);
    if (!status.bolehLogin) return sendError(res, status.pesan, 401);
    return sendSuccess(res, 'Sesi diperpanjang', { token: buatToken(user) });
  } catch (error) {
    console.error('Error Refresh Sesi:', error);
    return sendError(res, 'Terjadi kesalahan pada server. Coba lagi beberapa saat lagi', 500);
  }
};

// Logout menaikkan versi token akun (migrasi 008), sehingga token yang sudah terbit, termasuk di
// perangkat lain, langsung tidak berlaku. Client juga menghapus tokennya.
const logout = async (req, res) => {
  try {
    await User.naikkanVersiToken(req.user.id);
  } catch (error) {
    console.error('Error Cabut Token Logout:', error.message);
  }
  await catatAktivitas({ userId: req.user.id, action: 'logout', description: 'Logout', ipAddress: req.ip });
  return sendSuccess(res, 'Logout berhasil');
};

// ===== Login pintasan KHUSUS PENGUJIAN LOKAL =====
// Aktif hanya bila NODE_ENV bukan 'production' DAN LOGIN_UJI=aktif di server/.env.
// Bila tidak aktif, rutenya tidak didaftarkan sama sekali (lihat routes/authRoutes.js).
// Hanya bisa masuk ke akun uji palsu dari seed (email @contoh.test), tidak pernah ke akun asli.
const loginUjiAktif = process.env.NODE_ENV !== 'production' && process.env.LOGIN_UJI === 'aktif';
const AKUN_UJI = {
  mahasiswa: 'mahasiswa1@contoh.test',
  staf: 'staf-pintasan@contoh.test',
  kakor: 'kakor@contoh.test',
  wadek1: 'wadek1@contoh.test',
  dekan: 'dekan@contoh.test',
};

// POST /api/auth/login-uji  { role }
const loginUji = async (req, res) => {
  try {
    const email = AKUN_UJI[req.body.role];
    if (!email) return sendError(res, 'Peran tidak dikenal', 400);
    const user = await User.findByIdentifierOrEmail(email);
    if (!user || user.role !== req.body.role || !user.email.endsWith('@contoh.test')) {
      return sendError(res, `Akun uji ${email} belum ada. Jalankan "npm run seed" di folder server`, 404);
    }
    const status = statusStudi(user);
    if (!status.bolehLogin) return sendError(res, `Akun uji ini tidak bisa dipakai. ${status.pesan}`, 403);
    await catatAktivitas({ userId: user.id, action: 'login_uji', description: 'Login pintasan pengujian (tanpa kata sandi)', ipAddress: req.ip });
    return sendSuccess(res, 'Login uji berhasil', createUserData(user));
  } catch (error) {
    console.error('Error Login Uji:', error);
    return sendError(res, 'Terjadi kesalahan pada server. Coba lagi beberapa saat lagi', 500);
  }
};

module.exports = { login, refresh, logout, loginUji, loginUjiAktif };
