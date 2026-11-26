const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const { LogAktivitas } = require('../models/logModel');
const { ubahStatus } = require('./statusService');
const { siapkanPdfPenerbitan } = require('./drafService');
const { detail: detailParaf } = require('./parafService');
const { buatNomorSurat } = require('../utils/nomorSurat');
const { denganTransaksi } = require('../utils/transaksi');
const { GalatAplikasi } = require('../utils/galat');
const { buatKodeVerifikasi, tempelLembarVerifikasi } = require('./pengesahanPdfService');

const FOLDER_UPLOADS = path.resolve(__dirname, '../../uploads');
const FOLDER_SURAT = path.join(FOLDER_UPLOADS, 'letters');
const CATATAN_MAKS = 1000;

const periksaAktor = (aktor) => {
  if (aktor?.role !== 'dekan') throw new GalatAplikasi('Hanya Dekan yang dapat mengambil keputusan akhir', 403);
};

const teksCatatan = (catatan) => {
  const teks = typeof catatan === 'string' ? catatan.trim() : '';
  if (teks.length > CATATAN_MAKS) throw new GalatAplikasi(`Catatan maksimal ${CATATAN_MAKS} karakter`, 400);
  return teks;
};

const catatPersetujuan = (conn, { pengajuanId, aktor, status, catatan }) => conn.query(
  'INSERT INTO persetujuan (pengajuan_id, pimpinan_id, role_pimpinan, status, catatan) VALUES (?, ?, ?, ?, ?)',
  [pengajuanId, aktor.id, aktor.role, status, catatan || null]
);

const antrean = async () => {
  const [rows] = await db.query(
    `SELECT p.id, p.no_referensi, p.status, p.created_at, p.updated_at, j.nama_layanan,
       u.nama AS mahasiswa_nama, u.identifier AS mahasiswa_nim, s.updated_at AS draf_updated_at
     FROM pengajuan p
     JOIN jenis_layanan j ON j.id = p.jenis_layanan_id
     JOIN users u ON u.id = p.mahasiswa_id
     LEFT JOIN surat_resmi s ON s.pengajuan_id = p.id
     WHERE p.status = 'pending_dekan'
     ORDER BY p.updated_at, p.id`
  );
  return rows.map((row) => ({
    pengajuan_id: row.id,
    no_referensi: row.no_referensi,
    status: row.status,
    nama_layanan: row.nama_layanan,
    mahasiswa: { nama: row.mahasiswa_nama, nim: row.mahasiswa_nim },
    created_at: row.created_at,
    masuk_tahap_at: row.updated_at,
    draf_updated_at: row.draf_updated_at,
  }));
};

const detail = async (pengajuanId) => detailParaf(pengajuanId);

const riwayat = async (pimpinanId) => {
  const [rows] = await db.query(
    `SELECT ps.id, ps.pengajuan_id, ps.status AS keputusan, ps.catatan, ps.created_at,
       p.no_referensi, p.status AS status_pengajuan, j.nama_layanan,
       u.nama AS mahasiswa_nama, u.identifier AS mahasiswa_nim
     FROM persetujuan ps
     JOIN pengajuan p ON p.id = ps.pengajuan_id
     JOIN jenis_layanan j ON j.id = p.jenis_layanan_id
     JOIN users u ON u.id = p.mahasiswa_id
     WHERE ps.pimpinan_id = ? AND ps.role_pimpinan = 'dekan'
     ORDER BY ps.created_at DESC, ps.id DESC`,
    [pimpinanId]
  );
  const keputusan = rows.map((row) => ({
    id: row.id,
    pengajuan_id: row.pengajuan_id,
    no_referensi: row.no_referensi,
    keputusan: row.keputusan,
    catatan: row.catatan,
    created_at: row.created_at,
    status_pengajuan: row.status_pengajuan,
    nama_layanan: row.nama_layanan,
    mahasiswa: { nama: row.mahasiswa_nama, nim: row.mahasiswa_nim },
  }));
  return {
    statistik: {
      total: keputusan.length,
      disetujui: keputusan.filter((item) => item.keputusan === 'approved').length,
      ditolak: keputusan.filter((item) => item.keputusan === 'rejected').length,
      dikembalikan: keputusan.filter((item) => item.keputusan === 'returned').length,
    },
    riwayat: keputusan,
  };
};

