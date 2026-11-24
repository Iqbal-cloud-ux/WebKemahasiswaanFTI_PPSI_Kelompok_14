// Pemeriksaan berkas oleh Staf Akademik (#71): menandai tiap dokumen Sesuai atau Tidak Sesuai,
// lalu memutuskan Verifikasi, Minta Perbaikan, atau Tolak (docs/alur-status.md).
const Pengajuan = require('../models/pengajuanModel');
const { ubahStatus } = require('./statusService');
const { denganTransaksi } = require('../utils/transaksi');
const { GalatAplikasi } = require('../utils/galat');

const KEPUTUSAN_KE_STATUS = {
  verifikasi: 'diverifikasi',
  perbaikan: 'perlu_perbaikan',
  tolak: 'ditolak',
};
const STATUS_BERKAS = ['sesuai', 'tidak_sesuai'];
const CATATAN_MAKS = 1000;

// berkasInput: [{ id, status_verifikasi, catatan }] dari body request.
const rapikanBerkas = (berkasInput, berkasPengajuan) => {
  if (!Array.isArray(berkasInput)) throw new GalatAplikasi('Format hasil pemeriksaan berkas tidak valid', 400);
  const idBerkas = new Set(berkasPengajuan.map((b) => b.id));
  const hasil = new Map();
  for (const item of berkasInput) {
    const id = Number(item?.id);
    if (!idBerkas.has(id)) throw new GalatAplikasi('Ada berkas yang bukan milik pengajuan ini', 400);
    if (!STATUS_BERKAS.includes(item.status_verifikasi)) {
      throw new GalatAplikasi('Status pemeriksaan berkas harus "sesuai" atau "tidak_sesuai"', 400);
    }
    const catatan = typeof item.catatan === 'string' ? item.catatan.trim().slice(0, CATATAN_MAKS) : '';
    hasil.set(id, { statusVerifikasi: item.status_verifikasi, catatan });
  }
  return hasil;
};

const periksaPengajuan = ({ pengajuanId, keputusan, catatan, berkas, aktor, ipAddress }) => {
  const statusBaru = KEPUTUSAN_KE_STATUS[keputusan];
  if (!statusBaru) throw new GalatAplikasi('Pilih keputusan: verifikasi, perbaikan, atau tolak', 400);
  const teksCatatan = typeof catatan === 'string' ? catatan.trim() : '';
  if (teksCatatan.length > CATATAN_MAKS) throw new GalatAplikasi(`Catatan maksimal ${CATATAN_MAKS} karakter`, 400);

  return denganTransaksi(async (conn) => {
    // ubahStatus lebih dulu: mengunci baris pengajuan dan memeriksa status saat ini (harus 'diajukan'),
    // peran, dan catatan wajib. Bila pemeriksaan berkas di bawah gagal, seluruh transaksi dibatalkan.
    const hasil = await ubahStatus(conn, { pengajuanId, statusBaru, aktor, catatan: teksCatatan, ipAddress });

    const berkasPengajuan = await Pengajuan.daftarBerkas(pengajuanId, conn);
    const hasilBerkas = rapikanBerkas(berkas || [], berkasPengajuan);

    if (statusBaru === 'diverifikasi') {
      const belumSesuai = berkasPengajuan.filter((b) => hasilBerkas.get(b.id)?.statusVerifikasi !== 'sesuai');
      if (belumSesuai.length > 0) {
        throw new GalatAplikasi(
          `Semua dokumen harus dinyatakan Sesuai sebelum diverifikasi. Belum sesuai: ${belumSesuai.map((b) => b.nama_syarat).join(', ')}`,
          400
        );
      }
    }

    for (const [id, nilai] of hasilBerkas) {
      await Pengajuan.ubahVerifikasiBerkas(conn, id, nilai);
    }
    return { id: hasil.id, no_referensi: hasil.no_referensi, status: hasil.status };
  });
};

module.exports = { periksaPengajuan };
