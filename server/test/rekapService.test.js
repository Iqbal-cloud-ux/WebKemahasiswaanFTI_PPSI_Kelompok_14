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
const { ambilRekap, eksporCsv } = require('../src/services/rekapService');

const siapkanQueryLaporan = (panggilan) => {
  db.query = async (sql, params) => {
    panggilan.push({ sql, params });
    if (sql.includes('AVG(CASE')) {
      return [[{
        total: '12',
        selesai: '4',
        diproses: '6',
        ditolak: '2',
        rata_rata_hari: '3.5',
      }], []];
    }
    if (sql.includes('FROM jenis_layanan j')) {
      return [[{
        id: 3,
        nama_layanan: 'Surat Keterangan Aktif Kuliah',
        total: '12',
        selesai: '4',
        diproses: '6',
        ditolak: '2',
      }], []];
    }
    return [[{ periode: '2026-10', masuk: '12', selesai: '4' }], []];
  };
};

test.afterEach(() => {
  db.query = async () => { throw new Error('Query uji belum diatur'); };
  logAktivitas.create = async () => {};
});

test('rekap hanya berisi agregat dan menerapkan filter tanggal, layanan, serta status', async () => {
  const panggilan = [];
  siapkanQueryLaporan(panggilan);

  const hasil = await ambilRekap({
    mulai: '2026-10-01',
    sampai: '2026-10-31',
    jenisLayananId: '3',
    status: 'Diproses',
  }, { id: 7, role: 'staf' });

  assert.equal(panggilan.length, 3);
  for (const panggilanQuery of panggilan) {
    assert.match(panggilanQuery.sql, /p\.created_at >= \?/);
    assert.match(panggilanQuery.sql, /p\.created_at < DATE_ADD\(\?, INTERVAL 1 DAY\)/);
    assert.match(panggilanQuery.sql, /p\.jenis_layanan_id = \?/);
    assert.match(panggilanQuery.sql, /p\.status NOT IN \('disetujui', 'ditolak'\)/);
    assert.deepEqual(panggilanQuery.params, ['2026-10-01', '2026-10-31', 3]);
  }
  assert.deepEqual(hasil.ringkasan, {
    total: 12,
    selesai: 4,
    diproses: 6,
    ditolak: 2,
    rata_rata_hari: 3.5,
  });
  assert.deepEqual(hasil.per_jenis_layanan[0], {
    id: 3,
    nama_layanan: 'Surat Keterangan Aktif Kuliah',
    total: 12,
    selesai: 4,
    diproses: 6,
    ditolak: 2,
  });
  assert.deepEqual(hasil.tren[0], { periode: '2026-10', masuk: 12, selesai: 4 });
});

test('filter tanggal tidak valid dan peran selain staf ditolak sebelum kueri dijalankan', async () => {
  let jumlahQuery = 0;
  db.query = async () => { jumlahQuery += 1; return [[], []]; };

  await assert.rejects(
    ambilRekap({ mulai: '2026-02-31' }, { id: 7, role: 'staf' }),
    { status: 400 }
  );
  await assert.rejects(
    ambilRekap({}, { id: 8, role: 'mahasiswa' }),
    { status: 403 }
  );
  assert.equal(jumlahQuery, 0);
});

test('ekspor CSV mencatat aktivitas dan tidak memuat data pribadi mahasiswa', async () => {
  siapkanQueryLaporan([]);
  const log = [];
  logAktivitas.create = async (data) => log.push(data);

  const hasil = await eksporCsv({}, { id: 7, role: 'staf' }, '127.0.0.1');
  const isi = hasil.buffer.toString('utf8');

  assert.equal(hasil.namaFile, 'rekapitulasi_semua_semua.csv');
  assert.ok(isi.startsWith('\uFEFF'));
  assert.match(isi, /Surat Keterangan Aktif Kuliah/);
  assert.doesNotMatch(isi, /mahasiswa|nim|990000/);
  assert.deepEqual(log, [{
    userId: 7,
    action: 'ekspor_rekap',
    description: 'Mengekspor laporan rekapitulasi CSV untuk semua_semua',
    ipAddress: '127.0.0.1',
  }]);
});
