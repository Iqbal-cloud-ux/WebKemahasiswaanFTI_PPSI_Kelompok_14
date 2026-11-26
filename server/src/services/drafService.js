// Penyusunan draf surat oleh Staf Akademik (#81, #82): isi template diisi data pengajuan,
// staf boleh menyunting, menyimpan (sekaligus membuat PDF draf), lalu meneruskan ke Kepala Kantor.
// Draf disimpan di surat_resmi (status_draf, isi_draf, file_draf_path), lihat docs/alur-status.md.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const Layanan = require('../models/layananModel');
const Pengajuan = require('../models/pengajuanModel');
const { LogAktivitas } = require('../models/logModel');
const { buatPdfSurat } = require('./pdfService');
const { ubahStatus, TAHAP_PIMPINAN } = require('./statusService');
const { denganTransaksi } = require('../utils/transaksi');
const { semesterAkademik } = require('../utils/semester');
const { bentukNomor } = require('../utils/nomorSurat');
const { GalatAplikasi } = require('../utils/galat');
const {
  isiVariabel, variabelTidakDikenal, bersihkanNilai, nilaiPenandaTangan, memakaiPenandaTangan, nilaiIsianSurat,
  penandaIsiStaf, PENANDA_ISI_STAF, FORMULIR_MAHASISWA, KEPERLUAN_TETAP, validasiDataIsian, formatTanggalIndonesia,
} = require('../utils/templateSurat');
const User = require('../models/userModel');
const db = require('../config/db');

const FOLDER_UPLOADS = path.resolve(__dirname, '../../uploads');
const FOLDER_SURAT = path.join(FOLDER_UPLOADS, 'letters');
const ISI_MAKS = 20000;
// Status pengajuan yang draf-nya tampil di halaman Draf Surat.
const STATUS_DRAF = ['diverifikasi', ...TAHAP_PIMPINAN];
// Pengganti variabel yang baru diisi saat surat terbit.
// Bila format nomor sudah diatur, nomor tampil dengan [urut], misalnya B/[urut]/UN.16.15/KM.00.00/2026.
const penandaDraf = (template) => ({
  no_surat: template.format_nomor ? bentukNomor(template.format_nomor, '[urut]') : '[nomor surat diisi saat terbit]',
  tanggal: '[tanggal terbit]',
});

fs.mkdirSync(FOLDER_SURAT, { recursive: true });

// Nilai variabel template: data mahasiswa, isian tambahan layanan (pengajuan.data_isian), penanda
// [ISI OLEH STAF: ...] untuk variabel yang diisi staf, dan penanda tangan. Semua nilai dibersihkan.
const nilaiPengajuan = (pengajuan, penandaTangan = null, tanggal = new Date()) => {
  const { semester, tahunAkademik } = semesterAkademik(tanggal);
  return {
    ...penandaIsiStaf(),
    ...nilaiIsianSurat(pengajuan.layanan.kode_layanan, pengajuan.data_isian),
    nama: bersihkanNilai(pengajuan.mahasiswa.nama),
    nim: bersihkanNilai(pengajuan.mahasiswa.nim),
    prodi: bersihkanNilai(pengajuan.mahasiswa.prodi || '-'),
    jenjang: bersihkanNilai(pengajuan.mahasiswa.jenjang || ''),
    no_hp: bersihkanNilai(pengajuan.mahasiswa.no_hp || '-'),
    keperluan: bersihkanNilai(pengajuan.keperluan),
    semester_berjalan: semester,
    tahun_akademik: tahunAkademik,
    ...nilaiPenandaTangan(penandaTangan),
  };
};

// Catatan pengembalian terbaru dari pimpinan (persetujuan.status = 'returned'), bila ada.
const KOLOM_PENGEMBALIAN = `
  (SELECT ps.catatan FROM persetujuan ps WHERE ps.pengajuan_id = p.id AND ps.status = 'returned'
   ORDER BY ps.created_at DESC, ps.id DESC LIMIT 1) AS catatan_pengembalian,
  (SELECT ps.role_pimpinan FROM persetujuan ps WHERE ps.pengajuan_id = p.id AND ps.status = 'returned'
   ORDER BY ps.created_at DESC, ps.id DESC LIMIT 1) AS pengembali
`;

