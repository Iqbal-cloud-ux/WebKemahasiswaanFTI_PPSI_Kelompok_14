// Template surat: variabel yang boleh dipakai, isi bawaan, dan pengisian variabel.
// Dipakai server (draf dan penerbitan surat) dan seed (database/seed.js).

// {{nama}}, {{nim}}, {{prodi}}, {{keperluan}} diisi saat draf dibuat dari data pengajuan.
// {{ttd_...}} diisi dari penanda tangan yang ditunjuk untuk layanan (tabel penanda_tangan, migrasi 004).
// {{no_surat}} dan {{tanggal}} baru diisi saat surat terbit (keputusan Dekan).
const { GalatAplikasi } = require('./galat');

const VARIABEL = {
  nama: 'Nama mahasiswa',
  nim: 'NIM mahasiswa',
  prodi: 'Program studi',
  jenjang: 'Jenjang studi mahasiswa, misalnya S1',
  no_hp: 'Nomor HP/WhatsApp mahasiswa (dari profil)',
  keperluan: 'Keperluan dari pengajuan',
  semester_berjalan: 'Semester berjalan saat draf dibuat: Ganjil atau Genap',
  tahun_akademik: 'Tahun akademik saat draf dibuat, misalnya 2026/2027',
  ttd_nama: 'Nama penanda tangan (beserta gelar)',
  ttd_nip: 'NIP penanda tangan',
  ttd_pangkat: 'Pangkat/golongan penanda tangan',
  ttd_jabatan: 'Jabatan penanda tangan',
  ttd_atas_nama: 'Baris "atas nama" di atas jabatan, misalnya a.n. Wakil Dekan I (boleh kosong)',
  no_surat: 'Nomor surat (diisi saat terbit)',
  tanggal: 'Tanggal terbit (diisi saat terbit)',
};
const VARIABEL_TERBIT = ['no_surat', 'tanggal'];

// Isian tambahan per layanan (kode_layanan), diisi mahasiswa saat mengajukan dan disimpan di
// pengajuan.data_isian (migrasi 004). Staf memeriksanya terhadap dokumen pendukung dan mengoreksi lewat
// isi draf. Setiap isian sekaligus menjadi variabel template {{nama}}. wajib bawaan true; maks = panjang maksimal.
// jenis 'tanggal' = diisi lewat kalender (YYYY-MM-DD), tidak boleh lewat hari ini, dicetak "24 April 2000".
// jenis 'angka' = hanya digit (misalnya SKS, NIP); jenis 'desimal' = digit dengan satu titik (misalnya IPK).
// Isian tidak wajib yang kosong dicetak "-".
// pola + pesanPola = pemeriksaan format (teks regex, agar bisa dikirim ke tampilan sebagai JSON).
const ISIAN_LAYANAN = {
  'AKTIF-ORTU': [
    { nama: 'ortu_nama', label: 'Nama orang tua/wali (beserta gelar bila ada)', maks: 150 },
    { nama: 'ortu_nip', label: 'NIP/NRV/NOPEN orang tua/wali', jenis: 'angka', maks: 30, petunjuk: 'Hanya angka' },
    { nama: 'ortu_pangkat', label: 'Pangkat/golongan/jabatan orang tua/wali', maks: 150, petunjuk: 'Contoh: Penata Tk. I / III/d. Isi tanda - bila tidak ada' },
    { nama: 'ortu_unit_kerja', label: 'Unit kerja orang tua/wali', maks: 150 },
    { nama: 'ortu_instansi', label: 'Instansi induk orang tua/wali', maks: 150 },
  ],
  'KET-LULUS': [
    { nama: 'tempat_lahir', label: 'Tempat lahir', maks: 100 },
    { nama: 'tanggal_lahir', label: 'Tanggal lahir', jenis: 'tanggal', maks: 10 },
    { nama: 'alamat', label: 'Alamat', maks: 200 },
    { nama: 'gelar_lulus', label: 'Ujian sarjana yang diluluskan', maks: 100, petunjuk: 'Contoh: Sarjana Komputer (S.Kom.) atau Sarjana Teknik (S.T.)' },
    { nama: 'tanggal_lulus', label: 'Tanggal lulus ujian', jenis: 'tanggal', maks: 10 },
    { nama: 'sks', label: 'Jumlah SKS', jenis: 'angka', maks: 3, pola: '^\\d{2,3}$', pesanPola: 'Jumlah SKS berupa angka, misalnya 147', petunjuk: 'Contoh: 147' },
    { nama: 'ipk', label: 'IPK', jenis: 'desimal', maks: 4, pola: '^(4\\.00?|4|[0-3](\\.\\d{1,2})?)$', pesanPola: 'IPK berupa angka 0 sampai 4.00 dengan titik, misalnya 3.45', petunjuk: 'Contoh: 3.45' },
    { nama: 'predikat', label: 'Predikat lulus', maks: 50, petunjuk: 'Sesuai transkrip, contoh: Sangat Memuaskan' },
  ],
  'TIDAK-BEASISWA': [
    { nama: 'alamat_rumah', label: 'Alamat rumah', maks: 200 },
    { nama: 'nama_beasiswa', label: 'Nama beasiswa yang diajukan', maks: 150, petunjuk: 'Contoh: Beasiswa ABC Tahun 2026' },
  ],
};

