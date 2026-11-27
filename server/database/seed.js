// Seed data awal untuk pengembangan dan pengujian: 8 jenis layanan, syaratnya, satu template per
// layanan, penanda tangan uji, dan akun uji untuk 5 peran. Jalankan dari folder server: npm run seed
//
// - Semua data akun PALSU (nama, NIM/NIP, email @contoh.test). Jangan ganti dengan data asli mahasiswa.
// - Kata sandi akun uji diambil dari SEED_PASSWORD di server/.env, tidak pernah ditulis di repo.
// - Aman dijalankan berulang: data yang sudah ada tidak ditimpa (termasuk template yang sudah disunting
//   staf dan kata sandi akun). Tidak ada baris yang dihapus.
// - Sumber daftar layanan dan syarat: docs/persyaratan-layanan.md. Bila dokumen itu berubah, ubah juga di sini.
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../src/config/db');
const { KEPALA_SURAT, KAKI_SURAT } = require('../src/utils/templateSurat');
const { TEMPLATE_RESMI } = require('./templateResmi');

const TIPE_FILE = 'pdf,jpg,png';

// Kepala dan kaki surat bawaan dipakai bersama dengan server (src/utils/templateSurat.js).
const pembuka = (judul) => `${judul}\nNomor: {{no_surat}}\n\nDekan Fakultas Teknologi Informasi Universitas Andalas dengan ini menerangkan bahwa:\n\nNama: {{nama}}\nNIM: {{nim}}\nProgram Studi: {{prodi}}\n\n`;

const LAYANAN = [
  {
    kode: 'AKTIF-PRIBADI',
    nama: 'Surat Keterangan Aktif Kuliah (Keperluan Pribadi)',
    deskripsi: 'Keterangan status aktif kuliah untuk keperluan mahasiswa sendiri, misalnya beasiswa.',
    syarat: [
      ['KRS semester berjalan yang sudah ditandatangani Pembimbing Akademik', 1],
    ],
    // Template: database/templateResmi.js
  },
  {
    kode: 'AKTIF-ORTU',
    nama: 'Surat Keterangan Aktif Kuliah (Keperluan Orang Tua)',
    deskripsi: 'Keterangan status aktif kuliah untuk keperluan orang tua, misalnya tunjangan, Taspen, atau BPJS.',
    syarat: [
      ['KRS semester berjalan yang sudah ditandatangani Pembimbing Akademik', 1],
      ['SK terbaru orang tua (wajib bila orang tua berstatus PNS)', 0],
    ],
    // Template: database/templateResmi.js
  },
  {
    kode: 'KET-LULUS',
    nama: 'Surat Keterangan Lulus',
    deskripsi: 'Keterangan telah lulus sidang atau ujian komprehensif, sebelum ijazah terbit.',
    syarat: [
      ['Surat pengantar departemen yang menyatakan sudah lulus sidang atau ujian komprehensif', 1],
      ['Bukti kliring fakultas sudah selesai', 1],
      ['Bukti terdaftar di wisuda.unand.ac.id', 1],
      // Ditempel ke surat ([[foto]] di template); hanya gambar agar bisa dicetak di PDF.
      ['Pas foto 3x4', 1, 'jpg,png'],
    ],
    // Template: database/templateResmi.js
  },
  {
    kode: 'TIDAK-BEASISWA',
    nama: 'Surat Keterangan Tidak Menerima Beasiswa',
    deskripsi: 'Pernyataan bahwa mahasiswa tidak sedang menerima beasiswa dari sumber lain.',
    // Formulir pernyataan diunduh dari sistem (sudah terisi data), ditandatangani di atas meterai, lalu
    // diunggah sebagai PDF. Nama syarat harus sama dengan FORMULIR_MAHASISWA di src/utils/templateSurat.js.
    syarat: [
      ['Surat pernyataan bermeterai yang sudah ditandatangani (hasil pindai)', 1, 'pdf'],
    ],
    // Template: database/templateResmi.js
  },
  {
    kode: 'PENYESUAIAN-UKT',
    nama: 'Permohonan Penyesuaian UKT',
    deskripsi: 'Permohonan penyesuaian Uang Kuliah Tunggal. Khusus mahasiswa S1 mulai semester 3, hanya sekali selama masa studi.',
    syarat: [
      ['Surat keterangan masih kuliah', 1],
      ['Surat keterangan penghasilan orang tua atau surat keterangan tidak mampu dari lurah', 1],
      ['KTP orang tua atau wali', 1],
      ['Kartu Keluarga', 1],
      ['Tagihan listrik 2 bulan terakhir', 1],
      ['Foto rumah tampak depan, belakang, dan dalam (masing-masing 2 foto, digabung dalam satu berkas)', 1],
    ],
    isi: pembuka('SURAT PERMOHONAN PENYESUAIAN UANG KULIAH TUNGGAL') + 'mengajukan permohonan penyesuaian Uang Kuliah Tunggal dengan alasan: {{keperluan}}.\n\nBerkas pendukung telah dilampirkan melalui sistem layanan kemahasiswaan.',
  },
  {
    kode: 'PENGEMBALIAN-UKT',
    nama: 'Pengembalian UKT',
    deskripsi: 'Permohonan pengembalian pembayaran UKT setelah ada SK penyesuaian UKT.',
    syarat: [
      ['Bukti pembayaran UKT', 1],
      ['SK Rektor tentang penyesuaian UKT yang memuat nama pemohon', 1],
      ['Buku tabungan (halaman yang memuat nama dan nomor rekening)', 1],
    ],
    isi: 'SURAT PERMOHONAN PENGEMBALIAN UANG KULIAH TUNGGAL\nNomor: {{no_surat}}\n\nKepada Yth. Wakil Dekan II Fakultas Teknologi Informasi Universitas Andalas\n\nYang bertanda tangan di bawah ini:\n\nNama: {{nama}}\nNIM: {{nim}}\nProgram Studi: {{prodi}}\n\nmengajukan permohonan pengembalian Uang Kuliah Tunggal dengan alasan: {{keperluan}}.\n\nBerkas pendukung telah dilampirkan melalui sistem layanan kemahasiswaan.',
  },
  {
    kode: 'UNDUR-DIRI',
    nama: 'Pengunduran Diri atau Pindah Mahasiswa',
    deskripsi: 'Permohonan pengunduran diri sebagai mahasiswa Fakultas Teknologi Informasi.',
    syarat: [],
    // Template: database/templateResmi.js (surat pengantar fakultas kepada Wakil Rektor I)
  },
  {
    kode: 'KLIRING-WISUDA',
    nama: 'Pendaftaran Wisuda Online atau Kliring Fakultas',
    deskripsi: 'Kliring fakultas sebagai syarat pendaftaran wisuda.',
    syarat: [
      ['Surat keterangan lunas UKT dari Keuangan Rektorat', 1],
      ['Surat keterangan bebas perpustakaan Universitas Andalas', 1],
      ['Surat keterangan bebas ruang baca FTI dan laboratorium program studi', 1],
    ],
    isi: pembuka('SURAT KETERANGAN KLIRING FAKULTAS') + 'telah menyelesaikan seluruh kewajiban administrasi di Fakultas Teknologi Informasi Universitas Andalas dan dapat mendaftar wisuda.\n\nSurat keterangan ini dibuat untuk keperluan: {{keperluan}}.',
  },
];

