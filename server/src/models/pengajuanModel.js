const db = require('../config/db');

const KOLOM_RINGKAS = `
  p.id, p.no_referensi, p.mahasiswa_id, p.status, p.keperluan, p.catatan_revisi, p.created_at, p.updated_at,
  j.id AS layanan_id, j.kode_layanan, j.nama_layanan
`;

const bentukRingkas = (row) => ({
  id: row.id,
  no_referensi: row.no_referensi,
  mahasiswa_id: row.mahasiswa_id,
  status: row.status,
  keperluan: row.keperluan,
  catatan_revisi: row.catatan_revisi,
  created_at: row.created_at,
  updated_at: row.updated_at,
  layanan: { id: row.layanan_id, kode_layanan: row.kode_layanan, nama_layanan: row.nama_layanan },
});

const Pengajuan = {
  // Nomor urut terakhir pada tahun itu. Dipanggil di dalam transaksi; FOR UPDATE mengunci
  // rentang nomor agar dua pengajuan bersamaan tidak mendapat nomor yang sama.
  nomorTerakhir: async (conn, awalan) => {
    const [[row]] = await conn.query(
      'SELECT no_referensi FROM pengajuan WHERE no_referensi LIKE ? ORDER BY no_referensi DESC LIMIT 1 FOR UPDATE',
      [`${awalan}%`]
    );
    return row ? Number(row.no_referensi.slice(awalan.length)) || 0 : 0;
  },

  buat: async (conn, { noReferensi, mahasiswaId, jenisLayananId, keperluan }) => {
    const [hasil] = await conn.query(
      `INSERT INTO pengajuan (no_referensi, mahasiswa_id, jenis_layanan_id, keperluan, status)
       VALUES (?, ?, ?, ?, 'diajukan')`,
      [noReferensi, mahasiswaId, jenisLayananId, keperluan]
    );
    return hasil.insertId;
  },

  // berkas: [{ syaratId, filePath, originalName }]
  tambahBerkas: async (conn, pengajuanId, berkas) => {
    if (berkas.length === 0) return;
    await conn.query(
      'INSERT INTO berkas_pengajuan (pengajuan_id, syarat_layanan_id, file_path, original_name) VALUES ?',
      [berkas.map((b) => [pengajuanId, b.syaratId, b.filePath, b.originalName])]
    );
  },

  daftarMilikMahasiswa: async (mahasiswaId, executor = db) => {
    const [rows] = await executor.query(
      `SELECT ${KOLOM_RINGKAS} FROM pengajuan p JOIN jenis_layanan j ON j.id = p.jenis_layanan_id
       WHERE p.mahasiswa_id = ? ORDER BY p.created_at DESC, p.id DESC`,
      [mahasiswaId]
    );
    return rows.map(bentukRingkas);
  },

  // Semua pengajuan untuk staf, beserta nama dan NIM mahasiswa. Penyaringan dilakukan di halaman.
  daftarSemua: async (executor = db) => {
    const [rows] = await executor.query(
      `SELECT ${KOLOM_RINGKAS}, u.nama AS mahasiswa_nama, u.identifier AS mahasiswa_nim
       FROM pengajuan p
       JOIN jenis_layanan j ON j.id = p.jenis_layanan_id
       JOIN users u ON u.id = p.mahasiswa_id
       ORDER BY p.created_at DESC, p.id DESC`
    );
    return rows.map((row) => ({ ...bentukRingkas(row), mahasiswa: { id: row.mahasiswa_id, nama: row.mahasiswa_nama, nim: row.mahasiswa_nim } }));
  },

  cariDetail: async (id, executor = db) => {
    const [[row]] = await executor.query(
      `SELECT ${KOLOM_RINGKAS}, u.nama AS mahasiswa_nama, u.identifier AS mahasiswa_nim, u.prodi AS mahasiswa_prodi,
         u.jenjang AS mahasiswa_jenjang, u.angkatan AS mahasiswa_angkatan
       FROM pengajuan p
       JOIN jenis_layanan j ON j.id = p.jenis_layanan_id
       JOIN users u ON u.id = p.mahasiswa_id
       WHERE p.id = ?`,
      [id]
    );
    if (!row) return undefined;
    return {
      ...bentukRingkas(row),
      mahasiswa: {
        id: row.mahasiswa_id,
        nama: row.mahasiswa_nama,
        nim: row.mahasiswa_nim,
        prodi: row.mahasiswa_prodi,
        jenjang: row.mahasiswa_jenjang,
        angkatan: row.mahasiswa_angkatan,
      },
    };
  },

  // Satu berkas beserta pemilik pengajuannya, untuk pemeriksaan hak akses sebelum dibuka.
  cariBerkas: async (berkasId, executor = db) => {
    const [[row]] = await executor.query(
      `SELECT b.id, b.pengajuan_id, b.file_path, b.original_name, s.nama_syarat, p.mahasiswa_id, p.no_referensi
       FROM berkas_pengajuan b
       JOIN syarat_layanan s ON s.id = b.syarat_layanan_id
       JOIN pengajuan p ON p.id = b.pengajuan_id
       WHERE b.id = ?`,
      [berkasId]
    );
    return row;
  },

  ubahVerifikasiBerkas: async (conn, berkasId, { statusVerifikasi, catatan }) => {
    await conn.query(
      'UPDATE berkas_pengajuan SET status_verifikasi = ?, catatan_verifikasi = ? WHERE id = ?',
      [statusVerifikasi, catatan || null, berkasId]
    );
  },

  // Daftar berkas tanpa file_path: lokasi di disk tidak perlu diketahui client.
  daftarBerkas: async (pengajuanId, executor = db) => {
    const [rows] = await executor.query(
      `SELECT b.id, b.syarat_layanan_id, s.nama_syarat, b.original_name, b.status_verifikasi, b.catatan_verifikasi, b.created_at
       FROM berkas_pengajuan b JOIN syarat_layanan s ON s.id = b.syarat_layanan_id
       WHERE b.pengajuan_id = ? ORDER BY s.id, b.id`,
      [pengajuanId]
    );
    return rows;
  },

  riwayat: async (pengajuanId, executor = db) => {
    const [rows] = await executor.query(
      `SELECT r.id, r.status_sebelumnya, r.status_baru, r.catatan, r.created_at, u.nama AS pelaku_nama, u.role AS pelaku_role
       FROM riwayat_status r LEFT JOIN users u ON u.id = r.user_id
       WHERE r.pengajuan_id = ? ORDER BY r.created_at, r.id`,
      [pengajuanId]
    );
    return rows;
  },
};

module.exports = Pengajuan;
