// Kelola jenis layanan, syarat dokumen, dan template surat oleh Staf Akademik (#79).
// Aturan penting:
// - Layanan yang sudah punya pengajuan tidak boleh dihapus (pengajuan ikut terhapus karena ON DELETE CASCADE);
//   nonaktifkan saja.
// - Syarat yang sudah dipakai berkas pengajuan tidak boleh dihapus (berkas mahasiswa ikut terhapus).
const { LogAktivitas } = require('../models/logModel');
const { denganTransaksi } = require('../utils/transaksi');
const { GalatAplikasi } = require('../utils/galat');
const { KEPALA_SURAT, KAKI_SURAT, isiBawaan, variabelTidakDikenal } = require('../utils/templateSurat');
const { validasiFormatNomor } = require('../utils/nomorSurat');

const POLA_KODE = /^[A-Z0-9-]{2,20}$/;
const TIPE_FILE = 'pdf,jpg,png';
const SYARAT_MAKS = 15;

const teks = (nilai) => (typeof nilai === 'string' ? nilai.trim() : '');

const validasiLayanan = (input) => {
  const kode = teks(input.kode_layanan).toUpperCase();
  const nama = teks(input.nama_layanan);
  const deskripsi = teks(input.deskripsi);
  if (!POLA_KODE.test(kode)) {
    throw new GalatAplikasi('Kode layanan 2–20 karakter, hanya huruf besar, angka, dan tanda hubung. Contoh: AKTIF-PRIBADI', 400);
  }
  if (nama.length < 3 || nama.length > 100) throw new GalatAplikasi('Nama layanan wajib diisi (3–100 karakter)', 400);
  if (deskripsi.length > 1000) throw new GalatAplikasi('Deskripsi maksimal 1000 karakter', 400);

  if (!Array.isArray(input.syarat)) throw new GalatAplikasi('Format daftar syarat tidak valid', 400);
  if (input.syarat.length > SYARAT_MAKS) throw new GalatAplikasi(`Syarat dokumen maksimal ${SYARAT_MAKS}`, 400);
  const syarat = input.syarat.map((item) => ({
    id: item?.id ? Number(item.id) : null,
    nama_syarat: teks(item?.nama_syarat),
    is_required: item?.is_required ? 1 : 0,
  }));
  const kosong = syarat.find((s) => s.nama_syarat.length < 3 || s.nama_syarat.length > 150);
  if (kosong) throw new GalatAplikasi('Nama setiap dokumen persyaratan wajib diisi (3–150 karakter)', 400);
  const nama2 = syarat.map((s) => s.nama_syarat.toLowerCase());
  if (new Set(nama2).size !== nama2.length) throw new GalatAplikasi('Ada nama dokumen persyaratan yang sama. Gunakan nama yang berbeda', 400);

  return { kode, nama, deskripsi, syarat };
};

const pastikanKodeUnik = async (conn, kode, kecualiId = 0) => {
  const [rows] = await conn.query('SELECT id FROM jenis_layanan WHERE kode_layanan = ? AND id <> ?', [kode, kecualiId]);
  if (rows.length > 0) throw new GalatAplikasi(`Kode layanan ${kode} sudah dipakai layanan lain`, 409);
};

const log = (conn, aktor, action, description) => LogAktivitas.create({
  userId: aktor.id, action, description, ipAddress: aktor.ip,
}, conn);

// Membuat layanan baru beserta syarat dan template bawaan.
const buatLayanan = (input, aktor) => {
  const data = validasiLayanan(input);
  return denganTransaksi(async (conn) => {
    await pastikanKodeUnik(conn, data.kode);
    const [hasil] = await conn.query(
      'INSERT INTO jenis_layanan (kode_layanan, nama_layanan, deskripsi, is_active) VALUES (?, ?, ?, 1)',
      [data.kode, data.nama, data.deskripsi || null]
    );
    const id = hasil.insertId;
    for (const s of data.syarat) {
      await conn.query(
        'INSERT INTO syarat_layanan (jenis_layanan_id, nama_syarat, tipe_file, is_required) VALUES (?, ?, ?, ?)',
        [id, s.nama_syarat, TIPE_FILE, s.is_required]
      );
    }
    await conn.query(
      'INSERT INTO template_surat (jenis_layanan_id, header_surat, body_template, footer_surat) VALUES (?, ?, ?, ?)',
      [id, KEPALA_SURAT, isiBawaan(data.nama), KAKI_SURAT]
    );
    await log(conn, aktor, 'tambah_layanan', `Menambah layanan ${data.kode} (${data.nama})`);
    return { id };
  });
};