const hapusFileSementara = async (lokasiFile) => {
  for (const lokasi of lokasiFile) {
    try {
      await fs.promises.unlink(lokasi);
    } catch (error) {
      if (error.code !== 'ENOENT') console.error('Gagal membersihkan file surat sementara:', error.message);
    }
  }
};

const tulisFileBaru = async (lokasi, isi, fileDibuat) => {
  const file = await fs.promises.open(lokasi, 'wx');
  fileDibuat.push(lokasi);
  try {
    await file.writeFile(isi);
  } finally {
    await file.close();
  }
};

const setujui = ({ pengajuanId, aktor, catatan, ipAddress }) => {
  periksaAktor(aktor);
  const teks = teksCatatan(catatan);
  const fileDibuat = [];

  return denganTransaksi(async (conn) => {
    try {
      const [[pengajuan]] = await conn.query(
        `SELECT p.id, p.no_referensi, p.status, j.kode_layanan, t.format_nomor
         FROM pengajuan p
         JOIN jenis_layanan j ON j.id = p.jenis_layanan_id
         LEFT JOIN template_surat t ON t.jenis_layanan_id = p.jenis_layanan_id
         WHERE p.id = ? FOR UPDATE`,
        [pengajuanId]
      );
      if (!pengajuan) throw new GalatAplikasi('Pengajuan tidak ditemukan', 404);
      if (pengajuan.status !== 'pending_dekan') {
        throw new GalatAplikasi('Pengajuan ini tidak sedang menunggu keputusan Dekan', 409);
      }

      const [[surat]] = await conn.query(
        'SELECT status_draf FROM surat_resmi WHERE pengajuan_id = ? FOR UPDATE',
        [pengajuanId]
      );
      if (surat?.status_draf !== 'diteruskan') {
        throw new GalatAplikasi('Draf surat belum diteruskan ke Dekan', 409);
      }

      const [paraf] = await conn.query(
        `SELECT role_pimpinan FROM persetujuan
         WHERE pengajuan_id = ? AND status = 'approved' AND role_pimpinan IN ('kakor', 'wadek1')`,
        [pengajuanId]
      );
      const peranSudahParaf = new Set(paraf.map((baris) => baris.role_pimpinan));
      if (!peranSudahParaf.has('kakor') || !peranSudahParaf.has('wadek1')) {
        throw new GalatAplikasi('Surat belum menerima paraf Kepala Kantor dan Wakil Dekan 1', 409);
      }

      const tanggal = new Date();
      const noSurat = await buatNomorSurat(conn, pengajuan.format_nomor, tanggal, pengajuan.kode_layanan);
      const nomorVerifikasi = noSurat || pengajuan.no_referensi;
      const penerbitan = await siapkanPdfPenerbitan({ pengajuanId, noSurat, tanggal, executor: conn });
      const { hashSha256, qrPng } = await buatKodeVerifikasi(penerbitan.pdfSumber, nomorVerifikasi);
      const pdfFinal = penerbitan.formulir
        ? await tempelLembarVerifikasi({
          pdfSumber: penerbitan.pdfSumber,
          qrPng,
          noReferensi: pengajuan.no_referensi,
          hashSha256,
        })
        : await penerbitan.buatPdfDenganQr({ png: qrPng, keterangan: `SHA-256: ${hashSha256}` });

      await fs.promises.mkdir(FOLDER_SURAT, { recursive: true });
      const idFile = crypto.randomUUID();
      const qrPathRelatif = `letters/qr-${idFile}.png`;
      const pdfPathRelatif = `letters/terbit-${idFile}.pdf`;
      const qrPath = path.join(FOLDER_UPLOADS, qrPathRelatif);
      const pdfPath = path.join(FOLDER_UPLOADS, pdfPathRelatif);
      await tulisFileBaru(qrPath, qrPng, fileDibuat);
      await tulisFileBaru(pdfPath, pdfFinal, fileDibuat);

      const status = await ubahStatus(conn, {
        pengajuanId,
        statusBaru: 'disetujui',
        aktor,
        ipAddress,
      });
      await catatPersetujuan(conn, { pengajuanId, aktor, status: 'approved', catatan: teks });
      const tglTerbit = `${tanggal.getFullYear()}-${String(tanggal.getMonth() + 1).padStart(2, '0')}-${String(tanggal.getDate()).padStart(2, '0')}`;
      const [perubahan] = await conn.query(
        `UPDATE surat_resmi
         SET status_draf = 'terbit', no_surat = ?, file_pdf_path = ?, hash_sha256 = ?, qr_code_path = ?, tgl_terbit = ?
         WHERE pengajuan_id = ?`,
        [noSurat, pdfPathRelatif, hashSha256, qrPathRelatif, tglTerbit, pengajuanId]
      );
      if (perubahan.affectedRows !== 1) throw new GalatAplikasi('Data surat tidak dapat diperbarui', 409);
      await LogAktivitas.create({
        userId: aktor.id,
        action: 'terbitkan_surat',
        description: `Dekan menyetujui dan menerbitkan surat pengajuan ${pengajuan.no_referensi}`,
        ipAddress,
      }, conn);

      return {
        pengajuan_id: pengajuanId,
        no_referensi: pengajuan.no_referensi,
        no_surat: noSurat,
        status: status.status,
        hash_sha256: hashSha256,
      };
    } catch (error) {
      await hapusFileSementara(fileDibuat);
      throw error;
    }
  }).catch(async (error) => {
    await hapusFileSementara(fileDibuat);
    throw error;
  });
};

