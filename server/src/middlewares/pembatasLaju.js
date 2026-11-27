const { sendError } = require('../utils/responseHandler');

// Pembatas jumlah permintaan per alamat IP untuk endpoint publik (tanpa login), tanpa library tambahan.
// Disimpan di memori seperti loginLimiter.js: ter-reset bila server dimulai ulang. Cukup untuk satu server.
// Catatan deployment: bila server berada di balik reverse proxy, atur app.set('trust proxy', ...)
// agar req.ip berisi IP pengunjung, bukan IP proxy.
const buatPembatasLaju = ({ batas, jendelaMs, pesan }) => {
  const catatan = new Map(); // kunci: IP -> { jumlah, mulai }

  // Bersihkan catatan yang sudah kedaluwarsa agar memori tidak terus bertambah.
  setInterval(() => {
    const sekarang = Date.now();
    for (const [kunci, data] of catatan) {
      if (sekarang - data.mulai > jendelaMs) catatan.delete(kunci);
    }
  }, jendelaMs).unref();

  return (req, res, next) => {
    const sekarang = Date.now();
    let data = catatan.get(req.ip);
    if (!data || sekarang - data.mulai > jendelaMs) {
      data = { jumlah: 0, mulai: sekarang };
      catatan.set(req.ip, data);
    }
    data.jumlah += 1;

    if (data.jumlah > batas) {
      const sisaMs = jendelaMs - (sekarang - data.mulai);
      res.set('Retry-After', String(Math.ceil(sisaMs / 1000)));
      return sendError(res, `${pesan} Coba lagi dalam ${Math.ceil(sisaMs / 60000)} menit.`, 429);
    }
    return next();
  };
};

module.exports = { buatPembatasLaju };
