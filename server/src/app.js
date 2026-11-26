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
// Express 5 membiarkan req.body undefined bila request tidak punya body; jadikan objek kosong
// agar controller yang membaca req.body.xxx tidak galat (multer mengisi ulang untuk multipart).
app.use((req, res, next) => {
  if (req.body === undefined) req.body = {};
  next();
});

// Folder uploads sengaja TIDAK disajikan sebagai file statis: berkas persyaratan
// memuat data sensitif dan harus diunduh lewat endpoint yang memeriksa hak akses.

// Import Routes
const authRoutes = require('./routes/authRoutes');
const layananRoutes = require('./routes/layananRoutes');
const pengajuanRoutes = require('./routes/pengajuanRoutes');
const profilRoutes = require('./routes/profilRoutes');
const berkasRoutes = require('./routes/berkasRoutes');
const notifikasiRoutes = require('./routes/notifikasiRoutes');
const drafRoutes = require('./routes/drafRoutes');
const parafRoutes = require('./routes/parafRoutes');
const dekanRoutes = require('./routes/dekanRoutes');
const suratRoutes = require('./routes/suratRoutes');
const verifikasiRoutes = require('./routes/verifikasiRoutes');
const rekapRoutes = require('./routes/rekapRoutes');

// Daftarkan Routes API
app.use('/api/auth', authRoutes);
app.use('/api/layanan', layananRoutes);
app.use('/api/pengajuan', pengajuanRoutes);
app.use('/api/profil', profilRoutes);
app.use('/api/berkas', berkasRoutes);
app.use('/api/notifikasi', notifikasiRoutes);
app.use('/api/draf', drafRoutes);
app.use('/api/paraf', parafRoutes);
app.use('/api/dekan', dekanRoutes);
app.use('/api/surat', suratRoutes);
app.use('/api/verifikasi', verifikasiRoutes);
app.use('/api/rekap', rekapRoutes);

// Endpoint uji coba API
app.get('/', (req, res) => {
  res.json({ message: 'API Layanan Kemahasiswaan FTI UNAND Berhasil Berjalan!' });
});

module.exports = app;