const kembalikan = ({ pengajuanId, aktor, catatan, ipAddress }) => {
  periksaAktor(aktor);
  const teks = teksCatatan(catatan);
  if (!teks) throw new GalatAplikasi('Tuliskan catatan revisi untuk Staf Akademik', 400);
  return denganTransaksi(async (conn) => {
    const hasil = await ubahStatus(conn, {
      pengajuanId,
      statusBaru: 'diverifikasi',
      aktor,
      catatan: teks,
      ipAddress,
    });
    await catatPersetujuan(conn, { pengajuanId, aktor, status: 'returned', catatan: teks });
    const [perubahan] = await conn.query("UPDATE surat_resmi SET status_draf = 'dikembalikan' WHERE pengajuan_id = ?", [pengajuanId]);
    if (perubahan.affectedRows !== 1) throw new GalatAplikasi('Draf surat tidak ditemukan untuk dikembalikan', 409);
    await LogAktivitas.create({
      userId: aktor.id,
      action: 'kembalikan_draf',
      description: `Dekan mengembalikan draf pengajuan ${hasil.no_referensi} untuk revisi`,
      ipAddress,
    }, conn);
    return { pengajuan_id: hasil.id, no_referensi: hasil.no_referensi, status: hasil.status };
  });
};

const tolak = ({ pengajuanId, aktor, catatan, ipAddress }) => {
  periksaAktor(aktor);
  const teks = teksCatatan(catatan);
  if (!teks) throw new GalatAplikasi('Alasan penolakan wajib diisi', 400);
  return denganTransaksi(async (conn) => {
    const hasil = await ubahStatus(conn, {
      pengajuanId,
      statusBaru: 'ditolak',
      aktor,
      catatan: teks,
      ipAddress,
    });
    await catatPersetujuan(conn, { pengajuanId, aktor, status: 'rejected', catatan: teks });
    await LogAktivitas.create({
      userId: aktor.id,
      action: 'tolak_pengajuan',
      description: `Dekan menolak pengajuan ${hasil.no_referensi}`,
      ipAddress,
    }, conn);
    return { pengajuan_id: hasil.id, no_referensi: hasil.no_referensi, status: hasil.status };
  });
};

module.exports = { antrean, detail, riwayat, setujui, kembalikan, tolak };