// Penanda tangan uji (PALSU, migrasi 004). Nama dan NIP bukan pejabat sungguhan; staf mengganti dengan
// data pejabat yang berlaku lewat aplikasi. NIP berawalan 99 agar tidak sama dengan nomor asli.
const PENANDA_TANGAN = {
  kakor: { nama: 'Pejabat Uji Kepala Kantor, S.Kom', nip: '990000000000000101', pangkat_golongan: 'Penata Tk. I / III/d', jabatan: 'Kepala Kantor Sekretariat' },
  kasi: { nama: 'Pejabat Uji Kepala Seksi, S.E., M.M.', nip: '990000000000000102', pangkat_golongan: 'Penata Tk. I / III/d', jabatan: 'Kepala Seksi Umum & Akademik' },
  wadek1: { nama: 'Pejabat Uji Wakil Dekan I, M.T.', nip: '990000000000000103', pangkat_golongan: null, jabatan: 'Wakil Dekan I' },
  dekan: { nama: 'Pejabat Uji Dekan, M.T.', nip: '990000000000000104', pangkat_golongan: null, jabatan: 'Dekan' },
};

// Penanda tangan per layanan, mengikuti contoh surat resmi FTI: [kunci PENANDA_TANGAN, baris "atas nama"].
// Layanan yang belum punya template resmi (Penyesuaian UKT, Pengembalian UKT, Kliring/Wisuda) belum ditunjuk.
const PENUNJUKAN_TTD = {
  'AKTIF-PRIBADI': ['kakor', 'a.n. Wakil Dekan I'],
  'AKTIF-ORTU': ['kasi', 'a.n. Wakil Dekan I'],
  'KET-LULUS': ['dekan', null],
  'TIDAK-BEASISWA': ['wadek1', null],
  'UNDUR-DIRI': ['wadek1', 'a.n. Dekan'],
};

