const assert = require('node:assert/strict');
const test = require('node:test');

// Database tiruan: setiap kueri dicatat dan dijawab oleh fungsi jawab(sql, parameter).
const dbPath = require.resolve('../src/config/db');
const logPath = require.resolve('../src/models/logModel');
const kueri = [];
let jawab = async () => [[]];
const conn = {
  query: async (sql, parameter) => { kueri.push({ sql, parameter }); return jawab(sql, parameter); },
  beginTransaction: async () => {},
  commit: async () => {},
  rollback: async () => {},
  release: () => {},
};
const db = { query: conn.query, getConnection: async () => conn };
const log = [];
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: db };
require.cache[logPath] = {
  id: logPath,
  filename: logPath,
  loaded: true,
  exports: { LogAktivitas: { create: async (data) => { log.push(data); } } },
};
const {
  validasiData, daftarAkun, ubahDataMahasiswa, aktifkanAkun, resetKataSandi,
} = require('../src/services/akunService');
const bcrypt = require('bcryptjs');

const STAF = { id: 1, role: 'staf' };
const MAHASISWA_LAMA = {
  id: 7,
  identifier: '2311599007',
  nama: 'Mahasiswa Contoh',
  email: 'mhs7@contoh.test',
  role: 'mahasiswa',
  prodi: 'Sistem Informasi',
  jenjang: null,
  angkatan: null,
  no_hp: null,
  is_active: 0,
  tgl_lulus: null,
  tambahan_semester: 0,
};
const DATA_BARU = {
  identifier: '2311599007',
  nama: '  Mahasiswa   Contoh ',
  email: 'MHS7@contoh.test',
  no_hp: '',
  prodi: 'Sistem Informasi',
  jenjang: '',
  tgl_lulus: '',
  tambahan_semester: '',
};
const NOV_2026 = new Date(2026, 10, 27);

test.beforeEach(() => {
  kueri.length = 0;
  log.length = 0;
  jawab = async () => [[]];
});

test('data dirapikan, dan angkatan serta jenjang diambil dari NIM', () => {
  assert.deepEqual(validasiData(DATA_BARU, NOV_2026), {
    identifier: '2311599007',
    nama: 'Mahasiswa Contoh',
    email: 'mhs7@contoh.test',
    no_hp: null,
    prodi: 'Sistem Informasi',
    jenjang: 'S1',
    angkatan: 2023,
    tgl_lulus: null,
    tambahan_semester: 0,
  });
});

test('jenjang dari isian staf hanya dipakai bila kode jenjang di NIM belum dikenal', () => {
  assert.equal(validasiData({ ...DATA_BARU, jenjang: 'S2' }, NOV_2026).jenjang, 'S1');
  assert.equal(validasiData({ ...DATA_BARU, identifier: '2321599007', jenjang: 's2' }, NOV_2026).jenjang, 'S2');
  assert.equal(validasiData({ ...DATA_BARU, identifier: '2321599007' }, NOV_2026).jenjang, null);
});

test('data tidak valid ditolak dengan pesan yang menyebut masalahnya', () => {
  const salah = (ubahan, pesan) => assert.throws(() => validasiData({ ...DATA_BARU, ...ubahan }, NOV_2026), { status: 400, message: pesan });
  salah({ identifier: '23115990' }, /10 digit/);
  salah({ identifier: '2310999007' }, /bukan NIM Fakultas Teknologi Informasi/);
  salah({ identifier: '2911599007' }, /tahun masuk/);
  salah({ email: 'bukan-email' }, /Email/);
  salah({ identifier: '2321599007', jenjang: 'S9' }, /Jenjang/);
  salah({ tgl_lulus: '2026-02-30' }, /Tanggal lulus tidak valid/);
  salah({ tgl_lulus: '2026-12-01' }, /setelah hari ini/);
  salah({ tgl_lulus: '2022-08-01' }, /sebelum tahun masuk/);
  salah({ tambahan_semester: '15' }, /Perpanjangan semester/);
  salah({ tambahan_semester: '-1' }, /Perpanjangan semester/);
});

test('peran selain staf ditolak sebelum kueri dijalankan', async () => {
  await assert.rejects(daftarAkun({ id: 5, role: 'mahasiswa' }), { status: 403 });
  await assert.rejects(ubahDataMahasiswa({ id: 7, data: DATA_BARU, aktor: { id: 2, role: 'kakor' } }), { status: 403 });
  await assert.rejects(aktifkanAkun({ id: 7, aktor: { id: 4, role: 'dekan' } }), { status: 403 });
  assert.equal(kueri.length, 0);
});

test('daftar akun memuat status studi, tanpa kata sandi atau foto profil', async () => {
  jawab = async () => [[
    { ...MAHASISWA_LAMA, password: 'hash-rahasia', foto_profil: 'data:image/png;base64,AAAA' },
    { ...MAHASISWA_LAMA, id: 8, is_active: 1, angkatan: 2018 },
    { ...MAHASISWA_LAMA, id: 9, is_active: 1, angkatan: 2018, tambahan_semester: 6 },
  ]];
  const [nonaktif, lewat, diperpanjang] = await daftarAkun(STAF);

  assert.equal('password' in nonaktif, false);
  assert.equal('foto_profil' in nonaktif, false);
  assert.equal(nonaktif.status_studi.kode, 'nonaktif');
  assert.equal(lewat.status_studi.kode, 'lewat_masa_studi');
  assert.equal(diperpanjang.status_studi.kode, 'aktif');
  assert.doesNotMatch(kueri[0].sql, /password|foto_profil|\*/);
});