const daftarDraf = async () => {
  const [rows] = await db.query(
    `SELECT p.id, p.no_referensi, p.status, p.created_at, p.updated_at, j.nama_layanan, u.nama AS mahasiswa_nama,
       u.identifier AS mahasiswa_nim, s.status_draf, s.updated_at AS draf_updated_at, ${KOLOM_PENGEMBALIAN}
     FROM pengajuan p
     JOIN jenis_layanan j ON j.id = p.jenis_layanan_id
     JOIN users u ON u.id = p.mahasiswa_id
     LEFT JOIN surat_resmi s ON s.pengajuan_id = p.id
     WHERE p.status IN (?)
     ORDER BY p.updated_at, p.id`,
    [STATUS_DRAF]
  );
  return rows.map((row) => ({
    pengajuan_id: row.id,
    no_referensi: row.no_referensi,
    status: row.status,
    status_draf: row.status_draf || 'belum_dibuat',
    nama_layanan: row.nama_layanan,
    mahasiswa: { nama: row.mahasiswa_nama, nim: row.mahasiswa_nim },
    created_at: row.created_at,
    draf_updated_at: row.draf_updated_at,
    catatan_pengembalian: row.status_draf === 'dikembalikan' ? row.catatan_pengembalian : null,
    pengembali: row.status_draf === 'dikembalikan' ? row.pengembali : null,
  }));
};

const ambilSurat = async (executor, pengajuanId, kunci = false) => {
  const [[row]] = await executor.query(
    `SELECT id, status_draf, isi_draf, file_draf_path, penanda_tangan, updated_at FROM surat_resmi WHERE pengajuan_id = ?${kunci ? ' FOR UPDATE' : ''}`,
    [pengajuanId]
  );
  return row;
};

const ambilBahan = async (pengajuanId, executor = db) => {
  const pengajuan = await Pengajuan.cariDetail(pengajuanId, executor);
  if (!pengajuan) throw new GalatAplikasi('Pengajuan tidak ditemukan', 404);
  const template = await Layanan.ambilTemplate(pengajuan.layanan.id, executor);
  if (!template) throw new GalatAplikasi(`Layanan ${pengajuan.layanan.nama_layanan} belum punya template surat. Lengkapi di menu Jenis Layanan & Template`, 409);
  const penandaTangan = await Layanan.ambilPenandaTangan(pengajuan.layanan.id, executor);
  if (!penandaTangan && memakaiPenandaTangan(template.body_template, template.footer_surat)) {
    throw new GalatAplikasi(`Layanan ${pengajuan.layanan.nama_layanan} belum punya penanda tangan aktif. Tunjuk penanda tangan untuk layanan ini terlebih dahulu`, 409);
  }
  return { pengajuan, template, penandaTangan };
};

// Layanan berformulir (FORMULIR_MAHASISWA, misalnya Tidak Menerima Beasiswa): surat yang disetujui adalah pindaian
// pernyataan bermeterai yang diunggah mahasiswa dan sudah diperiksa staf. PDF draf = pindaian itu; isi draf hanya
// catatan dan tidak bisa disunting.
const formulirMahasiswa = (pengajuan) => FORMULIR_MAHASISWA[pengajuan.layanan.kode_layanan] || null;
const catatanFormulir = (namaSyarat) => `Surat ini berupa pernyataan bermeterai yang ditandatangani mahasiswa dan diunggah pada syarat "${namaSyarat}". PDF draf adalah hasil pindaian tersebut, sehingga isinya tidak disunting di sini.`;

