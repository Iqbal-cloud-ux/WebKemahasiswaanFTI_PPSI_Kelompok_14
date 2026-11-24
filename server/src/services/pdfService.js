// Pembuatan PDF surat dengan PDFKit (keputusan tim 24 November 2026).
// Tata letak sederhana dari template_surat:
// - Kepala surat: setiap baris di tengah; baris pertama tebal. Diikuti garis pemisah.
// - Isi: bila baris pertama berhuruf kapital semua, baris itu dianggap judul (tebal, di tengah, bergaris bawah)
//   dan baris berikutnya yang diawali "Nomor" ikut di tengah. Baris lain rata kiri, baris kosong = jarak paragraf.
// - Kaki: baris sebelum baris kosong pertama = blok tanda tangan (rata kanan);
//   baris sesudahnya = keterangan kecil di tengah (misalnya kalimat persetujuan elektronik).
// - draf = true menambahkan tanda air "DRAF" di setiap halaman.
// - qr = { png: Buffer, keterangan: string } menempelkan kode QR di bawah blok tanda tangan (untuk surat final).
const PDFDocument = require('pdfkit');

const MARGIN = 64;

const tandaAirDraf = (doc) => {
  const { width, height } = doc.page;
  doc.save();
  doc.rotate(-35, { origin: [width / 2, height / 2] });
  doc.fillColor('#94a3b8').fillOpacity(0.15).font('Helvetica-Bold').fontSize(120)
    .text('DRAF', 0, height / 2 - 60, { width, align: 'center', lineBreak: false });
  doc.restore();
  doc.fillColor('#000').fillOpacity(1);
};

const tulisKepala = (doc, header) => {
  const baris = String(header || '').split('\n').filter((b) => b.trim());
  baris.forEach((teks, i) => {
    doc.font(i === 0 ? 'Helvetica-Bold' : 'Helvetica').fontSize(i === 0 ? 14 : i === 1 ? 12 : 9)
      .text(teks.trim(), { align: 'center' });
  });
  if (baris.length) {
    const y = doc.y + 6;
    doc.moveTo(MARGIN, y).lineTo(doc.page.width - MARGIN, y).lineWidth(1.2).stroke();
    doc.moveDown(1.4);
  }
};

const tulisIsi = (doc, isi) => {
  const baris = String(isi || '').split('\n');
  let mulai = 0;
  const pertama = (baris[0] || '').trim();
  if (pertama && pertama === pertama.toUpperCase() && /[A-Z]/.test(pertama)) {
    doc.font('Helvetica-Bold').fontSize(12).text(pertama, { align: 'center', underline: true });
    mulai = 1;
    if (/^nomor/i.test((baris[1] || '').trim())) {
      doc.font('Helvetica').fontSize(11).text(baris[1].trim(), { align: 'center' });
      mulai = 2;
    }
    doc.moveDown(1);
  }
  doc.font('Helvetica').fontSize(11);
  for (const teks of baris.slice(mulai)) {
    if (!teks.trim()) doc.moveDown(0.6);
    else doc.text(teks, { align: 'left', lineGap: 2 });
  }
};

const tulisKaki = (doc, footer, qr) => {
  const baris = String(footer || '').split('\n');
  const kosong = baris.findIndex((b) => !b.trim());
  const tandaTangan = (kosong === -1 ? baris : baris.slice(0, kosong)).filter((b) => b.trim());
  const keterangan = kosong === -1 ? [] : baris.slice(kosong + 1).filter((b) => b.trim());
  const lebarBlok = 220;
  const xBlok = doc.page.width - MARGIN - lebarBlok;

  doc.moveDown(2);
  doc.font('Helvetica').fontSize(11);
  tandaTangan.forEach((teks) => doc.text(teks.trim(), xBlok, doc.y, { width: lebarBlok, align: 'left' }));

  if (qr?.png) {
    doc.moveDown(0.5);
    const y = doc.y;
    doc.image(qr.png, xBlok, y, { width: 90, height: 90 });
    if (qr.keterangan) doc.font('Helvetica').fontSize(7).text(qr.keterangan, xBlok, y + 94, { width: lebarBlok });
  } else {
    doc.moveDown(3);
  }

  if (keterangan.length) {
    doc.moveDown(1.5);
    doc.font('Helvetica-Oblique').fontSize(8).fillColor('#475569');
    keterangan.forEach((teks) => doc.text(teks.trim(), MARGIN, doc.y, { width: doc.page.width - MARGIN * 2, align: 'center' }));
    doc.fillColor('#000');
  }
};

// Mengembalikan Promise<Buffer> berisi PDF.
const buatPdfSurat = ({ header, isi, footer, draf = false, qr = null, judul = 'Surat' }) => new Promise((resolve, reject) => {
  // bufferPages: tanda air digambar paling akhir di setiap halaman, agar tidak menggeser posisi
  // atau ukuran huruf isi surat (PDFKit menyimpan posisi dan font sebagai state dokumen).
  const doc = new PDFDocument({ size: 'A4', margin: MARGIN, bufferPages: true, info: { Title: judul, Producer: 'Layanan Kemahasiswaan FTI' } });
  const potongan = [];
  doc.on('data', (chunk) => potongan.push(chunk));
  doc.on('end', () => resolve(Buffer.concat(potongan)));
  doc.on('error', reject);
  try {
    tulisKepala(doc, header);
    tulisIsi(doc, isi);
    tulisKaki(doc, footer, qr);
    if (draf) {
      const { start, count } = doc.bufferedPageRange();
      for (let i = start; i < start + count; i += 1) {
        doc.switchToPage(i);
        tandaAirDraf(doc);
      }
    }
    doc.end();
  } catch (error) {
    reject(error);
  }
});

module.exports = { buatPdfSurat };
