const assert = require('node:assert/strict');
const test = require('node:test');
const { bacaNim, masalahNimFti } = require('../src/utils/nim');
const { statusStudi } = require('../src/utils/statusStudi');

const NOV_2026 = new Date(2026, 10, 27);
const mahasiswa = (ubahan = {}) => ({ role: 'mahasiswa', is_active: 1, angkatan: 2023, tgl_lulus: null, tambahan_semester: 0, ...ubahan });

test('NIM dibaca menjadi angkatan, jenjang, dan kode fakultas', () => {
  assert.deepEqual(bacaNim('2311599001'), { angkatan: 2023, jenjang: 'S1', kodeFakultas: '15' });
  assert.deepEqual(bacaNim('2421599001'), { angkatan: 2024, jenjang: null, kodeFakultas: '15' });
  assert.equal(bacaNim('23115990'), null);
  assert.equal(bacaNim('23115A9001'), null);
});

test('hanya NIM 10 digit milik FTI (kode 15) yang diterima', () => {
  assert.equal(masalahNimFti('2311599001', NOV_2026), null);
  assert.match(masalahNimFti('2310999001', NOV_2026), /bukan NIM Fakultas Teknologi Informasi/);
  assert.match(masalahNimFti('99', NOV_2026), /10 digit/);
});

test('mahasiswa sampai semester 14 aktif; angkatan 2020 masih aktif pada November 2026', () => {
  const status = statusStudi(mahasiswa({ angkatan: 2020 }), NOV_2026);
  assert.equal(status.kode, 'aktif');
  assert.equal(status.semester, 13);
  assert.equal(statusStudi(mahasiswa({ angkatan: 2020 }), new Date(2027, 6, 31)).kode, 'aktif');
  assert.equal(statusStudi(mahasiswa({ angkatan: 2020 }), new Date(2027, 7, 1)).kode, 'lewat_masa_studi');
});

test('lewat 14 semester ditolak, kecuali ada perpanjangan karena cuti', () => {
  const lewat = statusStudi(mahasiswa({ angkatan: 2019 }), NOV_2026);
  assert.equal(lewat.kode, 'lewat_masa_studi');
  assert.equal(lewat.bolehLogin, false);
  assert.match(lewat.pesan, /14 semester/);

  const diperpanjang = statusStudi(mahasiswa({ angkatan: 2019, tambahan_semester: 2 }), NOV_2026);
  assert.equal(diperpanjang.kode, 'aktif');
  assert.equal(diperpanjang.batasSemester, 16);
});

test('setelah lulus ada masa tenggang 30 hari untuk mengunduh surat, lalu akun tertutup', () => {
  const tenggang = statusStudi(mahasiswa({ tgl_lulus: '2026-11-20' }), NOV_2026);
  assert.equal(tenggang.kode, 'masa_tenggang');
  assert.equal(tenggang.bolehLogin, true);
  assert.equal(tenggang.bolehAjukan, false);
  assert.equal(tenggang.tutupPada, '2026-12-20');

  assert.equal(statusStudi(mahasiswa({ tgl_lulus: new Date(2026, 9, 28) }), NOV_2026).kode, 'lulus');
  assert.equal(statusStudi(mahasiswa({ tgl_lulus: '2026-10-28' }), NOV_2026).bolehLogin, false);
});

test('penonaktifan manual berlaku untuk semua peran; peran lain tidak memakai aturan masa studi', () => {
  assert.equal(statusStudi(mahasiswa({ is_active: 0 }), NOV_2026).kode, 'nonaktif');
  assert.equal(statusStudi({ role: 'staf', is_active: 0 }, NOV_2026).bolehLogin, false);
  assert.equal(statusStudi({ role: 'dekan', is_active: 1, angkatan: 1990 }, NOV_2026).kode, 'aktif');
});

test('mahasiswa tanpa data angkatan tidak diblokir', () => {
  assert.equal(statusStudi(mahasiswa({ angkatan: null }), NOV_2026).kode, 'aktif');
});