const ambilPindaian = async (pengajuanId, namaSyarat, executor = db) => {
  const [[berkas]] = await executor.query(
    `SELECT b.file_path FROM berkas_pengajuan b JOIN syarat_layanan s ON s.id = b.syarat_layanan_id
     WHERE b.pengajuan_id = ? AND s.nama_syarat = ? ORDER BY b.id DESC LIMIT 1`,
    [pengajuanId, namaSyarat]
  );
  const lokasi = berkas && path.resolve(FOLDER_UPLOADS, berkas.file_path);
  if (!lokasi || !lokasi.startsWith(FOLDER_UPLOADS + path.sep) || !/.pdf$/i.test(lokasi)) {
    throw new GalatAplikasi(`Berkas "${namaSyarat}" (PDF) tidak ditemukan pada pengajuan ini`, 404);
  }
  return fs.promises.readFile(lokasi).catch(() => {
    throw new GalatAplikasi(`Berkas "${namaSyarat}" tidak ditemukan di server. Minta mahasiswa mengunggah ulang`, 404);
  });
};

// Detail draf untuk editor: isi tersimpan, atau isi template yang sudah diisi data pengajuan.
const ambilDraf = async (pengajuanId) => {
  const { pengajuan, template, penandaTangan } = await ambilBahan(pengajuanId);
  if (!STATUS_DRAF.includes(pengajuan.status)) {
    throw new GalatAplikasi('Draf hanya tersedia untuk pengajuan yang sudah diverifikasi', 409);
  }
  const surat = await ambilSurat(db, pengajuanId);
  const [[kembali]] = await db.query(
    `SELECT catatan, role_pimpinan, created_at FROM persetujuan WHERE pengajuan_id = ? AND status = 'returned'
     ORDER BY created_at DESC, id DESC LIMIT 1`,
    [pengajuanId]
  );
  return {
    pengajuan,
    status_draf: surat?.status_draf || 'belum_dibuat',
    isi_draf: formulirMahasiswa(pengajuan)
      ? catatanFormulir(formulirMahasiswa(pengajuan))
      : surat?.isi_draf ?? isiVariabel(template.body_template, nilaiPengajuan(pengajuan, penandaTangan)),
    // true = layanan berformulir: isi draf tidak bisa disunting; PDF draf adalah pindaian mahasiswa.
    formulir_mahasiswa: Boolean(formulirMahasiswa(pengajuan)),
    template: { header_surat: template.header_surat, footer_surat: template.footer_surat },
    ada_pdf: Boolean(surat?.file_draf_path),
    draf_updated_at: surat?.updated_at || null,
    pengembalian: surat?.status_draf === 'dikembalikan' && kembali ? kembali : null,
  };
};

const validasiIsi = (isi) => {
  const teks = typeof isi === 'string' ? isi.replace(/\r\n/g, '\n').trim() : '';
  if (!teks) throw new GalatAplikasi('Isi draf wajib diisi', 400);
  if (teks.length > ISI_MAKS) throw new GalatAplikasi(`Isi draf maksimal ${ISI_MAKS} karakter`, 400);
  const asing = variabelTidakDikenal(teks);
  if (asing.length > 0) throw new GalatAplikasi(`Variabel tidak dikenal di isi draf: ${asing.map((v) => `{{${v}}}`).join(', ')}`, 400);
  return teks;
};

// Pas foto untuk template yang memakai [[foto]] (misalnya Surat Keterangan Lulus): berkas pengajuan pertama
// yang syaratnya hanya menerima gambar (tipe_file tanpa pdf, misalnya 'jpg,png'). null bila tidak ada.
const ambilFoto = async (pengajuanId, template, executor = db) => {
  if (!`${template.body_template}\n${template.footer_surat}`.includes('[[foto]]')) return null;
  const [[berkas]] = await executor.query(
    `SELECT b.file_path FROM berkas_pengajuan b JOIN syarat_layanan s ON s.id = b.syarat_layanan_id
     WHERE b.pengajuan_id = ? AND s.tipe_file NOT LIKE '%pdf%' ORDER BY s.id, b.id LIMIT 1`,
    [pengajuanId]
  );
  if (!berkas) return null;
  const lokasi = path.resolve(FOLDER_UPLOADS, berkas.file_path);
  if (!lokasi.startsWith(FOLDER_UPLOADS + path.sep) || !/\.(jpg|png)$/i.test(lokasi)) return null;
  return fs.promises.readFile(lokasi).catch(() => null);
};

