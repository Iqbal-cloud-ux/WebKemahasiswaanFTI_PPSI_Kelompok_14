const db = require('../config/db');

// Catatan aktivitas hanya boleh DITAMBAH. Jangan membuat fungsi ubah atau hapus di sini.
const LogAktivitas = {
  // Jangan pernah memasukkan kata sandi, token, atau kunci rahasia ke description.
  // executor: koneksi transaksi bila log harus ikut dibatalkan saat transaksi gagal; default pool biasa.
  create: async ({ userId = null, action, description, ipAddress = null }, executor = db) => {
    const query = `
      INSERT INTO log_aktivitas (user_id, action, description, ip_address)
      VALUES (?, ?, ?, ?)
    `;
    await executor.query(query, [userId, action, description, ipAddress]);
  }
};

// Mencatat tanpa menggagalkan proses utama: bila penulisan log gagal,
// login/logout tetap berjalan dan kesalahannya dicetak di konsol server.
const catatAktivitas = async (data) => {
  try {
    await LogAktivitas.create(data);
  } catch (error) {
    console.error('Gagal menulis log_aktivitas:', error.message);
  }
};

module.exports = { LogAktivitas, catatAktivitas };
