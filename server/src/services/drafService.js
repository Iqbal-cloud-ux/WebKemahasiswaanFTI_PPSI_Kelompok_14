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
const { GalatAplikasi } = require('../utils/galat');
const { isiVariabel, variabelTidakDikenal } = require('../utils/templateSurat');
const db = require('../config/db');

const FOLDER_UPLOADS = path.resolve(__dirname, '../../uploads');
const FOLDER_SURAT = path.join(FOLDER_UPLOADS, 'letters');
const ISI_MAKS = 20000;
// Status pengajuan yang draf-nya tampil di halaman Draf Surat.
const STATUS_DRAF = ['diverifikasi', ...TAHAP_PIMPINAN];
// Pengganti variabel yang baru diisi saat surat terbit.
const PENANDA_DRAF = { no_surat: '[nomor surat diisi saat terbit]', tanggal: '[tanggal terbit]' };

fs.mkdirSync(FOLDER_SURAT, { recursive: true });

const nilaiPengajuan = (pengajuan) => ({
  nama: pengajuan.mahasiswa.nama,
  nim: pengajuan.mahasiswa.nim,
  prodi: pengajuan.mahasiswa.prodi || '-',
  keperluan: pengajuan.keperluan,
});

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
    `SELECT id, status_draf, isi_draf, file_draf_path, updated_at FROM surat_resmi WHERE pengajuan_id = ?${kunci ? ' FOR UPDATE' : ''}`,
    [pengajuanId]
  );
  return row;
};

const ambilBahan = async (pengajuanId, executor = db) => {
  const pengajuan = await Pengajuan.cariDetail(pengajuanId, executor);
  if (!pengajuan) throw new GalatAplikasi('Pengajuan tidak ditemukan', 404);
  const template = await Layanan.ambilTemplate(pengajuan.layanan.id, executor);
  if (!template) throw new GalatAplikasi(`Layanan ${pengajuan.layanan.nama_layanan} belum punya template surat. Lengkapi di menu Jenis Layanan & Template`, 409);
  return { pengajuan, template };
};

// Detail draf untuk editor: isi tersimpan, atau isi template yang sudah diisi data pengajuan.
const ambilDraf = async (pengajuanId) => {
  const { pengajuan, template } = await ambilBahan(pengajuanId);
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
    isi_draf: surat?.isi_draf ?? isiVariabel(template.body_template, nilaiPengajuan(pengajuan)),
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

const pdfDraf = ({ pengajuan, template, isi }) => buatPdfSurat({
  header: template.header_surat,
  isi: isiVariabel(isiVariabel(isi, nilaiPengajuan(pengajuan)), PENANDA_DRAF),
  footer: isiVariabel(template.footer_surat, PENANDA_DRAF),
  draf: true,
  judul: `Draf ${pengajuan.layanan.nama_layanan} ${pengajuan.no_referensi}`,
});

// Pratinjau PDF dari isi yang belum disimpan (tidak menyimpan apa pun).
const pratinjauDraf = async (pengajuanId, isi) => {
  const teks = validasiIsi(isi);
  const { pengajuan, template } = await ambilBahan(pengajuanId);
  return pdfDraf({ pengajuan, template, isi: teks });
};

// Menyimpan draf dan PDF-nya. Hanya saat pengajuan berstatus diverifikasi (belum diteruskan).
const simpanDraf = async (pengajuanId, isi, aktor) => {
  const teks = validasiIsi(isi);
  const { pengajuan, template } = await ambilBahan(pengajuanId);
  const pdf = await pdfDraf({ pengajuan, template, isi: teks });
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
        `INSERT INTO surat_resmi (pengajuan_id, status_draf, isi_draf, file_draf_path) VALUES (?, 'dibuat', ?, ?)
         ON DUPLICATE KEY UPDATE status_draf = 'dibuat', isi_draf = VALUES(isi_draf), file_draf_path = VALUES(file_draf_path)`,
        [pengajuanId, teks, namaFile]
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

module.exports = { daftarDraf, ambilDraf, pratinjauDraf, simpanDraf, teruskanDraf, lokasiPdfDraf };
