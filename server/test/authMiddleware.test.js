const assert = require('node:assert/strict');
const test = require('node:test');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'rahasia-uji-saja';
const userPath = require.resolve('../src/models/userModel');
const User = { statusAkses: async () => null };
require.cache[userPath] = { id: userPath, filename: userPath, loaded: true, exports: User };
const { verifyToken } = require('../src/middlewares/authMiddleware');

const buatRes = () => {
  const res = { kode: 200, isi: null };
  res.status = (kode) => { res.kode = kode; return res; };
  res.json = (isi) => { res.isi = isi; return res; };
  return res;
};

const jalankan = async (token, { method = 'GET', baseUrl = '/api/pengajuan', path = '/saya' } = {}) => {
  const req = { headers: { authorization: `Bearer ${token}` }, method, baseUrl, path };
  const res = buatRes();
  let lanjut = false;
  await verifyToken(req, res, () => { lanjut = true; });
  return { req, res, lanjut };
};

const token = jwt.sign({ id: 5, role: 'mahasiswa' }, process.env.JWT_SECRET);

test('akun aktif dengan peran yang sama diteruskan', async () => {
  User.statusAkses = async () => ({ role: 'mahasiswa', is_active: 1 });
  const { req, lanjut } = await jalankan(token);

  assert.equal(lanjut, true);
  assert.equal(req.user.id, 5);
});

test('akun yang dinonaktifkan ditolak walau tokennya masih berlaku', async () => {
  User.statusAkses = async () => ({ role: 'mahasiswa', is_active: 0 });
  const { res, lanjut } = await jalankan(token);

  assert.equal(lanjut, false);
  assert.equal(res.kode, 401);
  assert.match(res.isi.message, /dinonaktifkan/);
});

test('akun yang dihapus atau diganti perannya ditolak', async () => {
  User.statusAkses = async () => null;
  assert.equal((await jalankan(token)).res.kode, 401);

  User.statusAkses = async () => ({ role: 'staf', is_active: 1 });
  const { res, lanjut } = await jalankan(token);
  assert.equal(lanjut, false);
  assert.equal(res.kode, 401);
  assert.match(res.isi.message, /Peran akun/);
});

test('token dengan versi lama (sesudah logout atau ganti kata sandi) ditolak', async () => {
  User.statusAkses = async () => ({ role: 'mahasiswa', is_active: 1, versi_token: 3 });
  const lama = jwt.sign({ id: 5, role: 'mahasiswa', v: 2 }, process.env.JWT_SECRET);
  const { res, lanjut } = await jalankan(lama);
  assert.equal(lanjut, false);
  assert.equal(res.kode, 401);
  assert.match(res.isi.message, /keluar atau kata sandi diganti/);

  const baru = jwt.sign({ id: 5, role: 'mahasiswa', v: 3 }, process.env.JWT_SECRET);
  assert.equal((await jalankan(baru)).lanjut, true);
});

test('token lama tanpa versi tetap berlaku selama versi di database masih 0', async () => {
  User.statusAkses = async () => ({ role: 'mahasiswa', is_active: 1, versi_token: 0 });
  assert.equal((await jalankan(token)).lanjut, true);
});

test('akun yang wajib ganti kata sandi hanya boleh membuka halaman ganti kata sandi', async () => {
  User.statusAkses = async () => ({ role: 'mahasiswa', is_active: 1, versi_token: 0, wajib_ganti_sandi: 1 });

  const ditolak = await jalankan(token);
  assert.equal(ditolak.lanjut, false);
  assert.equal(ditolak.res.kode, 403);
  assert.match(ditolak.res.isi.message, /Ganti kata sandi sementara/);

  assert.equal((await jalankan(token, { method: 'PUT', baseUrl: '/api/profil', path: '/kata-sandi' })).lanjut, true);
  assert.equal((await jalankan(token, { method: 'GET', baseUrl: '/api/profil', path: '/' })).lanjut, true);
  assert.equal((await jalankan(token, { method: 'POST', baseUrl: '/api/auth', path: '/logout' })).lanjut, true);
});

test('token palsu ditolak tanpa memeriksa database', async () => {
  let diperiksa = false;
  User.statusAkses = async () => { diperiksa = true; return { role: 'mahasiswa', is_active: 1 }; };
  const palsu = jwt.sign({ id: 5, role: 'mahasiswa' }, 'kunci-lain');
  const { res } = await jalankan(palsu);

  assert.equal(res.kode, 401);
  assert.equal(diperiksa, false);
});