// Akun uji (palsu). NIP berawalan 99 agar tidak sama dengan nomor asli.
// NIM mengikuti struktur NIM FTI (utils/nim.js: tahun masuk, 1 = S1, 15 = FTI) dengan nomor urut 99xxx yang palsu;
// angkatan harus sama dengan dua digit pertama NIM.
const AKUN = [
  { identifier: '2311599001', nama: 'Mahasiswa Uji Satu', email: 'mahasiswa1@contoh.test', role: 'mahasiswa', prodi: 'Sistem Informasi', jenjang: 'S1', angkatan: 2023, no_hp: '080000000001', is_active: 1 },
  { identifier: '2611599002', nama: 'Mahasiswa Uji Dua', email: 'mahasiswa2@contoh.test', role: 'mahasiswa', prodi: 'Teknik Komputer', jenjang: 'S1', angkatan: 2026, no_hp: '080000000002', is_active: 1 },
  { identifier: '2211599003', nama: 'Mahasiswa Uji Nonaktif', email: 'mahasiswa3@contoh.test', role: 'mahasiswa', prodi: 'Informatika', jenjang: 'S1', angkatan: 2022, no_hp: '080000000003', is_active: 0 },
  // Angkatan 2018 sudah melewati 14 semester: login ditolak sampai staf memberi perpanjangan (migrasi 007).
  { identifier: '1811599004', nama: 'Mahasiswa Uji Lewat Masa Studi', email: 'mahasiswa4@contoh.test', role: 'mahasiswa', prodi: 'Sistem Informasi', jenjang: 'S1', angkatan: 2018, no_hp: '080000000004', is_active: 1 },
  { identifier: '990000000000000001', nama: 'Staf Akademik Uji', email: 'staf@contoh.test', role: 'staf', is_active: 1 },
  { identifier: '990000000000000005', nama: 'Staf Akademik Uji Pintasan', email: 'staf-pintasan@contoh.test', role: 'staf', is_active: 1 },
  { identifier: '990000000000000002', nama: 'Kepala Kantor Uji', email: 'kakor@contoh.test', role: 'kakor', is_active: 1 },
  { identifier: '990000000000000003', nama: 'Wakil Dekan 1 Uji', email: 'wadek1@contoh.test', role: 'wadek1', is_active: 1 },
  { identifier: '990000000000000004', nama: 'Dekan Uji', email: 'dekan@contoh.test', role: 'dekan', is_active: 1 },
];

