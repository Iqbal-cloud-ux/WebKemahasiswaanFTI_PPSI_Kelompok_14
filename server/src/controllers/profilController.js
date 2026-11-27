const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const { catatAktivitas } = require('../models/logModel');
const { sendSuccess, sendError } = require('../utils/responseHandler');
const { tanganiGalat } = require('../utils/galat');

const POLA_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POLA_NO_HP = /^\+?[0-9][0-9 -]{7,18}$/;

// Aturan kata sandi sama dengan yang ditampilkan di halaman Profil.
const masalahKataSandi = (sandi) => {
  if (sandi.length < 8) return 'Kata sandi baru minimal 8 karakter';
  if (sandi.length > 72) return 'Kata sandi baru maksimal 72 karakter';
  if (!/[A-Z]/.test(sandi)) return 'Kata sandi baru harus memuat huruf besar';
  if (!/[a-z]/.test(sandi)) return 'Kata sandi baru harus memuat huruf kecil';
  if (!/[0-9]/.test(sandi)) return 'Kata sandi baru harus memuat angka';
  if (!/[^A-Za-z0-9]/.test(sandi)) return 'Kata sandi baru harus memuat simbol';
  return null;
};

// Data profil yang boleh dikirim ke client (tanpa password).
const dataProfil = (user) => ({
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
});

// GET /api/profil
const lihatProfil = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return sendError(res, 'Akun tidak ditemukan. Silakan masuk kembali', 401);
    return sendSuccess(res, 'Profil', dataProfil(user));
  } catch (error) {
    return tanganiGalat(res, error, 'Lihat Profil');
  }
};

// PATCH /api/profil  { email, no_hp }: hanya kontak yang boleh diubah sendiri.
// Nama, NIM/NIP, prodi, jenjang, dan angkatan adalah data akademik (hanya baca).
const ubahKontak = async (req, res) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const noHp = typeof req.body.no_hp === 'string' ? req.body.no_hp.trim() : '';
    if (!email || !POLA_EMAIL.test(email) || email.length > 100) {
      return sendError(res, 'Email tidak valid. Contoh: nama@contoh.com', 400);
    }
    if (noHp && !POLA_NO_HP.test(noHp)) {
      return sendError(res, 'Nomor telepon/WhatsApp tidak valid. Gunakan angka, contoh: 081234567890', 400);
    }
    if (await User.emailDipakaiAkunLain(email, req.user.id)) {
      return sendError(res, 'Email ini sudah dipakai akun lain', 409);
    }

    await User.ubahKontak(req.user.id, { email, noHp: noHp || null });
    await catatAktivitas({ userId: req.user.id, action: 'ubah_profil', description: 'Mengubah email/nomor telepon', ipAddress: req.ip });
    return sendSuccess(res, 'Informasi kontak berhasil disimpan', dataProfil(await User.findById(req.user.id)));
  } catch (error) {
    return tanganiGalat(res, error, 'Ubah Kontak');
  }
};

// PUT /api/profil/kata-sandi  { kata_sandi_lama, kata_sandi_baru }
const ubahKataSandi = async (req, res) => {
  try {
    const lama = typeof req.body.kata_sandi_lama === 'string' ? req.body.kata_sandi_lama : '';
    const baru = typeof req.body.kata_sandi_baru === 'string' ? req.body.kata_sandi_baru : '';
    if (!lama || !baru) return sendError(res, 'Kata sandi lama dan kata sandi baru wajib diisi', 400);

    const masalah = masalahKataSandi(baru);
    if (masalah) return sendError(res, masalah, 400);
    if (lama === baru) return sendError(res, 'Kata sandi baru harus berbeda dari kata sandi lama', 400);

    const user = await User.findById(req.user.id);
    if (!user) return sendError(res, 'Akun tidak ditemukan. Silakan masuk kembali', 401);
    if (!(await bcrypt.compare(lama, user.password))) {
      await catatAktivitas({ userId: user.id, action: 'ubah_kata_sandi_gagal', description: 'Kata sandi lama salah', ipAddress: req.ip });
      return sendError(res, 'Kata sandi lama salah', 400);
    }

    await User.ubahPassword(user.id, await bcrypt.hash(baru, 10));
    await catatAktivitas({ userId: user.id, action: 'ubah_kata_sandi', description: 'Kata sandi diubah', ipAddress: req.ip });
    return sendSuccess(res, 'Kata sandi berhasil diubah');
  } catch (error) {
    return tanganiGalat(res, error, 'Ubah Kata Sandi');
  }
};

// PUT /api/profil/foto  { foto_profil: "data:image/png;base64,..."}
const UKURAN_FOTO_MAKS = 2 * 1024 * 1024;

const ubahFotoProfil = async (req, res) => {
  try {
    const foto = typeof req.body.foto_profil === 'string' ? req.body.foto_profil : '';
    const cocok = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/.exec(foto);
    if (!cocok) return sendError(res, 'Foto profil harus berupa JPG atau PNG', 400);

    let buffer;
    try {
      buffer = Buffer.from(cocok[2], 'base64');
    } catch {
      return sendError(res, 'Foto profil tidak valid', 400);
    }
    if (buffer.length > UKURAN_FOTO_MAKS) return sendError(res, 'Ukuran foto profil maksimal 2 MB', 400);

    const png = buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const jpg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    if (!png && !jpg) return sendError(res, 'Isi foto profil harus berupa JPG atau PNG', 400);

    await User.ubahFotoProfil(req.user.id, foto);
    await catatAktivitas({ userId: req.user.id, action: 'ubah_foto_profil', description: 'Mengubah foto profil', ipAddress: req.ip });
    return sendSuccess(res, 'Foto profil berhasil diperbarui', dataProfil(await User.findById(req.user.id)));
  } catch (error) {
    return tanganiGalat(res, error, 'Ubah Foto Profil');
  }
};

const hapusFotoProfil = async (req, res) => {
  try {
    await User.ubahFotoProfil(req.user.id, null);
    await catatAktivitas({ userId: req.user.id, action: 'hapus_foto_profil', description: 'Menghapus foto profil', ipAddress: req.ip });
    return sendSuccess(res, 'Foto profil berhasil dihapus', dataProfil(await User.findById(req.user.id)));
  } catch (error) {
    return tanganiGalat(res, error, 'Hapus Foto Profil');
  }
};

module.exports = { lihatProfil, ubahKontak, ubahKataSandi, ubahFotoProfil, hapusFotoProfil };
