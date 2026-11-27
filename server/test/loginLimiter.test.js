const assert = require('node:assert/strict');
const test = require('node:test');
const { batasiLogin, catatLoginGagal, resetLoginGagal } = require('../src/middlewares/loginLimiter');

const buatRes = () => {
  const res = { kode: 200, isi: null };
  res.status = (kode) => { res.kode = kode; return res; };
  res.json = (isi) => { res.isi = isi; return res; };
  return res;
};

const coba = (identifier, ip) => {
  const req = { body: { identifier }, ip };
  const res = buatRes();
  let lanjut = false;
  batasiLogin(req, res, () => { lanjut = true; });
  return { req, res, lanjut };
};

test('lima kali gagal untuk satu akun dari satu IP diblokir, akun lain tetap boleh', () => {
  for (let i = 0; i < 5; i += 1) catatLoginGagal({ body: { identifier: '2311599001' }, ip: '10.1.0.1' });

  const { res, lanjut } = coba('2311599001', '10.1.0.1');
  assert.equal(lanjut, false);
  assert.equal(res.kode, 429);
  assert.equal(coba('2311599002', '10.1.0.1').lanjut, true);
});

test('tiga puluh kali gagal dari satu IP memblokir semua akun dari IP itu', () => {
  for (let i = 0; i < 30; i += 1) catatLoginGagal({ body: { identifier: `23115${String(90000 + i)}` }, ip: '10.2.0.1' });

  const { res, lanjut } = coba('2311599999', '10.2.0.1');
  assert.equal(lanjut, false);
  assert.match(res.isi.message, /dari perangkat ini/);
  assert.equal(coba('2311599999', '10.2.0.2').lanjut, true);
});

test('login berhasil menghapus catatan gagal akun itu', () => {
  const req = { body: { identifier: '2311599003' }, ip: '10.3.0.1' };
  for (let i = 0; i < 5; i += 1) catatLoginGagal(req);
  resetLoginGagal(req);
  assert.equal(coba('2311599003', '10.3.0.1').lanjut, true);
});
