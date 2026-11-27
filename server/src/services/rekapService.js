const db = require('../config/db');
const { LogAktivitas } = require('../models/logModel');
const { GalatAplikasi } = require('../utils/galat');

const STATUS_FILTER = new Set(['Selesai', 'Diproses', 'Ditolak']);
const POLA_TANGGAL = /^\d{4}-\d{2}-\d{2}$/;

const pastikanStaf = (aktor) => {
  if (aktor?.role !== 'staf') throw new GalatAplikasi('Hanya Staf Akademik yang dapat melihat rekapitulasi', 403);
};

const tanggalValid = (tanggal, nama) => {
  if (tanggal === undefined || tanggal === null || tanggal === '') return null;
  if (typeof tanggal !== 'string' || !POLA_TANGGAL.test(tanggal) || Number(tanggal.slice(0, 4)) < 1000) {
    throw new GalatAplikasi(`${nama} harus menggunakan format YYYY-MM-DD`, 400);
  }
  const parsed = new Date(`${tanggal}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== tanggal) {
    throw new GalatAplikasi(`${nama} bukan tanggal yang valid`, 400);
  }
  return tanggal;
};

const validasiFilter = ({ mulai, sampai, jenisLayananId, status } = {}) => {
  const tanggalMulai = tanggalValid(mulai, 'Tanggal mulai');
  const tanggalSampai = tanggalValid(sampai, 'Tanggal akhir');
  if (tanggalMulai && tanggalSampai && tanggalMulai > tanggalSampai) {
    throw new GalatAplikasi('Tanggal mulai tidak boleh setelah tanggal akhir', 400);
  }

  let idLayanan = null;
  if (jenisLayananId !== undefined && jenisLayananId !== null && jenisLayananId !== '') {
    idLayanan = Number(jenisLayananId);
    if (!Number.isInteger(idLayanan) || idLayanan <= 0) {
      throw new GalatAplikasi('Jenis layanan tidak valid', 400);
    }
  }

  let statusFilter = null;
  if (status !== undefined && status !== null && status !== '') {
    if (typeof status !== 'string' || !STATUS_FILTER.has(status)) {
      throw new GalatAplikasi('Status laporan tidak valid', 400);
    }
    statusFilter = status;
  }

  return { mulai: tanggalMulai, sampai: tanggalSampai, jenisLayananId: idLayanan, status: statusFilter };
};

const kondisiStatus = (status, alias = 'p') => {
  if (status === 'Selesai') return `${alias}.status = 'disetujui'`;
  if (status === 'Diproses') return `${alias}.status NOT IN ('disetujui', 'ditolak')`;
  if (status === 'Ditolak') return `${alias}.status = 'ditolak'`;
  return null;
};

const bangunFilterSql = (filter, alias = 'p') => {
  const kondisi = [];
  const parameter = [];
  if (filter.mulai) {
    kondisi.push(`${alias}.created_at >= ?`);
    parameter.push(filter.mulai);
  }
  if (filter.sampai) {
    kondisi.push(`${alias}.created_at < DATE_ADD(?, INTERVAL 1 DAY)`);
    parameter.push(filter.sampai);
  }
  if (filter.jenisLayananId) {
    kondisi.push(`${alias}.jenis_layanan_id = ?`);
    parameter.push(filter.jenisLayananId);
  }
  const status = kondisiStatus(filter.status, alias);
  if (status) kondisi.push(status);
  return { sql: kondisi.length ? kondisi.join(' AND ') : '1 = 1', parameter };
};

const angka = (nilai) => Number(nilai || 0);

const ambilRekap = async (input, aktor) => {
  pastikanStaf(aktor);
  const filter = validasiFilter(input);
  const where = bangunFilterSql(filter);
  const joinLayanan = bangunFilterSql(filter, 'p');

  const [ringkasanRows, layananRows, trenRows] = await Promise.all([
    db.query(
      `SELECT COUNT(*) AS total,
         COALESCE(SUM(p.status = 'disetujui'), 0) AS selesai,
         COALESCE(SUM(p.status NOT IN ('disetujui', 'ditolak')), 0) AS diproses,
         COALESCE(SUM(p.status = 'ditolak'), 0) AS ditolak,
         AVG(CASE WHEN p.status = 'disetujui'
           THEN GREATEST(DATEDIFF(s.tgl_terbit, DATE(p.created_at)), 0) END) AS rata_rata_hari
       FROM pengajuan p
       LEFT JOIN surat_resmi s ON s.pengajuan_id = p.id
       WHERE ${where.sql}`,
      where.parameter
    ),
    db.query(
      `SELECT j.id, j.nama_layanan,
         COUNT(p.id) AS total,
         COALESCE(SUM(p.status = 'disetujui'), 0) AS selesai,
         COALESCE(SUM(p.status NOT IN ('disetujui', 'ditolak')), 0) AS diproses,
         COALESCE(SUM(p.status = 'ditolak'), 0) AS ditolak
       FROM jenis_layanan j
       LEFT JOIN pengajuan p ON p.jenis_layanan_id = j.id AND ${joinLayanan.sql}
       GROUP BY j.id, j.nama_layanan
       ORDER BY j.nama_layanan, j.id`,
      joinLayanan.parameter
    ),
    db.query(
      `SELECT DATE_FORMAT(p.created_at, '%Y-%m') AS periode,
         COUNT(*) AS masuk,
         COALESCE(SUM(p.status = 'disetujui'), 0) AS selesai
       FROM pengajuan p
       WHERE ${where.sql}
       GROUP BY YEAR(p.created_at), MONTH(p.created_at)
       ORDER BY YEAR(p.created_at), MONTH(p.created_at)`,
      where.parameter
    ),
  ]);

  const ringkasan = ringkasanRows[0][0] || {};
  return {
    ringkasan: {
      total: angka(ringkasan.total),
      selesai: angka(ringkasan.selesai),
      diproses: angka(ringkasan.diproses),
      ditolak: angka(ringkasan.ditolak),
      rata_rata_hari: ringkasan.rata_rata_hari === null ? null : Number(ringkasan.rata_rata_hari),
    },
    per_jenis_layanan: layananRows[0].map((row) => ({
      id: row.id,
      nama_layanan: row.nama_layanan,
      total: angka(row.total),
      selesai: angka(row.selesai),
      diproses: angka(row.diproses),
      ditolak: angka(row.ditolak),
    })),
    tren: trenRows[0].map((row) => ({
      periode: row.periode,
      masuk: angka(row.masuk),
      selesai: angka(row.selesai),
    })),
    filter,
  };
};

// Teks yang diawali = + - @ (atau tab/baris baru) dibaca Excel sebagai rumus (CSV injection), misalnya
// nama layanan yang diisi staf. Teks seperti itu diberi awalan petik satu agar tampil apa adanya.
// Angka tidak diubah.
const POLA_RUMUS = /^[=+\-@\t\r]/;
const csvEscape = (value) => {
  const teks = String(value ?? '');
  const aman = typeof value === 'string' && POLA_RUMUS.test(teks) ? `'${teks}` : teks;
  return `"${aman.replace(/"/g, '""')}"`;
};

const eksporCsv = async (input, aktor, ipAddress) => {
  const data = await ambilRekap(input, aktor);
  const namaLayanan = data.per_jenis_layanan.find((item) => item.id === data.filter.jenisLayananId)?.nama_layanan
    || 'Semua layanan';
  const rataRata = data.ringkasan.rata_rata_hari === null
    ? 'Belum ada surat selesai'
    : data.ringkasan.rata_rata_hari.toFixed(1);
  const rows = [
    ['Rekapitulasi dan Laporan'],
    ['Rentang tanggal', `${data.filter.mulai || 'Semua tanggal'} – ${data.filter.sampai || 'Semua tanggal'}`],
    ['Jenis layanan', namaLayanan],
    ['Status', data.filter.status || 'Semua status'],
    [],
    ['Ringkasan', 'Jumlah'],
    ['Total pengajuan', data.ringkasan.total],
    ['Surat selesai', data.ringkasan.selesai],
    ['Masih diproses', data.ringkasan.diproses],
    ['Ditolak', data.ringkasan.ditolak],
    ['Rata-rata penyelesaian (hari)', rataRata],
    [],
    ['Jenis layanan', 'Masuk', 'Selesai', 'Diproses', 'Ditolak'],
    ...data.per_jenis_layanan.map((item) => [
      item.nama_layanan, item.total, item.selesai, item.diproses, item.ditolak,
    ]),
    [],
    ['Periode', 'Pengajuan masuk', 'Surat selesai'],
    ...data.tren.map((item) => [item.periode, item.masuk, item.selesai]),
  ];
  const csv = `\uFEFF${rows.map((row) => row.map(csvEscape).join(',')).join('\r\n')}`;
  const periode = `${data.filter.mulai || 'semua'}_${data.filter.sampai || 'semua'}`;

  await LogAktivitas.create({
    userId: aktor.id,
    action: 'ekspor_rekap',
    description: `Mengekspor laporan rekapitulasi CSV untuk ${periode}`,
    ipAddress,
  });
  return { buffer: Buffer.from(csv, 'utf8'), namaFile: `rekapitulasi_${periode}.csv` };
};

module.exports = { ambilRekap, eksporCsv, validasiFilter };
