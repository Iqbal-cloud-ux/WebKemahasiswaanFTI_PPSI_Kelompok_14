// Template surat yang mengikuti contoh surat resmi FTI Unand (diterima 25 November 2026).
// Dipakai oleh seed (database baru) dan oleh perbaruiTemplateResmi.js (database yang sudah berjalan).
// Aturan penulisan ([[logo]], ::, **, [[ttd]], dan seterusnya) dijelaskan di docs/data.md dan
// server/src/services/pdfService.js. Variabel {{...}} terdaftar di server/src/utils/templateSurat.js.
//
// Isi di sini hanya kerangka dan teks tetap. Jangan menyalin nama, NIM, NIP, tanda tangan, atau stempel
// dari contoh surat resmi; semua data orang diisi lewat variabel.
// Layanan yang belum punya contoh surat resmi (Penyesuaian UKT, Pengembalian UKT, Kliring/Wisuda)
// sengaja tidak ada di sini.

// Kop surat FTI. Pemenggalan nama kementerian berbeda antarcontoh surat resmi, jadi dua baris pertama
// bisa diberikan per template. Bawaan: sesuai contoh Surat Keterangan Aktif Kuliah (Keperluan Pribadi).
// telp = true menambahkan nomor telepon fakultas di baris kontak (seperti contoh Surat Keterangan Lulus).
const kopFti = (baris1 = 'KEMENTERIAN PENDIDIKAN TINGGI,', baris2 = 'SAINS DAN TEKNOLOGI', { telp = false } = {}) => [
  '[[logo]]',
  `[18] ${baris1}`,
  `[18] ${baris2}`,
  '[15] UNIVERSITAS ANDALAS',
  '[14] **FAKULTAS TEKNOLOGI INFORMASI**',
  '[14] Kampus Universitas Andalas, Limau Manis, Padang - 25163',
  telp
    ? '[11] *Telp: 0751-9824667 website:* *__http://fti.unand.ac.id__* *email:* *__sekretariat@it.unand.ac.id__*'
    : '[12] *website:* *__http://fti.unand.ac.id__* *email:* *__sekretariat@it.unand.ac.id__*',
].join('\n');
const KOP_FTI = kopFti();

// Kalimat pengesahan mengikuti AGENTS.md aturan 4: jangan menyebut "tersertifikasi" atau "berkekuatan hukum".
const KETERANGAN_PENGESAHAN = [
  'Dokumen ini disahkan melalui persetujuan elektronik beserta kode verifikasi.',
  'Keaslian dokumen dapat diperiksa dengan memindai kode QR pada surat ini.',
];

// Blok tanda tangan satu pejabat di kanan: tanggal, "atas nama" (dihapus bila kosong), jabatan,
// ruang tanda tangan/QR, nama tebal, NIP.
const KAKI_PEJABAT = [
  'Padang, {{tanggal}}',
  '{{ttd_atas_nama}}',
  '{{ttd_jabatan}}',
  '[[ttd]]',
  '**{{ttd_nama}}**',
  'NIP {{ttd_nip}}',
  '',
  ...KETERANGAN_PENGESAHAN,
].join('\n');