const pdfDraf = async ({ pengajuan, template, penandaTangan, isi }) => (formulirMahasiswa(pengajuan)
  ? ambilPindaian(pengajuan.id, formulirMahasiswa(pengajuan))
  : buatPdfSurat({
  header: template.header_surat,
  isi: isiVariabel(isiVariabel(isi, nilaiPengajuan(pengajuan, penandaTangan)), penandaDraf(template)),
  footer: isiVariabel(isiVariabel(template.footer_surat, nilaiPengajuan(pengajuan, penandaTangan)), penandaDraf(template)),
  foto: await ambilFoto(pengajuan.id, template),
  draf: true,
  judul: `Draf ${pengajuan.layanan.nama_layanan} ${pengajuan.no_referensi}`,
}));

// Pratinjau PDF dari isi yang belum disimpan (tidak menyimpan apa pun).
const pratinjauDraf = async (pengajuanId, isi) => {
  const bahan = await ambilBahan(pengajuanId);
  const teks = formulirMahasiswa(bahan.pengajuan) ? '' : validasiIsi(isi);
  return pdfDraf({ ...bahan, isi: teks });
};

// Menyimpan draf dan PDF-nya. Hanya saat pengajuan berstatus diverifikasi (belum diteruskan).
const simpanDraf = async (pengajuanId, isi, aktor) => {
  const { pengajuan, template, penandaTangan } = await ambilBahan(pengajuanId);
  // Layanan berformulir: isi draf selalu catatan tetap, apa pun yang dikirim.
  const teks = formulirMahasiswa(pengajuan) ? catatanFormulir(formulirMahasiswa(pengajuan)) : validasiIsi(isi);
  const pdf = await pdfDraf({ pengajuan, template, penandaTangan, isi: teks });
  // Salinan penanda tangan: dipakai lagi saat surat terbit agar surat tidak berubah bila pejabat berganti.
  const salinanTtd = penandaTangan ? JSON.stringify(penandaTangan) : null;
  const namaFile = `letters/draf-${pengajuanId}-${crypto.randomUUID()}.pdf`;
  await fs.promises.writeFile(path.join(FOLDER_UPLOADS, namaFile), pdf);

  let fileLama = null;
  try {
    await denganTransaksi(async (conn) => {
      const [[p]] = await conn.query('SELECT status FROM pengajuan WHERE id = ? FOR UPDATE', [pengajuanId]);
      if (p.status !== 'diverifikasi') {
        throw new GalatAplikasi('Draf tidak bisa diubah karena sedang dalam proses persetujuan pimpinan', 409);
      }
      const surat = await ambilSurat(conn, pengajuanId, true);
      fileLama = surat?.file_draf_path || null;
      await conn.query(
        `INSERT INTO surat_resmi (pengajuan_id, status_draf, isi_draf, file_draf_path, penanda_tangan) VALUES (?, 'dibuat', ?, ?, ?)
         ON DUPLICATE KEY UPDATE status_draf = 'dibuat', isi_draf = VALUES(isi_draf), file_draf_path = VALUES(file_draf_path),
           penanda_tangan = VALUES(penanda_tangan)`,
        [pengajuanId, teks, namaFile, salinanTtd]
      );
      await LogAktivitas.create({ userId: aktor.id, action: 'simpan_draf', description: `Menyimpan draf surat pengajuan ${pengajuan.no_referensi}`, ipAddress: aktor.ip }, conn);
    });
  } catch (error) {
    await fs.promises.unlink(path.join(FOLDER_UPLOADS, namaFile)).catch(() => {});
    throw error;
  }
  if (fileLama) await fs.promises.unlink(path.join(FOLDER_UPLOADS, fileLama)).catch(() => {});
  return { pengajuan_id: pengajuanId, status_draf: 'dibuat' };
};