// Layanan yang suratnya berupa formulir untuk mahasiswa (keputusan 25 November 2026): mahasiswa mengunduh
// formulir yang sudah terisi datanya, mencetak, menempel meterai, menandatangani, memindai, lalu mengunggahnya
// sebagai PDF pada syarat bernama di bawah. Staf memeriksa isi dan kejelasan pindaian.
const FORMULIR_MAHASISWA = {
  'TIDAK-BEASISWA': 'Surat pernyataan bermeterai yang sudah ditandatangani (hasil pindai)',
};

// Layanan yang suratnya tidak bernomor, mengikuti contoh surat resmi (keputusan 26 November 2026).
// Saat terbit tidak mengambil nomor urut; surat_resmi.no_surat dibiarkan kosong.
const LAYANAN_TANPA_NOMOR = ['TIDAK-BEASISWA'];

// Variabel yang diisi staf langsung di isi draf (tidak diisi mahasiswa). Di draf baru muncul sebagai penanda
// [ISI OLEH STAF: ...]; draf tidak bisa diteruskan ke pimpinan selama penanda itu masih ada.
const VARIABEL_STAF = {
  periode_wisuda: 'Periode wisuda, misalnya V',
};
const PENANDA_ISI_STAF = '[ISI OLEH STAF:';
const penandaIsiStaf = () => Object.fromEntries(Object.entries(VARIABEL_STAF).map(([nama, arti]) => [nama, `${PENANDA_ISI_STAF} ${arti}]`]));

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
// "2000-04-24" -> "24 April 2000"; null bila bukan tanggal yang sah.
const formatTanggalIndonesia = (teks) => {
  const cocok = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(teks || ''));
  if (!cocok) return null;
  const [tahun, bulan, hari] = cocok.slice(1).map(Number);
  const tanggal = new Date(Date.UTC(tahun, bulan - 1, hari));
  if (tanggal.getUTCFullYear() !== tahun || tanggal.getUTCMonth() !== bulan - 1 || tanggal.getUTCDate() !== hari) return null;
  return `${hari} ${BULAN[bulan - 1]} ${tahun}`;
};

// Layanan dengan keperluan tetap: kolom Keperluan tidak ditampilkan ke mahasiswa dan diisi teks ini.
const KEPERLUAN_TETAP = {
  'AKTIF-ORTU': 'Untuk Mendapatkan Tunjangan Anak/Taspen/BPJS',
  'TIDAK-BEASISWA': 'Persyaratan pengajuan beasiswa',
};