// Seed butuh kolom dari migrasi 002 sampai 005; beri pesan jelas bila belum dijalankan.
const pastikanMigrasi = async (conn) => {
  const [kolomNomor] = await conn.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'template_surat' AND COLUMN_NAME = 'format_nomor'`
  );
  if (!kolomNomor.length) throw new Error('Kolom template_surat.format_nomor belum ada. Jalankan migrasi 005 lebih dulu.');
  const [kolomTtd] = await conn.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'jenis_layanan' AND COLUMN_NAME IN ('penanda_tangan_id', 'atas_nama')`
  );
  if (kolomTtd.length < 2) {
    throw new Error('Tabel penanda_tangan dan kolom jenis_layanan.penanda_tangan_id belum ada. Jalankan migrasi 004 lebih dulu.');
  }
  const [kolom] = await conn.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME IN ('is_active', 'jenjang', 'angkatan')`
  );
  if (kolom.length < 3) {
    throw new Error('Kolom users.is_active/jenjang/angkatan belum ada. Jalankan migrasi 002 dan 003 lebih dulu.');
  }
};

const seedLayanan = async (conn) => {
  let layananBaru = 0;
  let syaratBaru = 0;
  let templateBaru = 0;

  for (const layanan of LAYANAN) {
    const [hasil] = await conn.query(
      'INSERT IGNORE INTO jenis_layanan (kode_layanan, nama_layanan, deskripsi, is_active) VALUES (?, ?, ?, 1)',
      [layanan.kode, layanan.nama, layanan.deskripsi]
    );
    layananBaru += hasil.affectedRows;
    const [[{ id }]] = await conn.query('SELECT id FROM jenis_layanan WHERE kode_layanan = ?', [layanan.kode]);

    // syarat_layanan tidak punya kunci unik; cek berdasarkan nama agar tidak dobel saat dijalankan ulang.
    // [nama syarat, wajib, tipe file (opsional, bawaan TIPE_FILE)]
    for (const [namaSyarat, wajib, tipeFile = TIPE_FILE] of layanan.syarat) {
      const [hasilSyarat] = await conn.query(
        `INSERT INTO syarat_layanan (jenis_layanan_id, nama_syarat, tipe_file, is_required)
         SELECT ?, ?, ?, ? FROM DUAL
         WHERE NOT EXISTS (SELECT 1 FROM syarat_layanan WHERE jenis_layanan_id = ? AND nama_syarat = ?)`,
        [id, namaSyarat, tipeFile, wajib, id, namaSyarat]
      );
      syaratBaru += hasilSyarat.affectedRows;
    }

    // Satu template per layanan (kunci unik jenis_layanan_id); template yang sudah ada tidak ditimpa.
    // Layanan yang punya contoh surat resmi memakai database/templateResmi.js. Untuk database yang sudah
    // berjalan, perbarui lewat: npm run template:resmi
    const resmi = TEMPLATE_RESMI[layanan.kode];
    const [hasilTemplate] = await conn.query(
      'INSERT IGNORE INTO template_surat (jenis_layanan_id, header_surat, body_template, footer_surat, format_nomor) VALUES (?, ?, ?, ?, ?)',
      resmi ? [id, resmi.header, resmi.isi, resmi.footer, resmi.formatNomor || null] : [id, KEPALA_SURAT, layanan.isi, KAKI_SURAT, null]
    );
    templateBaru += hasilTemplate.affectedRows;
  }

  console.log(`Jenis layanan baru: ${layananBaru}, syarat baru: ${syaratBaru}, template baru: ${templateBaru}`);
};

// Penanda tangan uji dan penunjukannya. Yang sudah ada tidak ditimpa: penanda tangan dicari lewat NIP,
// dan layanan yang sudah punya penanda tangan (mungkin diatur staf) tidak diubah.
const seedPenandaTangan = async (conn) => {
  let baru = 0;
  let ditunjuk = 0;
  const idTtd = {};
  for (const [kunci, pt] of Object.entries(PENANDA_TANGAN)) {
    const [hasil] = await conn.query(
      'INSERT IGNORE INTO penanda_tangan (nama, nip, pangkat_golongan, jabatan) VALUES (?, ?, ?, ?)',
      [pt.nama, pt.nip, pt.pangkat_golongan, pt.jabatan]
    );
    baru += hasil.affectedRows;
    const [[{ id }]] = await conn.query('SELECT id FROM penanda_tangan WHERE nip = ?', [pt.nip]);
    idTtd[kunci] = id;
  }
  for (const [kode, [kunci, atasNama]] of Object.entries(PENUNJUKAN_TTD)) {
    const [hasil] = await conn.query(
      'UPDATE jenis_layanan SET penanda_tangan_id = ?, atas_nama = ? WHERE kode_layanan = ? AND penanda_tangan_id IS NULL',
      [idTtd[kunci], atasNama, kode]
    );
    ditunjuk += hasil.affectedRows;
  }
  console.log(`Penanda tangan uji baru: ${baru}, layanan yang baru ditunjuk penanda tangannya: ${ditunjuk}`);
};

const seedAkun = async (conn, kataSandi) => {
  const hash = await bcrypt.hash(kataSandi, 10);
  let akunBaru = 0;
  for (const akun of AKUN) {
    // Akun dengan NIM/NIP atau email yang sama tidak ditimpa. Bila yang ada ternyata akun lain
    // (misalnya akun uji lama buatan manual), beri tahu agar tidak dikira gagal login.
    const [[lama]] = await conn.query(
      'SELECT identifier, email, role FROM users WHERE identifier = ? OR email = ? LIMIT 1',
      [akun.identifier, akun.email]
    );
    if (lama) {
      if (lama.identifier !== akun.identifier || lama.email !== akun.email || lama.role !== akun.role) {
        console.warn(`PERINGATAN: akun uji ${akun.email} (${akun.role}) dilewati karena NIM/NIP atau email-nya sudah dipakai akun lain. Akun yang sudah ada tidak diubah.`);
      }
      continue;
    }
    const [hasil] = await conn.query(
      `INSERT IGNORE INTO users (identifier, nama, email, password, role, prodi, jenjang, angkatan, no_hp, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [akun.identifier, akun.nama, akun.email, hash, akun.role, akun.prodi || null, akun.jenjang || null,
        akun.angkatan || null, akun.no_hp || null, akun.is_active]
    );
    akunBaru += hasil.affectedRows;
  }
  console.log(`Akun uji baru: ${akunBaru} dari ${AKUN.length} (akun yang sudah ada tidak diubah)`);
};

const main = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seed data uji tidak boleh dijalankan saat NODE_ENV=production.');
  }
  const kataSandi = process.env.SEED_PASSWORD || '';
  if (kataSandi.length < 8) {
    throw new Error('Isi SEED_PASSWORD di server/.env (minimal 8 karakter) untuk kata sandi akun uji.');
  }

  const conn = await db.getConnection();
  try {
    await pastikanMigrasi(conn);
    await conn.beginTransaction();
    await seedLayanan(conn);
    await seedPenandaTangan(conn);
    await seedAkun(conn, kataSandi);
    await conn.commit();
    console.log('Seed selesai.');
  } catch (error) {
    await conn.rollback().catch(() => {});
    throw error;
  } finally {
    conn.release();
  }
};

main()
  .catch((error) => {
    console.error('Seed gagal:', error.message);
    process.exitCode = 1;
  })
  .finally(() => db.end());
