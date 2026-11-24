const db = require('../config/db');

// Menjalankan fn(conn) dalam satu transaksi database. Bila fn melempar galat, semua perubahan
// dibatalkan (rollback) lalu galatnya diteruskan ke pemanggil.
const denganTransaksi = async (fn) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const hasil = await fn(conn);
    await conn.commit();
    return hasil;
  } catch (error) {
    await conn.rollback().catch(() => {});
    throw error;
  } finally {
    conn.release();
  }
};

module.exports = { denganTransaksi };
