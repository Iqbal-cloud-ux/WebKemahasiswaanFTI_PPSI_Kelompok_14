// Pembuatan PDF surat dengan PDFKit (keputusan tim 24 November 2026).
// Tata letak dibaca dari teks template_surat (kepala, isi, kaki) dengan aturan penulisan sederhana
// agar template tetap bisa disunting staf sebagai teks. Daftar lengkapnya ada di docs/data.md
// (bagian "Aturan penulisan template"). Ringkas:
//
// Di semua bagian, per baris:
//   [12] di awal baris         ukuran huruf baris itu (angka 6 sampai 30)
//   ^ di awal baris            rata tengah
//   > di awal baris            rata kanan
//   kiri >> kanan              teks kanan dicetak rata kanan di baris yang sama
//   Label :: nilai             baris "label : nilai"; titik dua sejajar dalam satu kelompok baris berurutan.
//                              Spasi di awal baris = menjorok (4 spasi kira-kira 1 cm)
//   | a | b | c |              baris tabel; baris pertama = judul kolom (tebal). Baris |:--|:-:|--:| opsional
//                              mengatur perataan kolom (kiri, tengah, kanan). Spasi di awal baris tabel =
//                              tabel menjorok dari kiri dan kanan
//   baris kosong               jarak antarparagraf
// Di dalam teks: **tebal**, *miring*, __garis bawah__ (boleh digabung, misalnya __**JUDUL**__).
//
// Khusus kepala surat: baris [[logo]] menaruh logo Unand di kiri; baris lain di tengah ruang sebelah kanannya.
// Khusus isi: baris [[huruf helvetica]] mengganti jenis huruf isi dan kaki (bawaan Times); baris [[ukuran 11]]
//   mengganti ukuran huruf bawaan isi dan kaki (bawaan 12, boleh 8 sampai 14).
// Khusus kaki: baris sebelum baris kosong pertama = blok tanda tangan (di kanan); baris sesudahnya =
//   keterangan kecil di tengah. Di blok tanda tangan: "kiri || kanan" = dua kolom, [[ttd]] = ruang
//   tanda tangan (diisi kode QR pada surat final), [[foto]] = pas foto 3x4 di kiri blok tanda tangan.
//
// Template lama tanpa aturan di atas tetap dicetak seperti sebelumnya (judul huruf kapital di baris
// pertama isi otomatis tebal, di tengah, bergaris bawah; QR di bawah blok tanda tangan).
//
// Opsi buatPdfSurat:
// - draf = true menambahkan tanda air "DRAF" di setiap halaman.
// - qr = { png: Buffer, keterangan: string } menempelkan kode QR (surat final).
// - foto = Buffer (JPG/PNG) untuk [[foto]]; bila kosong dicetak kotak penanda tempat.
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const MARGIN = { top: 36, bottom: 56, left: 72, right: 57 };
const LOKASI_LOGO = path.resolve(__dirname, '../../assets/images/logo-unand.png');
const UKURAN_ISI = 12;
const LEBAR_BLOK_TTD = 215;
const TINGGI_TTD = 72;
const FOTO = { lebar: 85, tinggi: 113 }; // 3 x 4 cm
const JENIS_HURUF = {
  times: { biasa: 'Times-Roman', tebal: 'Times-Bold', miring: 'Times-Italic', tebalMiring: 'Times-BoldItalic' },
  helvetica: { biasa: 'Helvetica', tebal: 'Helvetica-Bold', miring: 'Helvetica-Oblique', tebalMiring: 'Helvetica-BoldOblique' },
};

let logoTersimpan;
const ambilLogo = () => {
  if (logoTersimpan === undefined) {
    try { logoTersimpan = fs.readFileSync(LOKASI_LOGO); } catch { logoTersimpan = null; }
  }
  return logoTersimpan;
};

const namaHuruf = (huruf, { tebal, miring }) => {
  if (tebal && miring) return huruf.tebalMiring;
  if (tebal) return huruf.tebal;
  return miring ? huruf.miring : huruf.biasa;
};