// Mengubah layanan dan menyamakan daftar syarat: syarat dengan id diubah, tanpa id ditambah,
// yang tidak dikirim lagi dihapus (bila belum dipakai berkas pengajuan).
const ubahLayanan = (id, input, aktor) => {
  const data = validasiLayanan(input);
  return denganTransaksi(async (conn) => {
    const [[lama]] = await conn.query('SELECT id FROM jenis_layanan WHERE id = ? FOR UPDATE', [id]);
    if (!lama) throw new GalatAplikasi('Layanan tidak ditemukan', 404);
    await pastikanKodeUnik(conn, data.kode, id);
    await conn.query(
      'UPDATE jenis_layanan SET kode_layanan = ?, nama_layanan = ?, deskripsi = ? WHERE id = ?',
      [data.kode, data.nama, data.deskripsi || null, id]
    );

    const [syaratAda] = await conn.query(
      `SELECT s.id, s.nama_syarat, (SELECT COUNT(*) FROM berkas_pengajuan b WHERE b.syarat_layanan_id = s.id) AS dipakai
       FROM syarat_layanan s WHERE s.jenis_layanan_id = ?`,
      [id]
    );
    const idAda = new Map(syaratAda.map((s) => [s.id, s]));
    const idDikirim = new Set(data.syarat.filter((s) => s.id).map((s) => s.id));
    if ([...idDikirim].some((sid) => !idAda.has(sid))) throw new GalatAplikasi('Ada syarat yang bukan milik layanan ini', 400);

    const dihapus = syaratAda.filter((s) => !idDikirim.has(s.id));
    const terpakai = dihapus.filter((s) => s.dipakai > 0);
    if (terpakai.length > 0) {
      throw new GalatAplikasi(
        `Syarat berikut sudah dipakai berkas pengajuan dan tidak bisa dihapus: ${terpakai.map((s) => s.nama_syarat).join(', ')}. Ubah namanya atau jadikan tidak wajib.`,
        409
      );
    }
    for (const s of dihapus) await conn.query('DELETE FROM syarat_layanan WHERE id = ?', [s.id]);
    for (const s of data.syarat) {
      if (s.id) {
        await conn.query('UPDATE syarat_layanan SET nama_syarat = ?, is_required = ? WHERE id = ?', [s.nama_syarat, s.is_required, s.id]);
      } else {
        await conn.query(
          'INSERT INTO syarat_layanan (jenis_layanan_id, nama_syarat, tipe_file, is_required) VALUES (?, ?, ?, ?)',
          [id, s.nama_syarat, TIPE_FILE, s.is_required]
        );
      }
    }
    await log(conn, aktor, 'ubah_layanan', `Mengubah layanan ${data.kode} (${data.nama})`);
    return { id };
  });
};

const ubahStatusLayanan = (id, aktif, aktor) => denganTransaksi(async (conn) => {
  const [[layanan]] = await conn.query('SELECT id FROM jenis_layanan WHERE id = ? FOR UPDATE', [id]);
  if (!layanan) throw new GalatAplikasi('Layanan tidak ditemukan', 404);
  await conn.query('UPDATE jenis_layanan SET is_active = ? WHERE id = ?', [aktif ? 1 : 0, id]);
  await log(conn, aktor, 'ubah_status_layanan', `Layanan #${id} ${aktif ? 'diaktifkan' : 'dinonaktifkan'}`);
  return { id, is_active: Boolean(aktif) };
});

