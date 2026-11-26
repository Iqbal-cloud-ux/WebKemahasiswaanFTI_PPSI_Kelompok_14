const { PDFDocument, StandardFonts } = require('pdf-lib');
const crypto = require('crypto');
const QRCode = require('qrcode');

const HALAMAN_A4 = { lebar: 595.28, tinggi: 841.89 };
const UKURAN_QR = 144;

const buatKodeVerifikasi = async (pdfSumber, nomor) => {
  if (!Buffer.isBuffer(pdfSumber) || pdfSumber.length === 0) {
    throw new TypeError('PDF sumber harus berupa Buffer yang tidak kosong');
  }
  if (typeof nomor !== 'string' || !nomor.trim() || nomor.length > 150) {
    throw new TypeError('Nomor surat atau referensi wajib diisi dan maksimal 150 karakter');
  }

  const hashSha256 = crypto.createHash('sha256').update(pdfSumber).digest('hex');
  const payload = JSON.stringify({ nomor: nomor.trim(), hash: hashSha256 });
  const qrPng = await QRCode.toBuffer(payload, { type: 'png', errorCorrectionLevel: 'M', margin: 2 });
  return { hashSha256, qrPng };
};

const tempelLembarVerifikasi = async ({ pdfSumber, qrPng, noReferensi, hashSha256 }) => {
  if (!Buffer.isBuffer(pdfSumber) || pdfSumber.length === 0) {
    throw new TypeError('PDF sumber harus berupa Buffer yang tidak kosong');
  }
  if (!Buffer.isBuffer(qrPng) || qrPng.length === 0) {
    throw new TypeError('Kode QR harus berupa Buffer PNG yang tidak kosong');
  }

  const referensi = typeof noReferensi === 'string' ? noReferensi.trim() : '';
  if (!referensi || referensi.length > 100) {
    throw new TypeError('Nomor referensi wajib diisi dan maksimal 100 karakter');
  }
  if (typeof hashSha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(hashSha256)) {
    throw new TypeError('Sidik jari SHA-256 harus berupa 64 karakter heksadesimal');
  }

  const dokumen = await PDFDocument.load(pdfSumber);
  if (dokumen.getPageCount() === 0) throw new Error('PDF sumber tidak memiliki halaman');

  const qr = await dokumen.embedPng(qrPng);
  const halaman = dokumen.addPage([HALAMAN_A4.lebar, HALAMAN_A4.tinggi]);
  const huruf = await dokumen.embedFont(StandardFonts.Helvetica);
  const hurufTebal = await dokumen.embedFont(StandardFonts.HelveticaBold);
  const hurufKode = await dokumen.embedFont(StandardFonts.Courier);

  halaman.drawText('Kode Verifikasi Dokumen', {
    x: 54,
    y: 755,
    size: 18,
    font: hurufTebal,
  });
  halaman.drawText('Dokumen ini disahkan melalui persetujuan elektronik beserta kode verifikasi.', {
    x: 54,
    y: 720,
    size: 11,
    font: huruf,
    maxWidth: HALAMAN_A4.lebar - 108,
  });
  halaman.drawImage(qr, {
    x: (HALAMAN_A4.lebar - UKURAN_QR) / 2,
    y: 500,
    width: UKURAN_QR,
    height: UKURAN_QR,
  });
  halaman.drawText(`Nomor referensi: ${referensi}`, {
    x: 54,
    y: 455,
    size: 11,
    font: huruf,
    maxWidth: HALAMAN_A4.lebar - 108,
  });
  halaman.drawText('Sidik jari digital (SHA-256):', {
    x: 54,
    y: 420,
    size: 10,
    font: huruf,
  });
  halaman.drawText(hashSha256.toLowerCase(), {
    x: 54,
    y: 398,
    size: 9,
    font: hurufKode,
    maxWidth: HALAMAN_A4.lebar - 108,
  });

  return Buffer.from(await dokumen.save());
};

module.exports = { buatKodeVerifikasi, tempelLembarVerifikasi };
