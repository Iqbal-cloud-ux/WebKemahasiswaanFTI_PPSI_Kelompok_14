const db = require('../config/db');

// Notifikasi dibuat oleh statusService saat status pengajuan berubah. Model ini hanya membaca
// dan menandai sudah dibaca; selalu dibatasi pada user_id penerima.
const BATAS = 100;

const Notifikasi = {
  daftarMilik: async (userId) => {
    const [rows] = await db.query(
      `SELECT n.id, n.pengajuan_id, p.no_referensi, n.judul, n.pesan, n.is_read, n.created_at
       FROM notifikasi n LEFT JOIN pengajuan p ON p.id = n.pengajuan_id
       WHERE n.user_id = ? ORDER BY n.created_at DESC, n.id DESC LIMIT ?`,
      [userId, BATAS]
    );
    return rows.map((row) => ({ ...row, is_read: Boolean(row.is_read) }));
  },

  jumlahBelumDibaca: async (userId) => {
    const [[{ jumlah }]] = await db.query('SELECT COUNT(*) AS jumlah FROM notifikasi WHERE user_id = ? AND is_read = 0', [userId]);
    return jumlah;
  },

  // Mengembalikan jumlah baris yang berubah; 0 berarti notifikasi bukan milik user ini atau sudah dibaca.
  tandaiDibaca: async (userId, id) => {
    const [hasil] = await db.query('UPDATE notifikasi SET is_read = 1 WHERE id = ? AND user_id = ?', [id, userId]);
    return hasil.affectedRows;
  },

  tandaiSemuaDibaca: async (userId) => {
    await db.query('UPDATE notifikasi SET is_read = 1 WHERE user_id = ? AND is_read = 0', [userId]);
  },

  milikUser: async (userId, id) => {
    const [rows] = await db.query('SELECT id FROM notifikasi WHERE id = ? AND user_id = ?', [id, userId]);
    return rows.length > 0;
  },
};

module.exports = Notifikasi;
