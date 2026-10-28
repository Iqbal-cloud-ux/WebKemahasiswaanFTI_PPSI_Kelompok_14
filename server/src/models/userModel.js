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

  // Cari user berdasarkan ID
  findById: async (id) => {
    const query = `SELECT id, identifier, nama, email, role, prodi, no_hp FROM users WHERE id = ?`;
    const [rows] = await db.query(query, [id]);
    return rows[0];
  }
};

module.exports = User;