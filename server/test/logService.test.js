const assert = require('node:assert/strict');
const test = require('node:test');

const dbPath = require.resolve('../src/config/db');
const kueri = [];
const db = {
  query: async (sql, parameter) => {
    kueri.push({ sql, parameter });
    if (sql.includes('COUNT(*)')) return [[{ total: 41 }]];
    if (sql.includes('DISTINCT action')) return [[{ action: 'login' }, { action: 'paraf' }]];
    return [[
      { id: 2, action: 'paraf', description: 'Paraf PGJ-2026-00001', created_at: '2026-11-27 10:00:00', nama: 'Kepala Kantor Uji', identifier: '990000000000000002', role: 'kakor', ip_address: '10.0.0.9' },
      { id: 1, action: 'login_gagal', description: 'Login gagal: akun tidak ditemukan', created_at: '2026-11-27 09:00:00', nama: null, identifier: null, role: null },
    ]];
  },
};
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: db };
const { validasiFilter, daftarLog } = require('../src/services/logService');

const DEKAN = { id: 4, role: 'dekan' };

test.beforeEach(() => { kueri.length = 0; });

test('hanya Dekan yang boleh membaca log; Kepala Kantor dan Wakil Dekan 1 ditolak', async () => {
  for (const role of ['mahasiswa', 'staf', 'kakor', 'wadek1']) {
    await assert.rejects(daftarLog({}, { id: 1, role }), { status: 403, message: 'Hanya Dekan yang dapat melihat log aktivitas' });
  }
  assert.equal(kueri.length, 0);
  await daftarLog({}, DEKAN);
});

test('log dikirim tanpa alamat IP, dan akun yang terhapus tampil tanpa pengguna', async () => {
  const hasil = await daftarLog({}, DEKAN);

  assert.equal(JSON.stringify(hasil).includes('10.0.0.9'), false);
  assert.doesNotMatch(kueri[1].sql, /ip_address/);
  assert.deepEqual(hasil.log[0].pengguna, { nama: 'Kepala Kantor Uji', identifier: '990000000000000002', role: 'kakor' });
  assert.equal(hasil.log[1].pengguna, null);
  assert.equal(hasil.total, 41);
  assert.deepEqual(hasil.daftar_aksi, ['login', 'paraf']);
});

test('filter dipasang sebagai parameter kueri, termasuk halaman', async () => {
  await daftarLog({ cari: '50%_a', peran: 'staf', aksi: 'buka_berkas', mulai: '2026-11-01', sampai: '2026-11-30', halaman: '3', per_halaman: '10' }, DEKAN);
  const [hitung, data] = kueri;

  assert.match(hitung.sql, /u\.role = \?/);
  assert.match(hitung.sql, /l\.action = \?/);
  assert.deepEqual(hitung.parameter, ['%50\\%\\_a%', '%50\\%\\_a%', '%50\\%\\_a%', 'staf', 'buka_berkas', '2026-11-01', '2026-11-30']);
  assert.deepEqual(data.parameter.slice(-2), [10, 20]);
});

test('filter yang tidak valid ditolak; jumlah per halaman dibatasi 100', () => {
  assert.throws(() => validasiFilter({ peran: 'admin' }), { status: 400 });
  assert.throws(() => validasiFilter({ aksi: "login' OR 1=1" }), { status: 400 });
  assert.throws(() => validasiFilter({ mulai: '2026-13-01' }), { status: 400 });
  assert.throws(() => validasiFilter({ mulai: '2026-11-30', sampai: '2026-11-01' }), { status: 400 });
  assert.throws(() => validasiFilter({ cari: 'a'.repeat(101) }), { status: 400 });
  assert.equal(validasiFilter({ per_halaman: '5000' }).perHalaman, 100);
  assert.equal(validasiFilter({ halaman: '-2' }).halaman, 1);
});