// Memecah teks bermarkah menjadi potongan { teks, tebal, miring, garis }.
const pecahMarkah = (teks) => {
  const hasil = [];
  const gaya = { tebal: false, miring: false, garis: false };
  let sisa = '';
  const simpan = () => {
    if (sisa) hasil.push({ teks: sisa, ...gaya });
    sisa = '';
  };
  for (let i = 0; i < teks.length; i += 1) {
    if (teks.startsWith('**', i)) { simpan(); gaya.tebal = !gaya.tebal; i += 1; }
    else if (teks.startsWith('__', i)) { simpan(); gaya.garis = !gaya.garis; i += 1; }
    else if (teks[i] === '*') { simpan(); gaya.miring = !gaya.miring; }
    else sisa += teks[i];
  }
  simpan();
  return hasil;
};

const teksPolos = (teks) => pecahMarkah(teks).map((p) => p.teks).join('');

const lebarTeks = (doc, huruf, ukuran, teks) => pecahMarkah(teks).reduce(
  (jumlah, p) => jumlah + doc.font(namaHuruf(huruf, p)).fontSize(ukuran).widthOfString(p.teks), 0
);

const tinggiTeks = (doc, huruf, ukuran, teks, lebar) => {
  doc.font(huruf.biasa).fontSize(ukuran);
  return doc.heightOfString(teksPolos(teks) || ' ', { width: lebar, lineGap: 1 });
};

// Mencetak satu paragraf bermarkah di (x, y) dengan lebar tertentu. doc.y berada di bawahnya sesudahnya.
const tulisMarkah = (doc, huruf, ukuran, teks, { x, y, lebar, rata = 'left' }) => {
  const potongan = pecahMarkah(teks);
  if (!potongan.length) potongan.push({ teks: ' ' });
  // PDFKit membuang spasi di awal potongan lanjutan ("**tebal** kata" menjadi "tebalkata"), jadi spasi
  // itu dipindah ke akhir potongan sebelumnya.
  for (let i = 1; i < potongan.length; i += 1) {
    const spasi = potongan[i].teks.match(/^\s+/);
    if (spasi) {
      potongan[i - 1].teks += spasi[0];
      potongan[i].teks = potongan[i].teks.slice(spasi[0].length);
    }
  }
  // PDFKit salah menempatkan teks "continued" yang rata tengah/kanan bila gayanya berganti. Bila muat
  // satu baris, setiap potongan ditempatkan manual.
  const total = lebarTeks(doc, huruf, ukuran, teks);
  if (potongan.length > 1 && (rata === 'center' || rata === 'right') && total <= lebar) {
    let xPotongan = x + (rata === 'center' ? (lebar - total) / 2 : lebar - total);
    potongan.forEach((p) => {
      doc.font(namaHuruf(huruf, p)).fontSize(ukuran);
      // Spasi di ujung potongan tidak ikut digaris bawah.
      const inti = p.teks.replace(/\s+$/, '');
      if (inti) doc.text(inti, xPotongan, y, { lineBreak: false, underline: p.garis });
      xPotongan += doc.widthOfString(p.teks);
    });
    doc.x = x;
    doc.y = y + doc.currentLineHeight(true) + 1;
    return;
  }
  potongan.forEach((p, i) => {
    const opsi = { width: lebar, align: rata, underline: p.garis, continued: i < potongan.length - 1, lineGap: 1 };
    doc.font(namaHuruf(huruf, p)).fontSize(ukuran);
    if (i === 0) doc.text(p.teks, x, y, opsi);
    else doc.text(p.teks, opsi);
  });
};

const pastikanRuang = (doc, tinggi) => {
  if (doc.y + tinggi > doc.page.height - MARGIN.bottom) doc.addPage();
};

// Membaca awalan baris: ukuran huruf, perataan, dan jorokan.
const bacaBaris = (mentah) => {
  const jorok = (mentah.match(/^ */) || [''])[0].length;
  let teks = mentah.trim();
  let ukuran = null;
  const cocokUkuran = teks.match(/^\[(\d{1,2})\]\s*/);
  if (cocokUkuran && Number(cocokUkuran[1]) >= 6 && Number(cocokUkuran[1]) <= 30) {
    ukuran = Number(cocokUkuran[1]);
    teks = teks.slice(cocokUkuran[0].length);
  }
  let rata = null;
  if (teks.startsWith('^')) { rata = 'center'; teks = teks.slice(1).trim(); }
  else if (teks.startsWith('>') && !teks.startsWith('>>')) { rata = 'right'; teks = teks.slice(1).trim(); }
  return { teks, ukuran, rata, jorok: jorok * 7 }; // 4 spasi kira-kira 28 pt (1 cm)
};

