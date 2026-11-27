const { sendError } = require('../utils/responseHandler');

// Pembatas percobaan login sederhana tanpa library tambahan.
// Disimpan di memori: akan ter-reset bila server dimulai ulang. Cukup untuk satu server.
// Dua batas, keduanya hanya menghitung login yang GAGAL (login berhasil tidak dihitung, agar banyak
// mahasiswa di balik satu IP jaringan kampus tetap bisa masuk):
//   - per akun + IP: 5 kali gagal per 15 menit (menebak kata sandi satu akun),
//   - per IP: 30 kali gagal per 15 menit (mencoba banyak NIM dari satu perangkat).
// Catatan deployment: di balik reverse proxy, atur app.set('trust proxy', ...) agar req.ip benar.
const BATAS_GAGAL = 5;
const BATAS_GAGAL_PER_IP = 30;
const JENDELA_MS = 15 * 60 * 1000;

const gagalPerAkun = new Map(); // kunci: "identifier|ip" -> { jumlah, mulai }
const gagalPerIp = new Map(); // kunci: ip -> { jumlah, mulai }

const kunciAkun = (req) => `${String(req.body?.identifier || '').trim().toLowerCase()}|${req.ip}`;

const ambilCatatan = (peta, kunci) => {
  const catatan = peta.get(kunci);
  if (catatan && Date.now() - catatan.mulai > JENDELA_MS) {
    peta.delete(kunci);
    return null;
  }
  return catatan;
};

const tambahGagal = (peta, kunci) => {
  const catatan = ambilCatatan(peta, kunci);
  if (catatan) {
    catatan.jumlah += 1;
  } else {
    peta.set(kunci, { jumlah: 1, mulai: Date.now() });
  }
};

const sisaMenit = (catatan) => Math.ceil((JENDELA_MS - (Date.now() - catatan.mulai)) / 60000);

// Middleware: tolak dengan 429 bila sudah terlalu banyak gagal.
const batasiLogin = (req, res, next) => {
  const perIp = ambilCatatan(gagalPerIp, req.ip);
  if (perIp && perIp.jumlah >= BATAS_GAGAL_PER_IP) {
    return sendError(res, `Terlalu banyak percobaan login yang gagal dari perangkat ini. Coba lagi dalam ${sisaMenit(perIp)} menit.`, 429);
  }
  const perAkun = ambilCatatan(gagalPerAkun, kunciAkun(req));
  if (perAkun && perAkun.jumlah >= BATAS_GAGAL) {
    return sendError(res, `Terlalu banyak percobaan login yang gagal. Coba lagi dalam ${sisaMenit(perAkun)} menit.`, 429);
  }
  return next();
};

const catatLoginGagal = (req) => {
  tambahGagal(gagalPerAkun, kunciAkun(req));
  tambahGagal(gagalPerIp, req.ip);
};

// Login berhasil hanya menghapus catatan akun itu; catatan per IP tetap berjalan sampai jendelanya habis.
const resetLoginGagal = (req) => {
  gagalPerAkun.delete(kunciAkun(req));
};

// Bersihkan catatan yang sudah kedaluwarsa agar memori tidak terus bertambah.
setInterval(() => {
  for (const kunci of gagalPerAkun.keys()) ambilCatatan(gagalPerAkun, kunci);
  for (const kunci of gagalPerIp.keys()) ambilCatatan(gagalPerIp, kunci);
}, JENDELA_MS).unref();

module.exports = { batasiLogin, catatLoginGagal, resetLoginGagal };
