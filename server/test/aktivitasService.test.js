const assert = require('node:assert/strict');
const test = require('node:test');

const dbPath = require.resolve('../src/config/db');
const kueri = [];
let baris = [];
const db = { query: async (sql, parameter) => { kueri.push({ sql, parameter }); return [baris]; } };
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: db };
const { judulAktivitas, daftarAktivitas } = require('../src/services/aktivitasService');

const STAF = { id: 1, role: 'staf' };
const judul = (dari, ke) => judulAktivitas({ status_sebelumnya: dari, status_baru: ke, no_referensi: 'PGJ-2026-00001' });

test.beforeEach(() => { kueri.length = 0; baris = []; });

test('setiap perpindahan status punya judul yang mudah dibaca', () => {
  assert.equal(judul(null, 'diajukan'), 'Pengajuan PGJ-2026-00001 diterima');
  assert.equal(judul('perlu_perbaikan', 'diajukan'), 'Perbaikan PGJ-2026-00001 dikirim ulang');
  assert.equal(judul('diajukan', 'perlu_perbaikan'), 'Pengajuan PGJ-2026-00001 diminta perbaikan');
  assert.equal(judul('diajukan', 'diverifikasi'), 'Pengajuan PGJ-2026-00001 diverifikasi');
  assert.equal(judul('pending_wadek1', 'diverifikasi'), 'Draf PGJ-2026-00001 dikembalikan untuk revisi');
  assert.equal(judul('diverifikasi', 'pending_kakor'), 'Draf PGJ-2026-00001 diteruskan ke Kepala Kantor');
  assert.equal(judul('pending_kakor', 'pending_wadek1'), 'Draf PGJ-2026-00001 diparaf Kepala Kantor');
  assert.equal(judul('pending_wadek1', 'pending_dekan'), 'Draf PGJ-2026-00001 diparaf Wakil Dekan 1');
  assert.equal(judul('pending_dekan', 'disetujui'), 'Surat PGJ-2026-00001 diterbitkan');
  assert.equal(judul('pending_dekan', 'ditolak'), 'Pengajuan PGJ-2026-00001 ditolak Dekan');
  assert.equal(judul('diajukan', 'ditolak'), 'Pengajuan PGJ-2026-00001 ditolak');
});

test('keterangan memuat pelaku, layanan, dan catatan yang dipotong', async () => {
  baris = [{
    id: 3, pengajuan_id: 9, no_referensi: 'PGJ-2026-00009', status_sebelumnya: 'pending_kakor', status_baru: 'diverifikasi',
    catatan: `  ${'a'.repeat(200)}  `, nama_layanan: 'Surat Keterangan Lulus', pelaku_nama: 'Kepala Kantor Uji', created_at: '2026-11-27 10:00:00',
  }, {
    id: 2, pengajuan_id: 8, no_referensi: 'PGJ-2026-00008', status_sebelumnya: null, status_baru: 'diajukan',
    catatan: null, nama_layanan: 'Pengembalian UKT', pelaku_nama: null, created_at: '2026-11-27 09:00:00',
  }];
  const [dikembalikan, baru] = await daftarAktivitas(STAF);

  assert.equal(dikembalikan.judul, 'Draf PGJ-2026-00009 dikembalikan untuk revisi');
  assert.equal(dikembalikan.perhatian, true);
  assert.equal(baru.perhatian, false);
  assert.match(dikembalikan.keterangan, /^Kepala Kantor Uji · Surat Keterangan Lulus · "a{119}…"$/);
  assert.equal(baru.keterangan, 'Sistem · Pengembalian UKT');
});

test('jumlah dibatasi 1 sampai 30, bawaan 8, dan hanya staf yang boleh', async () => {
  await daftarAktivitas(STAF);
  await daftarAktivitas(STAF, '500');
  await daftarAktivitas(STAF, 'abc');
  assert.deepEqual(kueri.map(({ parameter }) => parameter[0]), [8, 30, 8]);
  await assert.rejects(daftarAktivitas({ id: 2, role: 'mahasiswa' }), { status: 403 });
});
