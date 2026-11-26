const assert = require('node:assert/strict');
const test = require('node:test');
const dbPath = require.resolve('../src/config/db');
const logPath = require.resolve('../src/models/logModel');
const db = { query: async () => { throw new Error('Query uji belum diatur'); } };
const logAktivitas = { create: async () => {} };
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: db };
require.cache[logPath] = {
  id: logPath,
  filename: logPath,
  loaded: true,
  exports: { LogAktivitas: logAktivitas },
};
const { daftarArsip, suratTerbit } = require('../src/services/suratService');

test.afterEach(() => {
  db.query = async () => { throw new Error('Query uji belum diatur'); };
  logAktivitas.create = async () => {};
});

test('daftar arsip hanya dapat dibuka staf dan mencatat akses', async () => {
  const panggilan = [];
  db.query = async (sql) => {
    panggilan.push(sql);
    return [[{
      pengajuan_id: 12,
      no_referensi: 'PGJ-2026-00012',
      no_surat: 'B/12/2026',
      mahasiswa_nama: 'Mahasiswa Contoh',
      mahasiswa_nim: '9900000012',
      nama_layanan: 'Surat Keterangan Aktif Kuliah',
      tgl_terbit: '2026-11-26',
      hash_sha256: 'a'.repeat(64),
    }], []];
  };
  const log = [];
  logAktivitas.create = async (data) => log.push(data);

  const hasil = await daftarArsip({ id: 4, role: 'staf' }, '127.0.0.1');

  assert.equal(panggilan.length, 1);
  assert.match(panggilan[0], /p\.status = 'disetujui'/);
  assert.deepEqual(hasil[0].mahasiswa, { nama: 'Mahasiswa Contoh', nim: '9900000012' });
  assert.equal(hasil[0].hash_sha256, 'a'.repeat(64));
  assert.deepEqual(log, [{
    userId: 4,
    action: 'lihat_arsip_surat',
    description: 'Melihat daftar arsip surat (1 surat)',
    ipAddress: '127.0.0.1',
  }]);

  await assert.rejects(
    daftarArsip({ id: 8, role: 'mahasiswa' }, '127.0.0.1'),
    { status: 403 }
  );
  assert.equal(panggilan.length, 1);
});

test('mahasiswa tidak dapat mengunduh surat milik mahasiswa lain', async () => {
  db.query = async () => [[{
    no_referensi: 'PGJ-2026-00012',
    mahasiswa_id: 8,
    status: 'disetujui',
    status_draf: 'terbit',
    no_surat: 'B/12/2026',
    file_pdf_path: 'letters/terbit-contoh.pdf',
  }], []];
  let logDitulis = false;
  logAktivitas.create = async () => { logDitulis = true; };

  await assert.rejects(
    suratTerbit(12, { id: 9, role: 'mahasiswa' }, '127.0.0.1'),
    { status: 403, message: 'Anda tidak berhak mengunduh surat ini' }
  );
  assert.equal(logDitulis, false);
});

test('unduhan surat menolak path di luar folder arsip privat', async () => {
  db.query = async () => [[{
    no_referensi: 'PGJ-2026-00012',
    mahasiswa_id: 8,
    status: 'disetujui',
    status_draf: 'terbit',
    no_surat: 'B/12/2026',
    file_pdf_path: '../secret.pdf',
  }], []];
  let logDitulis = false;
  logAktivitas.create = async () => { logDitulis = true; };

  await assert.rejects(
    suratTerbit(12, { id: 4, role: 'staf' }, '127.0.0.1'),
    { status: 400, message: 'Berkas surat tidak dapat dibuka' }
  );
  assert.equal(logDitulis, false);
});