const TEMPLATE_RESMI = {
  // 1. Surat Keterangan Aktif Kuliah (Keperluan Pribadi). Keperluan diisi mahasiswa.
  'AKTIF-PRIBADI': {
    // Format nomor awal sesuai pola di contoh surat resmi; staf bisa mengubahnya di menu Jenis Layanan & Template.
    formatNomor: 'B/{urut}/UN.16.15/KM.00.00/{tahun}',
    header: KOP_FTI,
    isi: [
      '[14] ^ __**SURAT  KETERANGAN**__',
      '^ Nomor : {{no_surat}}',
      '',
      'Yang bertanda tangan dibawah ini  :',
      '   1. Nama :: {{ttd_nama}}',
      '   2. NIP :: {{ttd_nip}}',
      '   3. Pangkat/gol :: {{ttd_pangkat}}',
      '   4. Jabatan :: {{ttd_jabatan}}',
      '   5. Fakultas :: Teknologi Informasi Universitas Andalas',
      '',
      'Dengan ini menyatakan dengan sesungguhnya bahwa :',
      '   6. Nama :: {{nama}}',
      '   7. NIM :: {{nim}}',
      '   8. Jurusan/Fakultas :: {{prodi}} / Teknologi Informasi',
      '   9. Semester :: {{semester_berjalan}}',
      '   10. Tahun Akademik :: {{tahun_akademik}}',
      '',
      'Yang bersangkutan benar mahasiswa Aktif Fakultas Teknologi Informasi.',
      'Surat aktif ini sebagai persyaratan {{keperluan}}.',
      '',
      'Demikian surat keterangan ini dibuat untuk dapat digunakan sebagaimana mestinya.',
    ].join('\n'),
    footer: KAKI_PEJABAT,
  },

  // 2. Surat Keterangan Aktif Kuliah (Keperluan Orang Tua). Data orang tua diisi mahasiswa (ISIAN_LAYANAN) dan
  //    keperluan tetap (KEPERLUAN_TETAP), keduanya di server/src/utils/templateSurat.js.
  'AKTIF-ORTU': {
    formatNomor: 'B/{urut}/UN.16.15.WD1/KM.00.00/{tahun}',
    header: kopFti('KEMENTERIAN PENDIDIKAN TINGGI, SAINS,', 'DAN TEKNOLOGI'),
    isi: [
      // Contoh resmi memakai huruf lebih kecil agar 16 baris data muat satu halaman.
      '[[ukuran 11]]',
      '[13] ^ __SURAT  KETERANGAN__',
      '^ Nomor : {{no_surat}}',
      '',
      'Yang bertanda tangan dibawah ini :',
      '   1. Nama :: {{ttd_nama}}',
      '   2. NIP :: {{ttd_nip}}',
      '   3. Pangkat/gol :: {{ttd_pangkat}}',
      '   4. Jabatan :: {{ttd_jabatan}}',
      '   5. Fakultas :: Teknologi Informasi Universitas Andalas',
      '',
      'Dengan ini menyatakan dengan sesungguhnya bahwa :',
      '   6. Nama :: {{nama}}',
      '   7. NIM :: {{nim}}',
      '   8. Departemen/Fakultas :: {{jenjang}} {{prodi}}',
      '   9. Semester :: {{semester_berjalan}}',
      '   10. Tahun Akademik :: {{tahun_akademik}}',
      '',
      'Dan bahwa orang Tua / Wali anak tersebut :',
      '   11. Nama :: {{ortu_nama}}',
      '   12. NIP/NRV/NOPEN :: {{ortu_nip}}',
      '   13. Pangkat / Gol/Jabatan :: {{ortu_pangkat}}',
      '   14. Unit Kerja :: {{ortu_unit_kerja}}',
      '   15. Instansi Induk :: {{ortu_instansi}}',
      '   16. Keterangan :: {{keperluan}}',
      '',
      'Yang bersangkutan adalah benar mahasiswa Aktif {{jenjang}} {{prodi}} Teknologi Informasi Universitas Andalas Padang',
      '',
      'Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.',
    ].join('\n'),
    footer: KAKI_PEJABAT,
  },

  // 3. Surat Keterangan Lulus. Huruf isi Arial (Helvetica) seperti contoh resmi; nama kementerian di kop
  //    memakai nama terbaru (keputusan 25 November 2026). Data kelulusan diisi mahasiswa (ISIAN_LAYANAN),
  //    periode wisuda diisi staf (VARIABEL_STAF), pas foto dari syarat "Pas foto 3x4" (JPG/PNG).
  'KET-LULUS': {
    formatNomor: 'T/{urut}/UN16.15.D/PK.05.00/{tahun}',
    header: kopFti('KEMENTERIAN PENDIDIKAN TINGGI, SAINS,', 'DAN TEKNOLOGI', { telp: true }),
    isi: [
      '[[huruf helvetica]]',
      '[[ukuran 11]]',
      '[12] ^ __**SURAT KETERANGAN LULUS**__',
      '^ **Nomor: {{no_surat}}**',
      '',
      '',
      'Dekan Fakultas Teknologi Informasi Universitas Andalas menerangkan bahwa:',
      '',
      '   Nama :: {{nama}}',
      '   Nomor Induk Mahasiswa :: {{nim}}',
      '   Tempat / Tanggal Lahir :: {{tempat_lahir}} / {{tanggal_lahir}}',
      '   Program Studi :: {{prodi}}',
      '   Alamat :: {{alamat}}',
      '',
      'adalah Mahasiswa Fakultas Teknologi Informasi Universitas Andalas yang **lulus ujian {{gelar_lulus}}**:',
      '',
      '    Tanggal :: {{tanggal_lulus}}',
      '    Jumlah Satuan Kredit Semester (SKS) :: {{sks}}',
      '    Indeks Prestasi Kumulatif (IPK) :: {{ipk}}',
      '    Predikat Lulus :: {{predikat}}',
      '',
      'Surat Keterangan Lulus ini diberikan kepada yang bersangkutan sambil menunggu **Ijazah dan Transkrip Nilai Akademik** yang masih dalam proses dan akan diserahkan pada saat Wisuda {{periode_wisuda}} Universitas Andalas.',
    ].join('\n'),
    footer: [
      'Padang, {{tanggal}}',
      '{{ttd_atas_nama}}',
      '{{ttd_jabatan}},',
      '[[foto]]',
      '[[ttd]]',
      '**__{{ttd_nama}}__**',
      '**NIP {{ttd_nip}}**',
      '',
      ...KETERANGAN_PENGESAHAN,
    ].join('\n'),
  },

  // 4. Surat Pernyataan Tidak Sedang Menerima Beasiswa dari Sumber Lain. Berbeda dengan surat lain, ini
  //    FORMULIR untuk mahasiswa (FORMULIR_MAHASISWA di templateSurat.js): diunduh sudah terisi data, dicetak,
  //    ditempel meterai, ditandatangani, dipindai, lalu diunggah sebagai PDF. Contoh resmi tidak bernomor.
  //    Tanggal "Padang," dibiarkan kosong untuk ditulis tangan, seperti contoh resmi. Kalimat pengesahan
  //    elektronik dan kode QR tidak dicetak di formulir; keduanya ditempel saat surat terbit (#95), di ruang
  //    kosong kolom kiri (Wakil Dekan I).
  'TIDAK-BEASISWA': {
    formatNomor: null,
    header: kopFti('KEMENTERIAN PENDIDIKAN TINGGI, SAINS,', 'DAN TEKNOLOGI', { telp: true }),
    isi: [
      '^ **SURAT PERNYATAAN**',
      '^ **TIDAK SEDANG MENERIMA BEASISWA DARI SUMBER LAIN**',
      '',
      '',
      'Yang bertanda tangan di bawah ini :',
      '  Nama :: {{nama}}',
      '  NIM :: {{nim}}',
      '  Jurusan :: {{prodi}}',
      '  Fakultas :: Teknologi Informasi',
      '  Alamat Rumah :: {{alamat_rumah}}',
      '  No. HP :: {{no_hp}}',
      '',
      'Dengan ini menyatakan bahwa saya tidak sedang menerima beasiswa dari Sumber/Lembaga/Instansi/Yayasan manapun.',
      'Surat pernyataan ini saya buat dengan sebenar-benarnya dan penuh kesadaran, tanpa paksaan dan tekanan dari pihak manapun. Saya bersedia mengembalikan dana beasiswa, menerima sanksi akademik maupun sanksi hukum apabila saya terbukti juga menerima beasiswa dari Sumber/Lembaga/Instansi/Yayasan manapun.',
      '',
      'Demikian, surat pernyataan ini saya buat sebagai persyaratan pengajuan Beasiswa {{nama_beasiswa}}',
      '',
      'Demikian surat rekomendasi ini dibuat untuk dapat digunakan sebagaimana mestinya.',
    ].join('\n'),
    footer: [
      ' || Padang,',
      'Mengetahui, || Yang Menyatakan,',
      '{{ttd_jabatan}}, || [8] *Tempel meterai Rp10.000, lalu tanda tangan*',
      '[[ttd]]',
      '{{ttd_nama}} || {{nama}}',
      'NIP {{ttd_nip}} || NIM. {{nim}}',
    ].join('\n'),
  },

  // 5. Surat Pengunduran Diri: surat pengantar fakultas kepada Wakil Rektor I (keputusan 25 November 2026),
  //    satu mahasiswa per pengajuan. Tanggal surat di kanan atas sejajar baris Nomor, seperti contoh resmi.
  'UNDUR-DIRI': {
    formatNomor: 'T/{urut}/UN16.15.D/KM.00.06/{tahun}',
    header: kopFti('KEMENTERIAN PENDIDIKAN TINGGI, SAINS,', 'DAN TEKNOLOGI'),
    isi: [
      'Nomor :: {{no_surat}} >> {{tanggal}}',
      'Lamp :: 1 Lembar',
      'Hal :: **Permohonan Pengunduran Diri**',
      '',
      '',
      'Yth. Wakil Rektor I',
      'Universitas Andalas',
      'Padang',
      '',
      '',
      'Dengan hormat,',
      'Sehubungan dengan surat Permohonan dari mahasiswa Fakultas Teknologi Informasi perihal Permohonan Pengunduran Diri mahasiswa yang tersebut di bawah ini :',
      '',
      '      | No | Nama | NIM | Program Studi |',
      '      |:-:|:--|:-:|:-:|',
      '      | 1. | {{nama}} | {{nim}} | {{prodi}} |',
      '',
      'Untuk itu mohon kiranya Bapak dapat memproses permohonan mahasiswa yang bersangkutan sesuai dengan aturan yang berlaku.',
      '',
      'Demikian disampaikan, atas perhatian dan kerjasama yang baik diucapkan terima kasih.',
    ].join('\n'),
    footer: [
      '{{ttd_atas_nama}}',
      '{{ttd_jabatan}},',
      '[[ttd]]',
      '{{ttd_nama}}',
      'NIP {{ttd_nip}}',
      '',
      ...KETERANGAN_PENGESAHAN,
    ].join('\n'),
  },
};

module.exports = { TEMPLATE_RESMI, KOP_FTI, kopFti, KAKI_PEJABAT, KETERANGAN_PENGESAHAN };
