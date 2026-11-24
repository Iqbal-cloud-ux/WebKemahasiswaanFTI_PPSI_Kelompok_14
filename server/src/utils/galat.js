const { sendError } = require('./responseHandler');

// Galat yang pesannya aman ditampilkan ke pengguna (validasi, hak akses, data tidak ditemukan).
// Lempar dari service; controller meneruskannya lewat tanganiGalat.
class GalatAplikasi extends Error {
  constructor(pesan, status = 400, rincian = null) {
    super(pesan);
    this.name = 'GalatAplikasi';
    this.status = status;
    this.rincian = rincian;
  }
}

// Galat lain (bug, database mati) dicatat di konsol server dan dibalas pesan umum,
// agar detail teknis tidak bocor ke pengguna.
const tanganiGalat = (res, error, konteks) => {
  if (error instanceof GalatAplikasi) {
    return sendError(res, error.message, error.status, error.rincian);
  }
  console.error(`Error ${konteks}:`, error);
  return sendError(res, 'Terjadi kesalahan pada server. Coba lagi beberapa saat lagi', 500);
};

module.exports = { GalatAplikasi, tanganiGalat };