const adalahTabel = (teks) => teks.startsWith('|') && teks.endsWith('|') && teks.length > 1;
const selTabel = (teks) => teks.slice(1, -1).split('|').map((s) => s.trim());
const adalahPerataan = (sel) => sel.length > 0 && sel.every((s) => /^:?-+:?$/.test(s));

// ---------- Kepala surat ----------

const tulisKepala = (doc, header) => {
  const baris = String(header || '').split('\n').filter((b) => b.trim());
  if (!baris.length) return;
  const pakaiLogo = baris[0].trim() === '[[logo]]';
  const isi = pakaiLogo ? baris.slice(1) : baris;
  const huruf = JENIS_HURUF.times;
  const kiri = MARGIN.left - 12;
  const kanan = doc.page.width - MARGIN.right + 12;
  const logo = pakaiLogo ? ambilLogo() : null;
  const lebarLogo = 82;
  const yAwal = doc.y;

  let xTeks = kiri;
  if (pakaiLogo) {
    if (logo) doc.image(logo, kiri, yAwal + 4, { width: lebarLogo, height: lebarLogo });
    else doc.rect(kiri, yAwal + 4, lebarLogo, lebarLogo).dash(3, { space: 3 }).stroke().undash();
    xTeks = kiri + lebarLogo + 8;
  }
  const lebarTeksKop = kanan - xTeks;
  doc.y = yAwal;
  isi.forEach((mentah, i) => {
    const b = bacaBaris(mentah);
    // Template lama tanpa logo: baris pertama tebal, ukuran menurun.
    const ukuran = b.ukuran || (pakaiLogo ? 12 : i === 0 ? 14 : i === 1 ? 12 : 9);
    const teks = !pakaiLogo && i === 0 && !b.teks.includes('**') ? `**${b.teks}**` : b.teks;
    tulisMarkah(doc, huruf, ukuran, teks, { x: xTeks, y: doc.y, lebar: lebarTeksKop, rata: b.rata || 'center' });
  });
  const y = Math.max(doc.y, pakaiLogo ? yAwal + lebarLogo + 4 : 0) + 4;
  doc.moveTo(kiri, y).lineTo(kanan, y).lineWidth(2.5).stroke();
  doc.lineWidth(1);
  doc.x = MARGIN.left;
  doc.y = y + 22;
};

// ---------- Isi surat ----------

// lebarLabelPerJorok: lebar kolom label untuk tiap jorokan, dihitung dari seluruh isi surat, sehingga
// titik dua sejajar juga antarkelompok yang jorokannya sama (seperti contoh surat resmi).
const tulisKelompokLabel = (doc, huruf, kelompok, lebarArea, lebarLabelPerJorok) => {
  kelompok.forEach((k) => {
    const lebarLabel = lebarLabelPerJorok[k.jorok];
    const lebarTitikDua = doc.font(huruf.biasa).fontSize(k.ukuran).widthOfString(': ');
    const xLabel = MARGIN.left + k.jorok;
    const xNilai = xLabel + lebarLabel + lebarTitikDua;
    const lebarNilai = MARGIN.left + lebarArea - xNilai;
    const tinggi = Math.max(tinggiTeks(doc, huruf, k.ukuran, k.nilai, lebarNilai), tinggiTeks(doc, huruf, k.ukuran, k.label, lebarLabel));
    pastikanRuang(doc, tinggi);
    const y = doc.y;
    tulisMarkah(doc, huruf, k.ukuran, k.label, { x: xLabel, y, lebar: lebarLabel });
    doc.font(huruf.biasa).fontSize(k.ukuran).text(':', xLabel + lebarLabel, y, { lineBreak: false });
    tulisMarkah(doc, huruf, k.ukuran, k.nilai, { x: xNilai, y, lebar: lebarNilai });
    if (k.kanan) tulisMarkah(doc, huruf, k.ukuran, k.kanan, { x: MARGIN.left, y, lebar: lebarArea, rata: 'right' });
    doc.y = y + tinggi;
  });
  doc.x = MARGIN.left;
};

