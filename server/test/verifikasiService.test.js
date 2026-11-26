const assert = require('node:assert/strict');
const test = require('node:test');
const { verifikasiSurat } = require('../src/services/verifikasiService');

const HASH = 'a'.repeat(64);

const dbUji = (surat) => {
  const calls = [];
  return {
    calls,
    query: async (sql, params) => {
      calls.push({ sql, params });
      if (sql.includes('SELECT')) return [surat ? [surat] : [], []];
      return [{ affectedRows: 1 }, []];
    },
  };
};

test('mengembalikan metadata minimal saat nomor dan hash cocok', async () => {
  const db = dbUji({
    surat_id: 7,
    no_surat: 'B/1/2026',
    no_referensi: 'PGJ-2026-00001',
    hash_sha256: HASH,
    tgl_terbit: '2026-11-26',
    nama_layanan: 'Surat Keterangan Aktif Kuliah',
  });
  const hasil = await verifikasiSurat({
    nomor: ' B/1/2026 ',
    hash: HASH,
    userAgent: 'Browser uji',
    ipAddress: '127.0.0.1',
  }, db);

  assert.deepEqual(hasil, {
    valid: true,
    surat: {
      nomor: 'B/1/2026',
      jenis: 'Surat Keterangan Aktif Kuliah',
      tanggal_terbit: '2026-11-26',
      status: 'Selesai',
    },
  });
  assert.equal(db.calls.length, 2);
  assert.match(db.calls[1].sql, /INSERT INTO public_verification/);
});

test('hash tidak cocok menghasilkan invalid dan tetap mencatat pemeriksaan', async () => {
  const db = dbUji({
    surat_id: 7,
    no_surat: null,
    no_referensi: 'PGJ-2026-00001',
    hash_sha256: HASH,
    tgl_terbit: '2026-11-26',
    nama_layanan: 'Surat Keterangan Aktif Kuliah',
  });
  const hasil = await verifikasiSurat({
    nomor: 'PGJ-2026-00001',
    hash: 'b'.repeat(64),
  }, db);

  assert.deepEqual(hasil, { valid: false });
  assert.equal(db.calls.length, 2);
});

test('nomor yang tidak ditemukan tidak membocorkan metadata atau membuat log FK yatim', async () => {
  const db = dbUji(null);
  const hasil = await verifikasiSurat({ nomor: 'tidak-ada', hash: HASH }, db);

  assert.deepEqual(hasil, { valid: false });
  assert.equal(db.calls.length, 1);
});

test('menolak payload dengan hash yang bukan SHA-256 heksadesimal', async () => {
  const db = dbUji(null);

  await assert.rejects(
    verifikasiSurat({ nomor: 'B/1/2026', hash: 'bukan-hash' }, db),
    { status: 400, message: /64 karakter heksadesimal/ }
  );
  assert.equal(db.calls.length, 0);
});