Object.values(ISIAN_LAYANAN).flat().forEach((isian) => { VARIABEL[isian.nama] = `Isian mahasiswa: ${isian.label}`; });
Object.entries(VARIABEL_STAF).forEach(([nama, arti]) => { VARIABEL[nama] = `Diisi staf di isi draf: ${arti}`; });

// Memeriksa isian tambahan dari mahasiswa untuk satu layanan. masukan boleh objek atau teks JSON (FormData).
// Mengembalikan objek { nama: nilai } yang sudah dirapikan; isian yang tidak dikenal dibuang.
const validasiDataIsian = (kodeLayanan, masukan) => {
  const daftar = ISIAN_LAYANAN[kodeLayanan] || [];
  if (!daftar.length) return null;
  let data = masukan;
  if (typeof masukan === 'string') {
    try { data = JSON.parse(masukan || '{}'); } catch { throw new GalatAplikasi('Format isian data tambahan tidak valid', 400); }
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) data = {};
  const hasil = {};
  const kosong = [];
  for (const isian of daftar) {
    const nilai = typeof data[isian.nama] === 'string' ? data[isian.nama].replace(/\s+/g, ' ').trim() : '';
    if (!nilai && isian.wajib !== false) kosong.push(isian.label);
    if (nilai.length > isian.maks) throw new GalatAplikasi(`${isian.label} maksimal ${isian.maks} karakter`, 400);
    if (nilai && isian.jenis === 'tanggal') {
      if (!formatTanggalIndonesia(nilai)) throw new GalatAplikasi(`${isian.label} tidak valid. Pilih tanggal dari kalender`, 400);
      const kini = new Date();
      const hariIni = `${kini.getFullYear()}-${String(kini.getMonth() + 1).padStart(2, '0')}-${String(kini.getDate()).padStart(2, '0')}`;
      if (nilai > hariIni) throw new GalatAplikasi(`${isian.label} tidak boleh melewati hari ini`, 400);
    }
    if (nilai && isian.jenis === 'angka' && !/^\d+$/.test(nilai)) throw new GalatAplikasi(`${isian.label} hanya boleh berisi angka`, 400);
    if (nilai && isian.jenis === 'desimal' && !/^\d+(\.\d+)?$/.test(nilai)) {
      throw new GalatAplikasi(`${isian.label} hanya boleh berisi angka, dengan titik untuk desimal`, 400);
    }
    if (nilai && isian.pola && !new RegExp(isian.pola).test(nilai)) throw new GalatAplikasi(isian.pesanPola || `${isian.label} tidak valid`, 400);
    hasil[isian.nama] = nilai;
  }
  if (kosong.length) throw new GalatAplikasi(`Lengkapi isian berikut: ${kosong.join(', ')}`, 400, { isian_kurang: kosong });
  return hasil;
};

// Nilai isian untuk dicetak di surat: hanya isian yang terdaftar untuk layanan itu, tanggal ditulis
// "24 April 2000", dan semuanya dibersihkan dari tanda tata letak.
const nilaiIsianSurat = (kodeLayanan, data = {}) => Object.fromEntries((ISIAN_LAYANAN[kodeLayanan] || []).map((isian) => {
  const nilai = data[isian.nama] ?? '';
  if (!String(nilai).trim()) return [isian.nama, '-'];
  const tampil = isian.jenis === 'tanggal' ? (formatTanggalIndonesia(nilai) || nilai) : nilai;
  return [isian.nama, bersihkanNilai(tampil)];
}));
const POLA_VARIABEL = /\{\{\s*([a-z_]+)\s*\}\}/g;

// Nilai dari isian pengguna dibersihkan sebelum dimasukkan ke template, agar tidak bisa menambah baris
// atau tanda tata letak (lihat aturan penulisan di server/src/services/pdfService.js).
const bersihkanNilai = (nilai) => String(nilai ?? '')
  .replace(/\*|__|::|>>|\[\[|\]\]|\|/g, '')
  .replace(/\s+/g, ' ')
  .replace(/^(\s*(\^|>|\[\d{1,2}\]))+/, '')
  .trim();