test('database tanpa migrasi 007 mendapat pesan yang menyebut migrasinya', async () => {
  jawab = async () => { const galat = new Error('Unknown column'); galat.code = 'ER_BAD_FIELD_ERROR'; throw galat; };
  await assert.rejects(daftarAkun(STAF), { status: 500, message: /migrasi 007/ });
});

test('NIM atau email yang dipakai akun lain ditolak dan tidak ada yang disimpan', async () => {
  jawab = async (sql) => {
    if (sql.includes('FOR UPDATE')) return [[MAHASISWA_LAMA]];
    if (sql.includes('id <> ?')) return [[{ identifier: '2311599008', email: 'mhs7@contoh.test' }]];
    return [[]];
  };

  await assert.rejects(ubahDataMahasiswa({ id: 7, data: DATA_BARU, aktor: STAF }), { status: 409, message: /Email/ });
  assert.equal(kueri.some(({ sql }) => sql.startsWith('UPDATE')), false);
  assert.equal(log.length, 0);
});

test('akun selain mahasiswa tidak bisa diubah dari halaman ini', async () => {
  jawab = async () => [[{ ...MAHASISWA_LAMA, role: 'dekan' }]];

  await assert.rejects(ubahDataMahasiswa({ id: 7, data: DATA_BARU, aktor: STAF }), { status: 403 });
  await assert.rejects(aktifkanAkun({ id: 7, aktor: STAF }), { status: 403 });
});

test('perubahan disimpan dan dicatat di log beserta kolom yang berubah', async () => {
  jawab = async (sql) => {
    if (sql.includes('FOR UPDATE')) return [[MAHASISWA_LAMA]];
    if (sql.includes('WHERE id = ?') && sql.startsWith('SELECT')) return [[{ ...MAHASISWA_LAMA, jenjang: 'S1', angkatan: 2023, tambahan_semester: 2 }]];
    return [[]];
  };
  const hasil = await ubahDataMahasiswa({
    id: 7, data: { ...DATA_BARU, tambahan_semester: '2' }, aktor: STAF, ipAddress: '127.0.0.1',
  });

  assert.deepEqual(hasil.berubah, ['jenjang', 'angkatan', 'perpanjangan semester']);
  const ubah = kueri.find(({ sql }) => sql.startsWith('UPDATE users SET identifier'));
  assert.deepEqual(ubah.parameter, ['2311599007', 'Mahasiswa Contoh', 'mhs7@contoh.test', null, 'Sistem Informasi', 'S1', 2023, null, 2, 7]);
  assert.equal(log.length, 1);
  assert.equal(log[0].action, 'ubah_data_akun');
  assert.match(log[0].description, /2311599007: jenjang, angkatan, perpanjangan semester$/);
});

test('aktifkan akun nonaktif berhasil, dan akun yang tidak dinonaktifkan ditolak', async () => {
  jawab = async () => [[MAHASISWA_LAMA]];
  const akun = await aktifkanAkun({ id: 7, aktor: STAF, ipAddress: '127.0.0.1' });
  assert.equal(akun.is_active, true);
  assert.equal(log[0].action, 'aktifkan_akun');

  jawab = async () => [[{ ...MAHASISWA_LAMA, is_active: 1 }]];
  await assert.rejects(aktifkanAkun({ id: 7, aktor: STAF }), { status: 409, message: /tidak dinonaktifkan manual/ });
});

test('reset kata sandi: sandi sementara acak, wajib diganti, semua sesi dicabut, dan tidak masuk log', async () => {
  jawab = async () => [[{ ...MAHASISWA_LAMA, is_active: 1 }]];
  const hasil = await resetKataSandi({ id: 7, aktor: STAF, ipAddress: '127.0.0.1' });

  assert.match(hasil.kata_sandi_sementara, /^[A-HJ-NP-Za-km-z2-9]{12}$/);
  const ubah = kueri.find(({ sql }) => sql.startsWith('UPDATE users SET password'));
  assert.match(ubah.sql, /wajib_ganti_sandi = 1, versi_token = versi_token \+ 1/);
  assert.equal(await bcrypt.compare(hasil.kata_sandi_sementara, ubah.parameter[0]), true);
  assert.equal(log[0].action, 'reset_kata_sandi');
  assert.doesNotMatch(log[0].description, new RegExp(hasil.kata_sandi_sementara));

  const lain = await resetKataSandi({ id: 7, aktor: STAF });
  assert.notEqual(lain.kata_sandi_sementara, hasil.kata_sandi_sementara);
});

test('reset kata sandi hanya untuk staf dan akun mahasiswa', async () => {
  await assert.rejects(resetKataSandi({ id: 7, aktor: { id: 4, role: 'dekan' } }), { status: 403 });
  jawab = async () => [[{ ...MAHASISWA_LAMA, role: 'staf' }]];
  await assert.rejects(resetKataSandi({ id: 7, aktor: STAF }), { status: 403 });
});
