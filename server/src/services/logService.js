// Log Aktivitas khusus Dekan (keputusan tim 27 November 2026): log audit seluruh sistem,
// hanya bisa DIBACA (AGENTS.md aturan 5: log tidak bisa diubah atau dihapus lewat antarmuka).
// Alamat IP sengaja tidak dikirim ke client; tetap tersimpan di database untuk investigasi teknis.
const db = require('../config/db');
const { GalatAplikasi } = require('../utils/galat');

const PERAN_PEMBACA = ['dekan'];
const PERAN = ['mahasiswa', 'staf', 'kakor', 'wadek1', 'dekan'];
const PER_HALAMAN_BAWAAN = 25;
const PER_HALAMAN_MAKS = 100;
const POLA_TANGGAL = /^\d{4}-\d{2}-\d{2}$/;
const POLA_AKSI = /^[a-z_]{1,100}$/;

const pastikanPimpinan = (aktor) => {
  if (!PERAN_PEMBACA.includes(aktor?.role)) {
    throw new GalatAplikasi('Hanya Dekan yang dapat melihat log aktivitas', 403);
  }
};

const tanggalValid = (nilai, nama) => {
  if (nilai === undefined || nilai === null || nilai === '') return null;
  const teks = String(nilai);
  const tanggal = new Date(`${teks}T00:00:00Z`);
  if (!POLA_TANGGAL.test(teks) || Number.isNaN(tanggal.getTime()) || tanggal.toISOString().slice(0, 10) !== teks) {
    throw new GalatAplikasi(`${nama} harus memakai format YYYY-MM-DD`, 400);
  }
  return teks;
};

const bilanganBulat = (nilai, bawaan, maks) => {
  const angka = Number.parseInt(nilai, 10);
  if (!Number.isInteger(angka) || angka < 1) return bawaan;
  return Math.min(angka, maks);
};

// Memeriksa filter dari query string. Nilai kosong berarti tanpa filter.
const validasiFilter = (masukan = {}) => {
  const cari = typeof masukan.cari === 'string' ? masukan.cari.trim() : '';
  if (cari.length > 100) throw new GalatAplikasi('Kata pencarian maksimal 100 karakter', 400);
  const peran = masukan.peran || null;
  if (peran && !PERAN.includes(peran)) throw new GalatAplikasi('Peran tidak dikenal', 400);
  const aksi = masukan.aksi || null;
  if (aksi && !POLA_AKSI.test(aksi)) throw new GalatAplikasi('Jenis aktivitas tidak dikenal', 400);
  const mulai = tanggalValid(masukan.mulai, 'Tanggal mulai');
  const sampai = tanggalValid(masukan.sampai, 'Tanggal akhir');
  if (mulai && sampai && mulai > sampai) throw new GalatAplikasi('Tanggal mulai tidak boleh setelah tanggal akhir', 400);
  return {
    cari,
    peran,
    aksi,
    mulai,
    sampai,
    halaman: bilanganBulat(masukan.halaman, 1, 100000),
    perHalaman: bilanganBulat(masukan.per_halaman, PER_HALAMAN_BAWAAN, PER_HALAMAN_MAKS),
  };
};

// Tanda % dan _ di kata pencarian dicari apa adanya, bukan sebagai pola LIKE.
const polaLike = (teks) => `%${teks.replace(/[\\%_]/g, '\\$&')}%`;

const bangunKondisi = (filter) => {
  const kondisi = [];
  const parameter = [];
  if (filter.cari) {
    kondisi.push('(u.nama LIKE ? OR u.identifier LIKE ? OR l.description LIKE ?)');
    parameter.push(polaLike(filter.cari), polaLike(filter.cari), polaLike(filter.cari));
  }
  if (filter.peran) {
    kondisi.push('u.role = ?');
    parameter.push(filter.peran);
  }
  if (filter.aksi) {
    kondisi.push('l.action = ?');
    parameter.push(filter.aksi);
  }
  if (filter.mulai) {
    kondisi.push('l.created_at >= ?');
    parameter.push(filter.mulai);
  }
  if (filter.sampai) {
    kondisi.push('l.created_at < DATE_ADD(?, INTERVAL 1 DAY)');
    parameter.push(filter.sampai);
  }
  return { where: kondisi.length ? `WHERE ${kondisi.join(' AND ')}` : '', parameter };
};

const daftarLog = async (masukan, aktor) => {
  pastikanPimpinan(aktor);
  const filter = validasiFilter(masukan);
  const { where, parameter } = bangunKondisi(filter);
  const dari = `FROM log_aktivitas l LEFT JOIN users u ON u.id = l.user_id ${where}`;

  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total ${dari}`, parameter);
  const [rows] = await db.query(
    `SELECT l.id, l.action, l.description, l.created_at, u.nama, u.identifier, u.role
     ${dari}
     ORDER BY l.created_at DESC, l.id DESC
     LIMIT ? OFFSET ?`,
    [...parameter, filter.perHalaman, (filter.halaman - 1) * filter.perHalaman]
  );
  const [aksi] = await db.query('SELECT DISTINCT action FROM log_aktivitas ORDER BY action');

  return {
    log: rows.map((row) => ({
      id: row.id,
      aksi: row.action,
      keterangan: row.description,
      waktu: row.created_at,
      pengguna: row.nama ? { nama: row.nama, identifier: row.identifier, role: row.role } : null,
    })),
    total: Number(total),
    halaman: filter.halaman,
    per_halaman: filter.perHalaman,
    daftar_aksi: aksi.map((row) => row.action),
  };
};

module.exports = { PERAN_PEMBACA, validasiFilter, daftarLog };
