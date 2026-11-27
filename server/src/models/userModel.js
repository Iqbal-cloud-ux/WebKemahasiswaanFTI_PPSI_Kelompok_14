const db = require('../config/db');

const User = {
  // Cari user berdasarkan NIM/NIP atau Email
  findByIdentifierOrEmail: async (identifierOrEmail) => {
    const query = `
      SELECT * FROM users 
      WHERE identifier = ? OR email = ? 
      LIMIT 1
    `;
    const [rows] = await db.query(query, [identifierOrEmail, identifierOrEmail]);
    return rows[0];
  },

  // Cari user berdasarkan ID. SELECT * agar is_active (migrasi 002) ikut terbaca bila sudah ada,
  // tanpa membuat kueri gagal di database yang belum menjalankan migrasi itu.
  // Kolom password tidak boleh dikirim ke client; pemanggil hanya memakai kolom yang dibutuhkan.
  findById: async (id) => {
    const query = `SELECT * FROM users WHERE id = ?`;
    const [rows] = await db.query(query, [id]);
    return rows[0];
  },

  // true bila email sudah dipakai akun lain (selain akun id ini).
  emailDipakaiAkunLain: async (email, id) => {
    const [rows] = await db.query('SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1', [email, id]);
    return rows.length > 0;
  },

  ubahKontak: async (id, { email, noHp }) => {
    await db.query('UPDATE users SET email = ?, no_hp = ? WHERE id = ?', [email, noHp, id]);
  },

  ubahFotoProfil: async (id, fotoProfil) => {
    await db.query('UPDATE users SET foto_profil = ? WHERE id = ?', [fotoProfil, id]);
  },

  // passwordHash harus sudah di-hash bcrypt; jangan pernah menyimpan kata sandi teks biasa.
  ubahPassword: async (id, passwordHash) => {
    await db.query('UPDATE users SET password = ? WHERE id = ?', [passwordHash, id]);
  }
};

module.exports = User;