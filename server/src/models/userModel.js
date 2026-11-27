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

  // Data ringan untuk pemeriksaan token di setiap permintaan (tanpa foto profil): peran, status aktif,
  // data status studi (utils/statusStudi.js), serta versi token dan penanda wajib ganti sandi (migrasi 008).
  // Bila migrasi 002, 003, 007, atau 008 belum dijalankan, kolomnya belum ada; kueri dicoba ulang dengan
  // kolom yang lebih sedikit, akun dianggap aktif, dan versi token dianggap 0.
  statusAkses: async (id) => {
    const daftarKolom = [
      'role, is_active, angkatan, tgl_lulus, tambahan_semester, versi_token, wajib_ganti_sandi',
      'role, is_active, angkatan, tgl_lulus, tambahan_semester',
      'role, is_active',
      'role',
    ];
    for (const [urutan, kolom] of daftarKolom.entries()) {
      try {
        const [rows] = await db.query(`SELECT ${kolom} FROM users WHERE id = ?`, [id]);
        return rows[0] && { is_active: 1, ...rows[0] };
      } catch (error) {
        if (error.code !== 'ER_BAD_FIELD_ERROR' || urutan === daftarKolom.length - 1) throw error;
      }
    }
    return undefined;
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
  // Mengganti kata sandi sendiri juga menghapus penanda wajib ganti sandi dan mencabut semua token lama
  // (migrasi 008). Pemanggil membuat token baru dari data akun terbaru.
  ubahPassword: async (id, passwordHash) => {
    try {
      await db.query(
        'UPDATE users SET password = ?, wajib_ganti_sandi = 0, versi_token = versi_token + 1 WHERE id = ?',
        [passwordHash, id]
      );
    } catch (error) {
      if (error.code !== 'ER_BAD_FIELD_ERROR') throw error;
      await db.query('UPDATE users SET password = ? WHERE id = ?', [passwordHash, id]);
    }
  },

  // Mencabut semua token akun ini (logout). Tanpa migrasi 008 tidak ada yang bisa dicabut.
  naikkanVersiToken: async (id) => {
    try {
      await db.query('UPDATE users SET versi_token = versi_token + 1 WHERE id = ?', [id]);
    } catch (error) {
      if (error.code !== 'ER_BAD_FIELD_ERROR') throw error;
    }
  },
};

module.exports = User;