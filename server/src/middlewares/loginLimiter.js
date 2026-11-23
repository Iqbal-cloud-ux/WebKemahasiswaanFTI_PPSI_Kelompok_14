const { sendError } = require('../utils/responseHandler');

// Pembatas percobaan login sederhana tanpa library tambahan.
// Disimpan di memori: akan ter-reset bila server dimulai ulang. Cukup untuk satu server.
const BATAS_GAGAL = 5;
const JENDELA_MS = 15 * 60 * 1000;

const percobaanGagal = new Map(); // kunci: "identifier|ip" -> { jumlah, mulai }

const buatKunci = (req) => `${String(req.body?.identifier || '').trim().toLowerCase()}|${req.ip}`;

const ambilCatatan = (kunci) => {
  const catatan = percobaanGagal.get(kunci);
  if (catatan && Date.now() - catatan.mulai > JENDELA_MS) {
    percobaanGagal.delete(kunci);
    return null;
  }
  return catatan;
};

// Middleware: tolak dengan 429 bila sudah terlalu banyak gagal.
const batasiLogin = (req, res, next) => {
  const catatan = ambilCatatan(buatKunci(req));
  if (catatan && catatan.jumlah >= BATAS_GAGAL) {
    const sisaMenit = Math.ceil((JENDELA_MS - (Date.now() - catatan.mulai)) / 60000);
    return sendError(res, `Terlalu banyak percobaan login yang gagal. Coba lagi dalam ${sisaMenit} menit.`, 429);
  }
  next();
};

const catatLoginGagal = (req) => {
  const kunci = buatKunci(req);
  const catatan = ambilCatatan(kunci);
  if (catatan) {
    catatan.jumlah += 1;
  } else {
    percobaanGagal.set(kunci, { jumlah: 1, mulai: Date.now() });
  }
};

const resetLoginGagal = (req) => {
  percobaanGagal.delete(buatKunci(req));
};

// Bersihkan catatan yang sudah kedaluwarsa agar memori tidak terus bertambah.
setInterval(() => {
  for (const kunci of percobaanGagal.keys()) ambilCatatan(kunci);
}, JENDELA_MS).unref();

module.exports = { batasiLogin, catatLoginGagal, resetLoginGagal };
