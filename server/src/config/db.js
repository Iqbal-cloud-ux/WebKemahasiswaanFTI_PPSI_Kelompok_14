const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'fti_kemahasiswaan_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Uji koneksi awal
pool.getConnection()
  .then((connection) => {
    console.log('Database MySQL FTI Kemahasiswaan Berhasil Terhubung!');
    connection.release();
  })
  .catch((err) => {
    console.error('Gagal terhubung ke Database MySQL:', err.message);
  });

module.exports = pool;