const hapusLayanan = (id, aktor) => denganTransaksi(async (conn) => {
  const [[layanan]] = await conn.query('SELECT id, kode_layanan FROM jenis_layanan WHERE id = ? FOR UPDATE', [id]);
  if (!layanan) throw new GalatAplikasi('Layanan tidak ditemukan', 404);
  const [[{ jumlah }]] = await conn.query('SELECT COUNT(*) AS jumlah FROM pengajuan WHERE jenis_layanan_id = ?', [id]);
  if (jumlah > 0) {
    throw new GalatAplikasi(`Layanan ini sudah punya ${jumlah} pengajuan dan tidak bisa dihapus. Nonaktifkan saja agar tidak menerima pengajuan baru.`, 409);
  }
  await conn.query('DELETE FROM jenis_layanan WHERE id = ?', [id]);
  await log(conn, aktor, 'hapus_layanan', `Menghapus layanan ${layanan.kode_layanan}`);
  return { id };
});

const simpanTemplate = (id, input, aktor) => {
  const header = teks(input.header_surat);
  const body = teks(input.body_template);
  const footer = teks(input.footer_surat);
  if (!body) throw new GalatAplikasi('Isi template wajib diisi', 400);
  if (body.length > 20000 || header.length > 2000 || footer.length > 2000) {
    throw new GalatAplikasi('Template terlalu panjang (isi maks. 20.000 karakter, kepala dan kaki maks. 2.000)', 400);
  }
  const asing = variabelTidakDikenal(`${header}\n${body}\n${footer}`);
  if (asing.length > 0) {
    throw new GalatAplikasi(`Variabel tidak dikenal: ${asing.map((v) => `{{${v}}}`).join(', ')}. Gunakan variabel yang tersedia`, 400);
  }
  const formatNomor = validasiFormatNomor(input.format_nomor);
  return denganTransaksi(async (conn) => {
    const [[layanan]] = await conn.query('SELECT kode_layanan FROM jenis_layanan WHERE id = ?', [id]);
    if (!layanan) throw new GalatAplikasi('Layanan tidak ditemukan', 404);
    await conn.query(
      `INSERT INTO template_surat (jenis_layanan_id, header_surat, body_template, footer_surat, format_nomor) VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE header_surat = VALUES(header_surat), body_template = VALUES(body_template),
         footer_surat = VALUES(footer_surat), format_nomor = VALUES(format_nomor)`,
      [id, header || null, body, footer || null, formatNomor]
    );
    await log(conn, aktor, 'ubah_template', `Mengubah template surat layanan ${layanan.kode_layanan}`);
    return { id };
  });
};

// Nomor urut surat terakhir tahun berjalan (satu urutan untuk semua surat). Surat berikutnya memakai nomor ini + 1.
const ambilNomorUrut = async (executor) => {
  const tahun = new Date().getFullYear();
  const [[row]] = await executor.query('SELECT nomor_terakhir FROM nomor_surat_urut WHERE tahun = ?', [tahun]);
  return { tahun, nomor_terakhir: row ? row.nomor_terakhir : 0 };
};

// Staf mengatur nomor urut terakhir tahun berjalan, misalnya agar melanjutkan nomor dari buku agenda manual.
const aturNomorUrut = (input, aktor) => {
  const nomor = Number(input.nomor_terakhir);
  if (input.nomor_terakhir === '' || !Number.isInteger(nomor) || nomor < 0 || nomor > 999999) {
    throw new GalatAplikasi('Nomor urut terakhir harus bilangan bulat 0 sampai 999999', 400);
  }
  return denganTransaksi(async (conn) => {
    const lama = await ambilNomorUrut(conn);
    await conn.query(
      `INSERT INTO nomor_surat_urut (tahun, nomor_terakhir) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE nomor_terakhir = VALUES(nomor_terakhir)`,
      [lama.tahun, nomor]
    );
    await log(conn, aktor, 'ubah_nomor_urut', `Mengubah nomor urut surat terakhir tahun ${lama.tahun} dari ${lama.nomor_terakhir} menjadi ${nomor}`);
    return { tahun: lama.tahun, nomor_terakhir: nomor };
  });
};

module.exports = {
  buatLayanan, ubahLayanan, ubahStatusLayanan, hapusLayanan, simpanTemplate, ambilNomorUrut, aturNomorUrut,
};
