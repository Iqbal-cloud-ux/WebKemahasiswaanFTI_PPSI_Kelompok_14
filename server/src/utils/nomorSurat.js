// Nomor surat resmi (migrasi 005). Format diatur Staf Akademik per jenis layanan (template_surat.format_nomor),
// misalnya "B/{urut}/UN.16.15/KM.00.00/{tahun}". Nomor urut memakai satu urutan bersama untuk semua surat,
// mulai dari 1 setiap tahun (tabel nomor_surat_urut). Nomor diberikan saat Dekan menyetujui.
const { GalatAplikasi } = require('./galat');
const { LAYANAN_TANPA_NOMOR } = require('./templateSurat');

const PENANDA_NOMOR = {
  urut: 'Nomor urut surat (satu urutan untuk semua surat, mulai dari 1 setiap tahun)',
  tahun: 'Tahun terbit, misalnya 2026',
  bulan: 'Bulan terbit dalam angka Romawi, misalnya XI',
};
const POLA_PENANDA = /\{([a-z_]+)\}/g;
const FORMAT_MAKS = 150;
const ROMAWI = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

// Mengembalikan format yang sudah dirapikan, atau null bila kosong. Melempar galat bila tidak valid.
const validasiFormatNomor = (format) => {
  const teks = typeof format === 'string' ? format.trim() : '';
  if (!teks) return null;
  if (teks.length > FORMAT_MAKS) throw new GalatAplikasi(`Format nomor surat maksimal ${FORMAT_MAKS} karakter`, 400);
  if (/[\r\n]/.test(teks)) throw new GalatAplikasi('Format nomor surat harus satu baris', 400);
  const asing = [...teks.matchAll(POLA_PENANDA)].map((m) => m[1]).filter((p) => !PENANDA_NOMOR[p]);
  if (asing.length) {
    throw new GalatAplikasi(`Penanda tidak dikenal di format nomor surat: ${asing.map((p) => `{${p}}`).join(', ')}. Gunakan {urut}, {tahun}, atau {bulan}`, 400);
  }
  if (!teks.includes('{urut}')) throw new GalatAplikasi('Format nomor surat wajib memuat {urut} agar setiap surat bernomor berbeda', 400);
  return teks;
};

// urut boleh berupa teks (misalnya "[urut]" untuk pratinjau draf).
const bentukNomor = (format, urut, tanggal = new Date()) => String(format).replace(POLA_PENANDA, (asli, nama) => {
  if (nama === 'urut') return String(urut);
  if (nama === 'tahun') return String(tanggal.getFullYear());
  if (nama === 'bulan') return ROMAWI[tanggal.getMonth()];
  return asli;
});

// Mengambil nomor urut berikutnya untuk tahun itu dan langsung menandainya terpakai. Wajib dipanggil di
// dalam transaksi penerbitan surat: baris tahun terkunci sampai transaksi selesai, sehingga dua surat
// yang terbit bersamaan tidak mendapat nomor sama; bila penerbitan gagal (rollback), nomor tidak terbuang.
const ambilNomorUrut = async (conn, tahun) => {
  await conn.query(
    `INSERT INTO nomor_surat_urut (tahun, nomor_terakhir) VALUES (?, 1)
     ON DUPLICATE KEY UPDATE nomor_terakhir = nomor_terakhir + 1`,
    [tahun]
  );
  const [[row]] = await conn.query('SELECT nomor_terakhir FROM nomor_surat_urut WHERE tahun = ?', [tahun]);
  return row.nomor_terakhir;
};

// Nomor surat lengkap untuk penerbitan (#91): format layanan + nomor urut berikutnya.
// kodeLayanan di LAYANAN_TANPA_NOMOR (misalnya TIDAK-BEASISWA) mengembalikan null tanpa memakai nomor urut;
// untuk surat seperti itu, QR memuat nomor pengajuan (no_referensi) dan hash.
const buatNomorSurat = async (conn, formatNomor, tanggal = new Date(), kodeLayanan = null) => {
  if (kodeLayanan && LAYANAN_TANPA_NOMOR.includes(kodeLayanan)) return null;
  if (!formatNomor) {
    throw new GalatAplikasi('Format nomor surat untuk layanan ini belum diatur. Minta Staf Akademik mengisinya di menu Jenis Layanan & Template', 409);
  }
  const urut = await ambilNomorUrut(conn, tanggal.getFullYear());
  return bentukNomor(formatNomor, urut, tanggal);
};

module.exports = { PENANDA_NOMOR, validasiFormatNomor, bentukNomor, ambilNomorUrut, buatNomorSurat };
