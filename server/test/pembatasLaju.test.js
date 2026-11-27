const assert = require('node:assert/strict');
const test = require('node:test');
const { buatPembatasLaju } = require('../src/middlewares/pembatasLaju');

const buatRes = () => {
  const res = { kode: 200, isi: null, header: {} };
  res.status = (kode) => { res.kode = kode; return res; };
  res.json = (isi) => { res.isi = isi; return res; };
  res.set = (nama, nilai) => { res.header[nama] = nilai; return res; };
  return res;
};

const kirim = (pembatas, ip) => {
  const res = buatRes();
  let lanjut = false;
  pembatas({ ip }, res, () => { lanjut = true; });
  return { res, lanjut };
};

test('permintaan melewati batas per IP ditolak dengan 429', () => {
  const pembatas = buatPembatasLaju({ batas: 2, jendelaMs: 60 * 1000, pesan: 'Terlalu banyak.' });

  assert.equal(kirim(pembatas, '10.0.0.1').lanjut, true);
  assert.equal(kirim(pembatas, '10.0.0.1').lanjut, true);
  const { res, lanjut } = kirim(pembatas, '10.0.0.1');

  assert.equal(lanjut, false);
  assert.equal(res.kode, 429);
  assert.match(res.isi.message, /^Terlalu banyak\. Coba lagi dalam 1 menit\.$/);
  assert.ok(Number(res.header['Retry-After']) > 0);
});

test('batas dihitung terpisah untuk setiap IP', () => {
  const pembatas = buatPembatasLaju({ batas: 1, jendelaMs: 60 * 1000, pesan: 'Terlalu banyak.' });

  assert.equal(kirim(pembatas, '10.0.0.1').lanjut, true);
  assert.equal(kirim(pembatas, '10.0.0.1').lanjut, false);
  assert.equal(kirim(pembatas, '10.0.0.2').lanjut, true);
});
