const assert = require('node:assert/strict');
const test = require('node:test');
const crypto = require('node:crypto');
const { PDFDocument, PDFDict, PDFName } = require('pdf-lib');
const QRCode = require('qrcode');
const { buatKodeVerifikasi, tempelLembarVerifikasi } = require('../src/services/pengesahanPdfService');
const { buatPdfSurat } = require('../src/services/pdfService');

const HASH = 'a'.repeat(64);

const buatBahanUji = async () => {
  const sumber = await PDFDocument.create();
  sumber.addPage([400, 600]);
  const pdfSumber = Buffer.from(await sumber.save());
  const qrPng = await QRCode.toBuffer(`PGJ-2026-00001:${HASH}`);
  return { pdfSumber, qrPng };
};

test('menghasilkan sidik jari PDF dan QR yang valid', async () => {
  const sumber = await PDFDocument.create();
  sumber.addPage();
  const pdfSumber = Buffer.from(await sumber.save());
  const { hashSha256, qrPng } = await buatKodeVerifikasi(pdfSumber, 'B/1/2026');

  assert.equal(hashSha256, crypto.createHash('sha256').update(pdfSumber).digest('hex'));
  assert.equal(qrPng.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
});

test('menempelkan QR pada PDF surat template sebelum diterbitkan', async () => {
  const qrPng = await QRCode.toBuffer('{"nomor":"B/1/2026","hash":"contoh"}');
  const pdfHasil = await buatPdfSurat({
    header: '',
    isi: 'Surat uji penerbitan',
    footer: 'Dekan\nNama Pejabat',
    qr: { png: qrPng, keterangan: `SHA-256: ${HASH}` },
  });
  const dokumen = await PDFDocument.load(pdfHasil);
  const sumberGambar = dokumen.getPage(0).node.Resources()
    .lookup(PDFName.of('XObject'), PDFDict);

  assert.equal(sumberGambar.entries().length, 1);
});

test('menambahkan halaman verifikasi tanpa mengubah ukuran halaman pindai', async () => {
  const { pdfSumber, qrPng } = await buatBahanUji();
  const pdfHasil = await tempelLembarVerifikasi({
    pdfSumber,
    qrPng,
    noReferensi: 'PGJ-2026-00001',
    hashSha256: HASH,
  });
  const dokumen = await PDFDocument.load(pdfHasil);

  assert.equal(dokumen.getPageCount(), 2);
  assert.deepEqual(dokumen.getPage(0).getSize(), { width: 400, height: 600 });
  const sumberGambar = dokumen.getPage(1).node.Resources()
    .lookup(PDFName.of('XObject'), PDFDict);
  assert.equal(sumberGambar.entries().length, 1);
});

test('menolak sidik jari yang bukan SHA-256 heksadesimal', async () => {
  const { pdfSumber, qrPng } = await buatBahanUji();

  await assert.rejects(
    tempelLembarVerifikasi({
      pdfSumber,
      qrPng,
      noReferensi: 'PGJ-2026-00001',
      hashSha256: 'tidak-valid',
    }),
    { name: 'TypeError', message: /64 karakter heksadesimal/ }
  );
});