// Meneruskan draf ke Kepala Kantor: diverifikasi -> pending_kakor, status_draf -> diteruskan.
const teruskanDraf = (pengajuanId, aktor) => denganTransaksi(async (conn) => {
  const surat = await ambilSurat(conn, pengajuanId, true);
  if (!surat?.isi_draf || !surat.file_draf_path) {
    throw new GalatAplikasi('Simpan draf terlebih dahulu sebelum meneruskan ke Kepala Kantor', 400);
  }
  // Bagian yang wajib diisi staf (misalnya periode wisuda) harus sudah diganti sebelum diteruskan.
  const belumDiisi = [...surat.isi_draf.matchAll(/\[ISI OLEH STAF:\s*([^\]]*)\]/g)].map((m) => m[1].trim());
  if (belumDiisi.length > 0 || surat.isi_draf.includes(PENANDA_ISI_STAF)) {
    throw new GalatAplikasi(`Lengkapi dulu bagian draf yang ditandai [ISI OLEH STAF]: ${belumDiisi.join(', ') || 'lihat isi draf'}. Simpan, lalu teruskan`, 400);
  }
  const hasil = await ubahStatus(conn, { pengajuanId, statusBaru: 'pending_kakor', aktor: { id: aktor.id, role: 'staf' }, ipAddress: aktor.ip });
  await conn.query("UPDATE surat_resmi SET status_draf = 'diteruskan' WHERE id = ?", [surat.id]);
  return { pengajuan_id: pengajuanId, no_referensi: hasil.no_referensi, status: hasil.status, status_draf: 'diteruskan' };
});

// Lokasi PDF draf tersimpan, untuk diunduh staf atau pimpinan.
const lokasiPdfDraf = async (pengajuanId) => {
  const surat = await ambilSurat(db, pengajuanId);
  if (!surat?.file_draf_path) throw new GalatAplikasi('Draf surat belum dibuat', 404);
  const lokasi = path.resolve(FOLDER_UPLOADS, surat.file_draf_path);
  if (!lokasi.startsWith(FOLDER_UPLOADS + path.sep)) throw new GalatAplikasi('Berkas draf tidak dapat dibuka', 400);
  if (!(await fs.promises.stat(lokasi).catch(() => null))?.isFile()) {
    throw new GalatAplikasi('Berkas PDF draf tidak ditemukan di server. Simpan ulang draf untuk membuatnya kembali', 404);
  }
  const [[p]] = await db.query('SELECT no_referensi FROM pengajuan WHERE id = ?', [pengajuanId]);
  return { lokasi, namaFile: `draf-${p.no_referensi}.pdf` };
};

// Formulir untuk layanan FORMULIR_MAHASISWA (misalnya Surat Pernyataan Tidak Menerima Beasiswa): PDF dari template
// layanan yang sudah terisi data profil mahasiswa dan isian yang ia ketik di formulir pengajuan. Tidak disimpan;
// mahasiswa mencetak, menempel meterai, menandatangani, memindai, lalu mengunggahnya sebagai berkas persyaratan.
// noHp: nomor yang sedang diketik di formulir pengajuan (bila sah), agar sama dengan yang nanti disimpan.
const buatFormulirMahasiswa = async (layananId, mahasiswaId, dataIsian, noHp) => {
  const layanan = await Layanan.cariAktif(layananId);
  if (!layanan) throw new GalatAplikasi('Layanan tidak ditemukan atau sedang tidak dibuka', 404);
  if (!FORMULIR_MAHASISWA[layanan.kode_layanan]) throw new GalatAplikasi('Layanan ini tidak memakai formulir unduhan', 400);
  const template = await Layanan.ambilTemplate(layanan.id);
  if (!template) throw new GalatAplikasi(`Layanan ${layanan.nama_layanan} belum punya template surat`, 409);
  const penandaTangan = await Layanan.ambilPenandaTangan(layanan.id);
  if (!penandaTangan && memakaiPenandaTangan(template.body_template, template.footer_surat)) {
    throw new GalatAplikasi(`Layanan ${layanan.nama_layanan} belum punya penanda tangan aktif. Hubungi Staf Akademik`, 409);
  }
  const mahasiswa = await User.findById(mahasiswaId);
  const pengajuan = {
    layanan: { id: layanan.id, kode_layanan: layanan.kode_layanan },
    keperluan: KEPERLUAN_TETAP[layanan.kode_layanan] || '',
    data_isian: validasiDataIsian(layanan.kode_layanan, dataIsian) || {},
    mahasiswa: {
      nama: mahasiswa.nama, nim: mahasiswa.identifier, prodi: mahasiswa.prodi, jenjang: mahasiswa.jenjang,
      no_hp: typeof noHp === 'string' && /^\+?[0-9][0-9 -]{7,18}$/.test(noHp.trim()) ? noHp.trim() : mahasiswa.no_hp,
    },
  };
  const nilai = nilaiPengajuan(pengajuan, penandaTangan);
  return buatPdfSurat({
    header: template.header_surat,
    isi: isiVariabel(template.body_template, nilai),
    footer: isiVariabel(template.footer_surat, nilai),
    judul: `Formulir ${layanan.nama_layanan}`,
  });
};