// jorok > 0: tabel menjorok sama besar dari kiri dan kanan (seperti contoh Surat Pengunduran Diri).
const tulisTabel = (doc, huruf, barisTabel, lebarAreaPenuh, ukuran, jorok = 0) => {
  const lebarArea = lebarAreaPenuh - jorok * 2;
  const semua = barisTabel.map(selTabel);
  const perataan = semua.length > 1 && adalahPerataan(semua[1]) ? semua.splice(1, 1)[0] : [];
  const jumlahKolom = Math.max(...semua.map((s) => s.length));
  const pad = 6;
  const alami = Array.from({ length: jumlahKolom }, (_, k) => Math.max(...semua.map((s, r) => (
    lebarTeks(doc, huruf, ukuran, r === 0 ? `**${s[k] || ''}**` : s[k] || '') + pad * 2
  ))));
  const total = alami.reduce((a, b) => a + b, 0);
  const lebar = alami.map((l) => (total > lebarArea ? (l / total) * lebarArea : l + (lebarArea - total) * (l / total)));
  const rataKolom = (k) => {
    const s = perataan[k] || '';
    if (s.startsWith(':') && s.endsWith(':')) return 'center';
    if (s.endsWith(':')) return 'right';
    return 'left';
  };

  semua.forEach((sel, r) => {
    const teksSel = (k) => (r === 0 ? `**${sel[k] || ''}**` : sel[k] || '');
    const tinggi = Math.max(...lebar.map((l, k) => tinggiTeks(doc, huruf, ukuran, teksSel(k), l - pad * 2))) + pad * 1.4;
    pastikanRuang(doc, tinggi);
    const y = doc.y;
    let x = MARGIN.left + jorok;
    lebar.forEach((l, k) => {
      doc.rect(x, y, l, tinggi).lineWidth(0.8).stroke();
      tulisMarkah(doc, huruf, ukuran, teksSel(k), { x: x + pad, y: y + pad * 0.7, lebar: l - pad * 2, rata: r === 0 ? 'center' : rataKolom(k) });
      x += l;
    });
    doc.y = y + tinggi;
  });
  doc.x = MARGIN.left;
  doc.moveDown(0.3);
};

