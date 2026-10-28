const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import & Uji Koneksi Database MySQL
require('./config/db');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve folder uploads sebagai static folder (agar file PDF/Gambar bisa diakses)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Import Routes
const authRoutes = require('./routes/authRoutes');

// Daftarkan Routes API
app.use('/api/auth', authRoutes);

// Endpoint uji coba API
app.get('/', (req, res) => {
  res.json({ message: 'API Layanan Kemahasiswaan FTI UNAND Berhasil Berjalan!' });
});

module.exports = app;