const tanggalLokalISO = (tanggal) => (
  `${tanggal.getFullYear()}-${String(tanggal.getMonth() + 1).padStart(2, '0')}-${String(tanggal.getDate()).padStart(2, '0')}`
);

const bacaSalinanPenandaTangan = (nilai) => {
  if (!nilai) return null;
  const salinan = typeof nilai === 'string' ? JSON.parse(nilai) : nilai;
  if (!salinan || typeof salinan !== 'object' || Array.isArray(salinan)) {
    throw new Error('Salinan penanda tangan pada draf tidak valid');
  }
  return salinan;
};

// Membuat PDF sumber untuk penerbitan. Formulir mahasiswa tetap memakai pindaian asli;
// surat lain dirender ulang tanpa tanda air DRAF dengan data terbit dan snapshot penanda tangan.
const siapkanPdfPenerbitan = async ({ pengajuanId, noSurat, tanggal, executor = db }) => {
  const pengajuan = await Pengajuan.cariDetail(pengajuanId, executor);
  if (!pengajuan) throw new GalatAplikasi('Pengajuan tidak ditemukan', 404);
  const template = await Layanan.ambilTemplate(pengajuan.layanan.id, executor);
  if (!template) throw new GalatAplikasi(`Layanan ${pengajuan.layanan.nama_layanan} belum punya template surat`, 409);

  const surat = await ambilSurat(executor, pengajuanId);
  if (!surat?.isi_draf || !surat.file_draf_path || surat.status_draf !== 'diteruskan') {
    throw new GalatAplikasi('Draf surat belum diteruskan sampai ke Dekan', 409);
  }

  const syaratFormulir = formulirMahasiswa(pengajuan);
  if (syaratFormulir) {
    return { pdfSumber: await ambilPindaian(pengajuanId, syaratFormulir, executor), formulir: true };
  }

  const penandaTangan = bacaSalinanPenandaTangan(surat.penanda_tangan);
  if (!penandaTangan && memakaiPenandaTangan(template.body_template, template.footer_surat)) {
    throw new GalatAplikasi('Salinan penanda tangan tidak ditemukan pada draf surat', 409);
  }
  const nilai = {
    ...nilaiPengajuan(pengajuan, penandaTangan, tanggal),
    no_surat: noSurat || '-',
    tanggal: formatTanggalIndonesia(tanggalLokalISO(tanggal)),
  };
  const isi = isiVariabel(surat.isi_draf, nilai);
  const footer = isiVariabel(template.footer_surat, nilai);
  const opsiPdf = {
    header: template.header_surat,
    isi,
    footer,
    foto: await ambilFoto(pengajuanId, template, executor),
    judul: `Surat ${pengajuan.layanan.nama_layanan} ${pengajuan.no_referensi}`,
  };
  return {
    pdfSumber: await buatPdfSurat(opsiPdf),
    formulir: false,
    buatPdfDenganQr: (qr) => buatPdfSurat({ ...opsiPdf, qr }),
  };
};

module.exports = {
  daftarDraf, ambilDraf, pratinjauDraf, simpanDraf, teruskanDraf, lokasiPdfDraf,
  buatFormulirMahasiswa, siapkanPdfPenerbitan,
};