const adalahMarkahBaru = (teks) => /^(\[\d{1,2}\]|\^|>|\||\[\[)/.test(teks) || /\*\*|__|::/.test(teks);

// Pengaturan isi surat: [[huruf helvetica]] (jenis huruf) dan [[ukuran 11]] (ukuran huruf isi dan kaki,
// 8 sampai 14). Baris pengaturan dibuang dari isi. huruf.ukuran = ukuran bawaan baris tanpa [n].
const bacaPengaturan = (semua) => {
  let huruf = JENIS_HURUF.times;
  let ukuran = UKURAN_ISI;
  const baris = semua.filter((b) => {
    const cocokHuruf = b.trim().match(/^\[\[huruf\s+(\w+)\]\]$/i);
    if (cocokHuruf) { huruf = JENIS_HURUF[cocokHuruf[1].toLowerCase()] || huruf; return false; }
    const cocokUkuran = b.trim().match(/^\[\[ukuran\s+(\d{1,2})\]\]$/i);
    if (cocokUkuran) { ukuran = Math.min(14, Math.max(8, Number(cocokUkuran[1]))); return false; }
    return true;
  });
  return { huruf: { ...huruf, ukuran }, baris };
};

const bacaLabel = (mentah, ukuranBawaan) => {
  const b = bacaBaris(mentah);
  const [kiri, kanan] = b.teks.split(/\s+>>\s+/);
  if (!mentah.trim() || adalahTabel(b.teks) || !kiri.includes('::')) return null;
  const pisah = kiri.indexOf('::');
  return { label: kiri.slice(0, pisah).trim(), nilai: kiri.slice(pisah + 2).trim(), kanan, ukuran: b.ukuran || ukuranBawaan, jorok: b.jorok };
};

const tulisIsi = (doc, huruf, baris) => {
  const lebarArea = doc.page.width - MARGIN.left - MARGIN.right;
  const lebarLabelPerJorok = {};
  baris.map((b) => bacaLabel(b, huruf.ukuran)).filter(Boolean).forEach((k) => {
    const lebar = lebarTeks(doc, huruf, k.ukuran, k.label) + 10;
    lebarLabelPerJorok[k.jorok] = Math.max(lebarLabelPerJorok[k.jorok] || 0, lebar);
  });
  let i = 0;

  // Template lama: baris pertama berhuruf kapital = judul.
  const pertama = (baris[0] || '').trim();
  if (pertama && !adalahMarkahBaru(pertama) && pertama === pertama.toUpperCase() && /[A-Z]/.test(pertama)) {
    tulisMarkah(doc, huruf, huruf.ukuran, `__**${pertama}**__`, { x: MARGIN.left, y: doc.y, lebar: lebarArea, rata: 'center' });
    i = 1;
    if (/^nomor/i.test((baris[1] || '').trim())) {
      tulisMarkah(doc, huruf, huruf.ukuran, baris[1].trim(), { x: MARGIN.left, y: doc.y, lebar: lebarArea, rata: 'center' });
      i = 2;
    }
    doc.moveDown(1);
  }

  while (i < baris.length) {
    const mentah = baris[i];
    if (!mentah.trim()) { doc.moveDown(0.8); i += 1; continue; }
    const b = bacaBaris(mentah);
    const ukuran = b.ukuran || huruf.ukuran;

    if (adalahTabel(b.teks)) {
      const kumpulan = [];
      while (i < baris.length && adalahTabel(baris[i].trim())) { kumpulan.push(baris[i].trim()); i += 1; }
      tulisTabel(doc, huruf, kumpulan, lebarArea, ukuran, b.jorok);
      continue;
    }

    const [kiri, kanan] = b.teks.split(/\s+>>\s+/);
    if (bacaLabel(mentah, huruf.ukuran)) {
      const kelompok = [];
      while (i < baris.length && bacaLabel(baris[i], huruf.ukuran)) { kelompok.push(bacaLabel(baris[i], huruf.ukuran)); i += 1; }
      tulisKelompokLabel(doc, huruf, kelompok, lebarArea, lebarLabelPerJorok);
      continue;
    }

    const lebar = lebarArea - b.jorok;
    pastikanRuang(doc, tinggiTeks(doc, huruf, ukuran, kiri, lebar));
    const y = doc.y;
    tulisMarkah(doc, huruf, ukuran, kiri, { x: MARGIN.left + b.jorok, y, lebar, rata: b.rata || 'justify' });
    const yAkhir = doc.y;
    if (kanan) tulisMarkah(doc, huruf, ukuran, kanan, { x: MARGIN.left, y, lebar: lebarArea, rata: 'right' });
    doc.y = Math.max(yAkhir, doc.y);
    doc.x = MARGIN.left;
    i += 1;
  }
};

// ---------- Kaki surat ----------

const gambarQr = (doc, qr, x, y) => {
  const sisi = TINGGI_TTD;
  doc.image(qr.png, x, y, { width: sisi, height: sisi });
  if (qr.keterangan) {
    doc.font('Helvetica').fontSize(7).text(qr.keterangan, x + sisi + 6, y + 4, { width: LEBAR_BLOK_TTD - sisi - 6 });
  }
};

const gambarFoto = (doc, foto, x, y) => {
  if (foto) {
    doc.image(foto, x, y, { fit: [FOTO.lebar, FOTO.tinggi], align: 'center', valign: 'center' });
  } else {
    doc.save().rect(x, y, FOTO.lebar, FOTO.tinggi).dash(3, { space: 3 }).lineWidth(0.8).stroke().undash().restore();
    doc.font('Helvetica').fontSize(8).fillColor('#64748b')
      .text('Pas foto 3 x 4', x, y + FOTO.tinggi / 2 - 4, { width: FOTO.lebar, align: 'center' });
    doc.fillColor('#000');
  }
};

const tulisKaki = (doc, footer, { qr, foto, huruf }) => {
  const baris = String(footer || '').split('\n');
  const kosong = baris.findIndex((b) => !b.trim());
  const blok = (kosong === -1 ? baris : baris.slice(0, kosong)).filter((b) => b.trim());
  const keterangan = kosong === -1 ? [] : baris.slice(kosong + 1).filter((b) => b.trim());
  const xKanan = doc.page.width - MARGIN.right - LEBAR_BLOK_TTD;
  const lebarKiri = xKanan - MARGIN.left - 10;
  const adaTtd = blok.some((b) => b.trim() === '[[ttd]]');
  // Perkiraan tinggi blok tanda tangan agar tidak terpotong di pergantian halaman.
  const barisTeks = blok.filter((b) => !['[[ttd]]', '[[foto]]'].includes(b.trim())).length;
  const adaFoto = blok.some((b) => b.trim() === '[[foto]]');
  const perkiraanTinggi = Math.max(
    barisTeks * (huruf.ukuran + 3) + (adaTtd ? TINGGI_TTD + 6 : 0) + (qr && !adaTtd ? TINGGI_TTD + 20 : 0),
    adaFoto ? FOTO.tinggi + 3 * (huruf.ukuran + 3) : 0,
  ) + keterangan.length * 10 + 20;

  doc.moveDown(1.5);
  pastikanRuang(doc, perkiraanTinggi);
  // Foto tidak menggeser baris tanda tangan; keterangan di bawahnya dimulai setelah batas bawah foto.
  let batasBawahFoto = 0;

  blok.forEach((mentah) => {
    const teks = mentah.trim();
    if (teks === '[[foto]]') {
      gambarFoto(doc, foto, xKanan - FOTO.lebar - 18, doc.y + 4);
      batasBawahFoto = doc.y + 4 + FOTO.tinggi;
      return;
    }
    if (teks === '[[ttd]]') {
      const y = doc.y + 2;
      if (qr?.png) gambarQr(doc, qr, xKanan, y);
      doc.y = y + TINGGI_TTD + 4;
      return;
    }
    const b = bacaBaris(mentah);
    const ukuran = b.ukuran || huruf.ukuran;
    // Tiap kolom boleh punya ukuran huruf sendiri di awalnya, misalnya "kiri || [8] catatan kecil".
    const kolom = (teks) => {
      if (!teks) return null;
      const k = bacaBaris(teks);
      return { teks: k.teks, ukuran: k.ukuran || ukuran, rata: k.rata };
    };
    const [kiri, kanan] = b.teks.includes('||') ? b.teks.split('||').map((s) => kolom(s.trim())) : [null, kolom(b.teks)];
    const y = doc.y;
    let yAkhir = y;
    if (kiri?.teks) {
      tulisMarkah(doc, huruf, kiri.ukuran, kiri.teks, { x: MARGIN.left, y, lebar: lebarKiri });
      yAkhir = doc.y;
    }
    if (kanan?.teks) tulisMarkah(doc, huruf, kanan.ukuran, kanan.teks, { x: xKanan, y, lebar: LEBAR_BLOK_TTD, rata: kanan.rata || b.rata || 'left' });
    doc.y = Math.max(yAkhir, doc.y);
  });

  // Template lama tanpa [[ttd]]: QR di bawah blok tanda tangan.
  if (!adaTtd) {
    if (qr?.png) {
      doc.moveDown(0.5);
      const y = doc.y;
      doc.image(qr.png, xKanan, y, { width: 90, height: 90 });
      if (qr.keterangan) doc.font('Helvetica').fontSize(7).text(qr.keterangan, xKanan, y + 94, { width: LEBAR_BLOK_TTD });
    } else {
      doc.moveDown(3);
    }
  }

  if (keterangan.length) {
    doc.moveDown(1.5);
    doc.y = Math.max(doc.y, batasBawahFoto + 10);
    doc.font('Helvetica-Oblique').fontSize(8).fillColor('#475569');
    keterangan.forEach((teks) => doc.text(bacaBaris(teks).teks, MARGIN.left, doc.y, { width: doc.page.width - MARGIN.left - MARGIN.right, align: 'center' }));
    doc.fillColor('#000');
  }
};

const tandaAirDraf = (doc) => {
  const { width, height } = doc.page;
  doc.save();
  doc.rotate(-35, { origin: [width / 2, height / 2] });
  doc.fillColor('#94a3b8').fillOpacity(0.15).font('Helvetica-Bold').fontSize(120)
    .text('DRAF', 0, height / 2 - 60, { width, align: 'center', lineBreak: false });
  doc.restore();
  doc.fillColor('#000').fillOpacity(1);
};

// Mengembalikan Promise<Buffer> berisi PDF.
const buatPdfSurat = ({ header, isi, footer, draf = false, qr = null, foto = null, judul = 'Surat' }) => new Promise((resolve, reject) => {
  // bufferPages: tanda air digambar paling akhir di setiap halaman, agar tidak menggeser posisi
  // atau ukuran huruf isi surat (PDFKit menyimpan posisi dan font sebagai state dokumen).
  const doc = new PDFDocument({ size: 'A4', margins: MARGIN, bufferPages: true, info: { Title: judul, Producer: 'Layanan Kemahasiswaan FTI' } });
  const potongan = [];
  doc.on('data', (chunk) => potongan.push(chunk));
  doc.on('end', () => resolve(Buffer.concat(potongan)));
  doc.on('error', reject);
  try {
    const { huruf, baris } = bacaPengaturan(String(isi || '').split('\n'));
    tulisKepala(doc, header);
    tulisIsi(doc, huruf, baris);
    tulisKaki(doc, footer, { qr, foto, huruf });
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
