// Manajemen Data dan Akun (#131): Staf Akademik melihat daftar akun beserta status studinya,
// memperbaiki data identitas mahasiswa, menandai lulus, memberi perpanjangan masa studi (cuti),
// dan mengaktifkan kembali akun mahasiswa yang dinonaktifkan manual.
// Status akun mahasiswa dihitung otomatis (utils/statusStudi.js, migrasi 007).
// Di luar cakupan: menghapus akun, mengubah kata sandi orang lain, dan menetapkan peran.
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { LogAktivitas } = require('../models/logModel');
const { GalatAplikasi } = require('../utils/galat');
const { denganTransaksi } = require('../utils/transaksi');
const { bacaNim, masalahNimFti } = require('../utils/nim');
const { MAKS_SEMESTER, keTanggal, teksTanggal, statusStudi } = require('../utils/statusStudi');

// Pola email dan nomor telepon sama dengan halaman Profil (controllers/profilController.js).
const POLA_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const POLA_NO_HP = /^\+?[0-9][0-9 -]{7,18}$/;
const POLA_TANGGAL = /^\d{4}-\d{2}-\d{2}$/;
const JENJANG = ['D3', 'D4', 'S1', 'S2', 'S3'];

// Kolom yang boleh diperbaiki staf, beserta labelnya untuk pesan dan log aktivitas.
// angkatan (dan jenjang bila kodenya dikenal) diambil otomatis dari NIM (utils/nim.js).
const KOLOM = {
  identifier: 'NIM',
  nama: 'nama',
  email: 'email',
  no_hp: 'nomor telepon',
  prodi: 'program studi',
  jenjang: 'jenjang',
  angkatan: 'angkatan',
  tgl_lulus: 'tanggal lulus',
  tambahan_semester: 'perpanjangan semester',
};

const KOLOM_AKUN = `id, identifier, nama, email, role, prodi, jenjang, angkatan, no_hp, is_active,
  DATE_FORMAT(tgl_lulus, '%Y-%m-%d') AS tgl_lulus, tambahan_semester, created_at, updated_at`;

const pastikanStaf = (aktor) => {
  if (aktor?.role !== 'staf') throw new GalatAplikasi('Hanya Staf Akademik yang dapat mengelola akun', 403);
};

// Kolom dari migrasi belum ada: beri pesan yang menyebut migrasinya, bukan galat server umum.
const periksaMigrasi = (berkas = '007_status_studi_mahasiswa.sql') => (error) => {
  if (error.code === 'ER_BAD_FIELD_ERROR') {
    throw new GalatAplikasi(`Database belum diperbarui. Jalankan migrasi ${berkas} lebih dulu.`, 500);
  }
  throw error;
};

// Kata sandi sementara: 12 karakter acak tanpa huruf/angka yang mirip (0/O, 1/l/I).
const HURUF_SANDI = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
const buatSandiSementara = () => Array.from({ length: 12 }, () => HURUF_SANDI[crypto.randomInt(HURUF_SANDI.length)]).join('');

