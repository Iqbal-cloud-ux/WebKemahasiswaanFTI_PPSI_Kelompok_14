const db = require('../config/db');

const ambilSyarat = async (executor, layananIds) => {
  if (layananIds.length === 0) return [];
  const [rows] = await executor.query(
    `SELECT id, jenis_layanan_id, nama_syarat, tipe_file, is_required
     FROM syarat_layanan WHERE jenis_layanan_id IN (?) ORDER BY id`,
    [layananIds]
  );
  return rows;
};

const gabungSyarat = (layanan, syarat) => layanan.map((item) => ({
  ...item,
  syarat: syarat
    .filter((s) => s.jenis_layanan_id === item.id)
    .map(({ id, nama_syarat, tipe_file, is_required }) => ({ id, nama_syarat, tipe_file, is_required: Boolean(is_required) })),
}));

const Layanan = {
  // Layanan aktif beserta syaratnya, untuk katalog dan formulir pengajuan mahasiswa.
  daftarAktif: async (executor = db) => {
    const [layanan] = await executor.query(
      'SELECT id, kode_layanan, nama_layanan, deskripsi FROM jenis_layanan WHERE is_active = 1 ORDER BY id'
    );
    return gabungSyarat(layanan, await ambilSyarat(executor, layanan.map((l) => l.id)));
  },

  // Semua layanan (aktif dan nonaktif) untuk halaman kelola staf, beserta syarat, template,
  // dan jumlah pengajuan (layanan yang sudah punya pengajuan tidak boleh dihapus).
  daftarKelola: async (executor = db) => {
    const [layanan] = await executor.query(
      `SELECT j.id, j.kode_layanan, j.nama_layanan, j.deskripsi, j.is_active, j.created_at,
         t.header_surat, t.body_template, t.footer_surat, t.format_nomor, t.updated_at AS template_updated_at,
         (SELECT COUNT(*) FROM pengajuan p WHERE p.jenis_layanan_id = j.id) AS jumlah_pengajuan
       FROM jenis_layanan j LEFT JOIN template_surat t ON t.jenis_layanan_id = j.id
       ORDER BY j.id`
    );
    const [pemakaian] = await executor.query(
      'SELECT syarat_layanan_id, COUNT(*) AS jumlah FROM berkas_pengajuan GROUP BY syarat_layanan_id'
    );
    const dipakai = new Map(pemakaian.map((row) => [row.syarat_layanan_id, row.jumlah]));
    return gabungSyarat(layanan, await ambilSyarat(executor, layanan.map((l) => l.id))).map((item) => ({
      id: item.id,
      kode_layanan: item.kode_layanan,
      nama_layanan: item.nama_layanan,
      deskripsi: item.deskripsi,
      is_active: Boolean(item.is_active),
      created_at: item.created_at,
      jumlah_pengajuan: item.jumlah_pengajuan,
      syarat: item.syarat.map((s) => ({ ...s, dipakai: dipakai.get(s.id) || 0 })),
      template: item.body_template === null ? null : {
        header_surat: item.header_surat,
        body_template: item.body_template,
        footer_surat: item.footer_surat,
        format_nomor: item.format_nomor,
        updated_at: item.template_updated_at,
      },
    }));
  },

  // Template satu layanan (kepala, isi, kaki); undefined bila belum ada.
  ambilTemplate: async (layananId, executor = db) => {
    const [[row]] = await executor.query(
      'SELECT header_surat, body_template, footer_surat, format_nomor, updated_at FROM template_surat WHERE jenis_layanan_id = ?',
      [layananId]
    );
    return row;
  },

  // Penanda tangan aktif yang ditunjuk untuk layanan, beserta baris "atas nama"; null bila belum ada.
  ambilPenandaTangan: async (layananId, executor = db) => {
    const [[row]] = await executor.query(
      `SELECT pt.nama, pt.nip, pt.pangkat_golongan, pt.jabatan, j.atas_nama
       FROM jenis_layanan j JOIN penanda_tangan pt ON pt.id = j.penanda_tangan_id AND pt.is_active = 1
       WHERE j.id = ?`,
      [layananId]
    );
    return row || null;
  },

  // Satu layanan aktif beserta syaratnya; undefined bila tidak ada atau nonaktif.
  cariAktif: async (id, executor = db) => {
    const [[layanan]] = await executor.query(
      'SELECT id, kode_layanan, nama_layanan, deskripsi FROM jenis_layanan WHERE id = ? AND is_active = 1',
      [id]
    );
    if (!layanan) return undefined;
    return gabungSyarat([layanan], await ambilSyarat(executor, [layanan.id]))[0];
  },
};

module.exports = Layanan;
