const express = require('express');
const cors = require('cors');
const { sendError } = require('./utils/responseHandler');
require('dotenv').config();

// Rahasia JWT wajib ada di .env; tanpa itu token bisa dipalsukan.
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET belum diisi di server/.env. Server tidak dijalankan.');
}

// QR surat memuat tautan ke halaman verifikasi publik. Di server sungguhan alamatnya wajib diisi,
// karena alamat bawaan (localhost) tidak bisa dibuka dari HP. Format yang salah ditolak sejak awal.
if (process.env.NODE_ENV === 'production' && !process.env.ALAMAT_VERIFIKASI?.trim()) {
  throw new Error('ALAMAT_VERIFIKASI belum diisi di server/.env. Server tidak dijalankan.');
}
require('./services/pengesahanPdfService').alamatVerifikasi();

// Import & Uji Koneksi Database MySQL
require('./config/db');

const app = express();

// Middlewares
// CORS: client memanggil API lewat alamat yang sama (proxy Vite saat pengembangan, atau reverse proxy
// saat deploy), jadi permintaan lintas alamat tidak dibutuhkan dan ditolak peramban. Isi CORS_ORIGIN
// di .env (dipisah koma) hanya bila client memang dibuka dari alamat lain.
const asalDiizinkan = (process.env.CORS_ORIGIN || '').split(',').map((asal) => asal.trim()).filter(Boolean);
if (asalDiizinkan.length > 0) app.use(cors({ origin: asalDiizinkan }));
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true, limit: '4mb' }));
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
const akunRoutes = require('./routes/akunRoutes');
const logRoutes = require('./routes/logRoutes');

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
app.use('/api/akun', akunRoutes);
app.use('/api/log', logRoutes);

// Endpoint uji coba API
app.get('/', (req, res) => {
  res.json({ message: 'API Layanan Kemahasiswaan FTI UNAND Berhasil Berjalan!' });
});

// Alamat API yang tidak ada: balas JSON, bukan halaman HTML bawaan Express.
app.use('/api', (req, res) => sendError(res, 'Alamat API tidak ditemukan', 404));

// Galat yang lolos dari controller (misalnya isi permintaan terlalu besar atau JSON rusak).
// Selalu dibalas JSON dengan pesan yang aman; rincian teknis hanya dicetak di konsol server.
// Parameter next wajib ada: Express mengenali penangan galat dari empat parameternya.
app.use((error, req, res, next) => { // eslint-disable-line no-unused-vars
  if (error?.type === 'entity.too.large') {
    // Batas 4 MB untuk JSON; yang paling sering mengirim data besar adalah foto profil.
    return sendError(res, 'Data yang dikirim terlalu besar. Bila mengganti foto profil, pilih foto JPG atau PNG yang lebih kecil.', 413);
  }
  if (error?.type === 'entity.parse.failed') {
    return sendError(res, 'Format data yang dikirim tidak valid', 400);
  }
  console.error('Error Tidak Tertangani:', error);
  return sendError(res, 'Terjadi kesalahan pada server. Coba lagi beberapa saat lagi', 500);
});

module.exports = app;
