const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Rahasia JWT wajib ada di .env; tanpa itu token bisa dipalsukan.
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET belum diisi di server/.env. Server tidak dijalankan.');
}

// Import & Uji Koneksi Database MySQL
require('./config/db');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Folder uploads sengaja TIDAK disajikan sebagai file statis: berkas persyaratan
// memuat data sensitif dan harus diunduh lewat endpoint yang memeriksa hak akses.

// Import Routes
const authRoutes = require('./routes/authRoutes');

// Daftarkan Routes API
app.use('/api/auth', authRoutes);

// Endpoint uji coba API
app.get('/', (req, res) => {
  res.json({ message: 'API Layanan Kemahasiswaan FTI UNAND Berhasil Berjalan!' });
});

module.exports = app;