// Variabel penanda tangan dari data penanda tangan ({ nama, nip, pangkat_golongan, jabatan, atas_nama }).
const nilaiPenandaTangan = (pt) => (pt ? {
  ttd_nama: bersihkanNilai(pt.nama),
  ttd_nip: bersihkanNilai(pt.nip || '-'),
  ttd_pangkat: bersihkanNilai(pt.pangkat_golongan || '-'),
  ttd_jabatan: bersihkanNilai(pt.jabatan),
  ttd_atas_nama: bersihkanNilai(pt.atas_nama || ''),
} : {});

const memakaiPenandaTangan = (...teks) => teks.some((t) => /\{\{\s*ttd_/.test(String(t || '')));

const KEPALA_SURAT = [
  'UNIVERSITAS ANDALAS',
  'FAKULTAS TEKNOLOGI INFORMASI',
  'Kampus Universitas Andalas, Limau Manis, Padang',
].join('\n');

// Kalimat pengesahan mengikuti AGENTS.md aturan 4: jangan menyebut "tersertifikasi" atau "berkekuatan hukum".
const KAKI_SURAT = [
  'Padang, {{tanggal}}',
  'Dekan Fakultas Teknologi Informasi',
  '',
  'Dokumen ini disahkan melalui persetujuan elektronik beserta kode verifikasi.',
  'Keaslian dokumen dapat diperiksa dengan memindai kode QR pada surat ini.',
].join('\n');

const isiBawaan = (namaLayanan) => [
  namaLayanan.toUpperCase(),
  'Nomor: {{no_surat}}',
  '',
  'Dekan Fakultas Teknologi Informasi Universitas Andalas dengan ini menerangkan bahwa:',
  '',
  'Nama: {{nama}}',
  'NIM: {{nim}}',
  'Program Studi: {{prodi}}',
  '',
  'adalah mahasiswa Fakultas Teknologi Informasi Universitas Andalas.',
  '',
  'Surat ini dibuat untuk keperluan: {{keperluan}}.',
].join('\n');

// Nama variabel di teks yang tidak dikenal (untuk validasi saat staf menyimpan template).
const variabelTidakDikenal = (teks = '') => [...new Set([...String(teks).matchAll(POLA_VARIABEL)].map((m) => m[1]))]
  .filter((nama) => !VARIABEL[nama]);

// Mengganti variabel yang ada di nilai; variabel lain dibiarkan apa adanya.
// Baris yang hanya berisi variabel dan semuanya bernilai kosong dihapus (misalnya {{ttd_atas_nama}} untuk
// surat yang ditandatangani Dekan langsung), agar tidak menjadi baris kosong yang mengubah tata letak.
const isiVariabel = (teks = '', nilai = {}) => String(teks).split('\n')
  .filter((baris) => {
    const nama = [...baris.matchAll(POLA_VARIABEL)].map((m) => m[1]);
    return !(nama.length && !baris.replace(POLA_VARIABEL, '').trim() && nama.every((n) => nilai[n] === ''));
  })
  .join('\n')
  .replace(POLA_VARIABEL, (asli, nama) => (
    nilai[nama] !== undefined && nilai[nama] !== null ? String(nilai[nama]) : asli
  ));

module.exports = {
  VARIABEL, VARIABEL_TERBIT, KEPALA_SURAT, KAKI_SURAT, isiBawaan, variabelTidakDikenal, isiVariabel,
  bersihkanNilai, nilaiPenandaTangan, memakaiPenandaTangan, ISIAN_LAYANAN, KEPERLUAN_TETAP, validasiDataIsian,
  nilaiIsianSurat, formatTanggalIndonesia, VARIABEL_STAF, PENANDA_ISI_STAF, penandaIsiStaf, FORMULIR_MAHASISWA, LAYANAN_TANPA_NOMOR,
};