// Data akun yang dikirim ke client: tanpa kata sandi dan tanpa foto profil.
const bentukAkun = (row, sekarang = new Date()) => {
  const status = statusStudi(row, sekarang);
  return {
    id: row.id,
    identifier: row.identifier,
    nama: row.nama,
    email: row.email,
    role: row.role,
    prodi: row.prodi ?? null,
    jenjang: row.jenjang ?? null,
    angkatan: row.angkatan ?? null,
    no_hp: row.no_hp ?? null,
    is_active: Number(row.is_active ?? 1) === 1,
    tgl_lulus: row.tgl_lulus ?? null,
    tambahan_semester: Number(row.tambahan_semester || 0),
    status_studi: {
      kode: status.kode,
      label: status.label,
      semester: status.semester ?? null,
      batas_semester: status.batasSemester ?? null,
      tutup_pada: status.tutupPada ?? null,
    },
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

// Teks satu baris: spasi berlebih dan karakter kendali (baris baru, tab) dibuang.
const teks = (nilai) => (typeof nilai === 'string' || typeof nilai === 'number'
  ? String(nilai).replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim()
  : '');

// Memeriksa data kiriman staf. Melempar GalatAplikasi 400 berisi masalah pertama yang ditemukan.
const validasiData = (masukan = {}, sekarang = new Date()) => {
  const identifier = teks(masukan.identifier);
  const nama = teks(masukan.nama);
  const email = teks(masukan.email).toLowerCase();
  const noHp = teks(masukan.no_hp);
  const prodi = teks(masukan.prodi);
  const jenjangIsian = teks(masukan.jenjang).toUpperCase();
  const tglLulus = teks(masukan.tgl_lulus);
  const tambahanTeks = teks(masukan.tambahan_semester);

  const masalahNim = masalahNimFti(identifier, sekarang);
  if (masalahNim) throw new GalatAplikasi(masalahNim, 400);
  const dariNim = bacaNim(identifier);

  if (!nama || nama.length > 100) throw new GalatAplikasi('Nama wajib diisi dan maksimal 100 karakter', 400);
  if (!POLA_EMAIL.test(email) || email.length > 100) throw new GalatAplikasi('Email tidak valid. Contoh: nama@contoh.com', 400);
  if (noHp && !POLA_NO_HP.test(noHp)) {
    throw new GalatAplikasi('Nomor telepon tidak valid. Gunakan angka, contoh: 081234567890', 400);
  }
  if (prodi.length > 100) throw new GalatAplikasi('Program studi maksimal 100 karakter', 400);
  if (!dariNim.jenjang && jenjangIsian && !JENJANG.includes(jenjangIsian)) {
    throw new GalatAplikasi(`Jenjang harus salah satu dari: ${JENJANG.join(', ')}`, 400);
  }

  if (tglLulus) {
    const tanggal = keTanggal(tglLulus);
    if (!POLA_TANGGAL.test(tglLulus) || !tanggal || teksTanggal(tanggal) !== tglLulus) {
      throw new GalatAplikasi('Tanggal lulus tidak valid', 400);
    }
    if (tanggal > sekarang) throw new GalatAplikasi('Tanggal lulus tidak boleh setelah hari ini', 400);
    if (tanggal.getFullYear() < dariNim.angkatan) throw new GalatAplikasi('Tanggal lulus tidak boleh sebelum tahun masuk', 400);
  }

  let tambahanSemester = 0;
  if (tambahanTeks) {
    tambahanSemester = Number(tambahanTeks);
    if (!/^\d{1,2}$/.test(tambahanTeks) || tambahanSemester > MAKS_SEMESTER) {
      throw new GalatAplikasi(`Perpanjangan semester harus angka 0 sampai ${MAKS_SEMESTER}`, 400);
    }
  }

  return {
    identifier,
    nama,
    email,
    no_hp: noHp || null,
    prodi: prodi || null,
    jenjang: dariNim.jenjang || jenjangIsian || null,
    angkatan: dariNim.angkatan,
    tgl_lulus: tglLulus || null,
    tambahan_semester: tambahanSemester,
  };
};

const ambilMahasiswaTerkunci = async (conn, id) => {
  const [[akun]] = await conn.query(`SELECT ${KOLOM_AKUN} FROM users WHERE id = ? FOR UPDATE`, [id]).catch(periksaMigrasi());
  if (!akun) throw new GalatAplikasi('Akun tidak ditemukan', 404);
  if (akun.role !== 'mahasiswa') {
    throw new GalatAplikasi('Hanya akun mahasiswa yang dapat diubah atau diaktifkan dari halaman ini', 403);
  }
  return akun;
};

// GET: semua akun (semua peran), mahasiswa lebih dulu lalu urut nama. Pencarian dan filter di client.
const daftarAkun = async (aktor) => {
  pastikanStaf(aktor);
  const [rows] = await db.query(
    `SELECT ${KOLOM_AKUN} FROM users ORDER BY role = 'mahasiswa' DESC, nama, id`
  ).catch(periksaMigrasi());
  const sekarang = new Date();
  return rows.map((row) => bentukAkun(row, sekarang));
};

const ubahDataMahasiswa = async ({ id, data, aktor, ipAddress }) => {
  pastikanStaf(aktor);
  const baru = validasiData(data);

  return denganTransaksi(async (conn) => {
    const lama = await ambilMahasiswaTerkunci(conn, id);

    const [kembar] = await conn.query(
      'SELECT identifier, email FROM users WHERE (identifier = ? OR email = ?) AND id <> ?',
      [baru.identifier, baru.email, id]
    );
    if (kembar.some((akun) => akun.identifier === baru.identifier)) {
      throw new GalatAplikasi('NIM ini sudah dipakai akun lain', 409);
    }
    if (kembar.some((akun) => String(akun.email).toLowerCase() === baru.email)) {
      throw new GalatAplikasi('Email ini sudah dipakai akun lain', 409);
    }

    const berubah = Object.keys(KOLOM).filter((kolom) => String(lama[kolom] ?? '') !== String(baru[kolom] ?? ''));
    if (berubah.length === 0) return { akun: bentukAkun(lama), berubah: [] };

    try {
      await conn.query(
        `UPDATE users SET identifier = ?, nama = ?, email = ?, no_hp = ?, prodi = ?, jenjang = ?, angkatan = ?,
           tgl_lulus = ?, tambahan_semester = ?
         WHERE id = ?`,
        [baru.identifier, baru.nama, baru.email, baru.no_hp, baru.prodi, baru.jenjang, baru.angkatan,
          baru.tgl_lulus, baru.tambahan_semester, id]
      );
    } catch (error) {
      // Cadangan bila dua staf menyimpan NIM/email yang sama pada saat bersamaan.
      if (error.code === 'ER_DUP_ENTRY') throw new GalatAplikasi('NIM atau email ini sudah dipakai akun lain', 409);
      throw error;
    }

    const nimLama = berubah.includes('identifier') ? ` (NIM lama ${lama.identifier})` : '';
    await LogAktivitas.create({
      userId: aktor.id,
      action: 'ubah_data_akun',
      description: `Mengubah data akun mahasiswa ${baru.identifier}${nimLama}: ${berubah.map((kolom) => KOLOM[kolom]).join(', ')}`,
      ipAddress,
    }, conn);

    const [[akun]] = await conn.query(`SELECT ${KOLOM_AKUN} FROM users WHERE id = ?`, [id]);
    return { akun: bentukAkun(akun), berubah: berubah.map((kolom) => KOLOM[kolom]) };
  });
};

// Membatalkan penonaktifan manual (is_active). Akun yang tertutup karena lulus atau lewat masa studi
// dibuka lewat Ubah: hapus tanggal lulus atau beri perpanjangan semester.
const aktifkanAkun = async ({ id, aktor, ipAddress }) => {
  pastikanStaf(aktor);

  return denganTransaksi(async (conn) => {
    const akun = await ambilMahasiswaTerkunci(conn, id);
    if (Number(akun.is_active ?? 1) === 1) throw new GalatAplikasi('Akun ini tidak dinonaktifkan manual', 409);

    await conn.query('UPDATE users SET is_active = 1 WHERE id = ?', [id]);
    await LogAktivitas.create({
      userId: aktor.id,
      action: 'aktifkan_akun',
      description: `Mengaktifkan kembali akun mahasiswa ${akun.identifier}`,
      ipAddress,
    }, conn);
    return bentukAkun({ ...akun, is_active: 1 });
  });
};

// Reset kata sandi mahasiswa yang lupa (migrasi 008). Kata sandi sementara dikembalikan SEKALI ke staf
// untuk disampaikan langsung ke mahasiswa; tidak disimpan teks biasa dan tidak ditulis ke log.
// Semua sesi mahasiswa itu langsung berakhir, dan ia wajib mengganti kata sandi saat login berikutnya.
const resetKataSandi = async ({ id, aktor, ipAddress }) => {
  pastikanStaf(aktor);
  const kataSandiSementara = buatSandiSementara();
  const hash = await bcrypt.hash(kataSandiSementara, 10);

  return denganTransaksi(async (conn) => {
    const akun = await ambilMahasiswaTerkunci(conn, id);
    await conn.query(
      'UPDATE users SET password = ?, wajib_ganti_sandi = 1, versi_token = versi_token + 1 WHERE id = ?',
      [hash, id]
    ).catch(periksaMigrasi('008_keamanan_sesi.sql'));
    await LogAktivitas.create({
      userId: aktor.id,
      action: 'reset_kata_sandi',
      description: `Mereset kata sandi akun mahasiswa ${akun.identifier}`,
      ipAddress,
    }, conn);
    return { akun: bentukAkun(akun), kata_sandi_sementara: kataSandiSementara };
  });
};

module.exports = { JENJANG, validasiData, daftarAkun, ubahDataMahasiswa, aktifkanAkun, resetKataSandi };
