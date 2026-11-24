const Layanan = require('../models/layananModel');
const Pengajuan = require('../models/pengajuanModel');
const User = require('../models/userModel');
const { periksaKelayakan } = require('./kelayakanService');
const { catatPengajuanBaru, ubahStatus } = require('./statusService');
const { pathRelatif } = require('../middlewares/unggahBerkas');
const { denganTransaksi } = require('../utils/transaksi');
const { GalatAplikasi } = require('../utils/galat');

const KEPERLUAN_MAKS = 500;
const POLA_NO_HP = /^\+?[0-9][0-9 -]{7,18}$/;
// Berkas untuk syarat tertentu dikirim dengan nama field "berkas_<id syarat>".
const POLA_FIELD_BERKAS = /^berkas_(\d+)$/;

// Nomor referensi: PGJ-<tahun>-<urut 5 digit>, urutan mulai lagi dari 1 setiap tahun.
const AWALAN_REFERENSI = (tahun) => `PGJ-${tahun}-`;
const buatNomorReferensi = async (conn) => {
  const awalan = AWALAN_REFERENSI(new Date().getFullYear());
  const terakhir = await Pengajuan.nomorTerakhir(conn, awalan);
  return `${awalan}${String(terakhir + 1).padStart(5, '0')}`;
};

const validasiIsian = ({ jenisLayananId, keperluan, noHp }) => {
  const idLayanan = Number(jenisLayananId);
  if (!Number.isInteger(idLayanan) || idLayanan <= 0) {
    throw new GalatAplikasi('Pilih layanan yang ingin diajukan', 400);
  }
  const teksKeperluan = typeof keperluan === 'string' ? keperluan.trim() : '';
  if (!teksKeperluan) throw new GalatAplikasi('Keperluan surat wajib diisi', 400);
  if (teksKeperluan.length > KEPERLUAN_MAKS) {
    throw new GalatAplikasi(`Keperluan surat maksimal ${KEPERLUAN_MAKS} karakter`, 400);
  }
  const teksNoHp = typeof noHp === 'string' ? noHp.trim() : '';
  if (teksNoHp && !POLA_NO_HP.test(teksNoHp)) {
    throw new GalatAplikasi('Nomor telepon/WhatsApp tidak valid. Gunakan angka, contoh: 081234567890', 400);
  }
  return { idLayanan, teksKeperluan, teksNoHp };
};

// Mencocokkan berkas yang diunggah dengan syarat layanan; menolak berkas tak dikenal atau dobel,
// dan menyebutkan dokumen wajib yang belum diunggah.
const cocokkanBerkas = (layanan, files) => {
  const syaratById = new Map(layanan.syarat.map((s) => [s.id, s]));
  const berkasPerSyarat = new Map();

  for (const file of files) {
    const cocok = POLA_FIELD_BERKAS.exec(file.fieldname);
    const syarat = cocok && syaratById.get(Number(cocok[1]));
    if (!syarat) {
      throw new GalatAplikasi(`Berkas "${file.originalname}" tidak sesuai dengan dokumen persyaratan layanan ini`, 400);
    }
    if (berkasPerSyarat.has(syarat.id)) {
      throw new GalatAplikasi(`Unggah satu berkas saja untuk dokumen "${syarat.nama_syarat}"`, 400);
    }
    berkasPerSyarat.set(syarat.id, file);
  }

  const kurang = layanan.syarat.filter((s) => s.is_required && !berkasPerSyarat.has(s.id));
  if (kurang.length > 0) {
    throw new GalatAplikasi(
      `Dokumen wajib belum diunggah: ${kurang.map((s) => s.nama_syarat).join(', ')}`,
      400,
      { syarat_kurang: kurang.map((s) => ({ id: s.id, nama_syarat: s.nama_syarat })) }
    );
  }

  return [...berkasPerSyarat.entries()].map(([syaratId, file]) => ({
    syaratId, filePath: pathRelatif(file), originalName: file.originalname,
  }));
};

const simpanPengajuan = (data) => denganTransaksi(async (conn) => {
  const { mahasiswaId, idLayanan, teksKeperluan, teksNoHp, files, ipAddress } = data;

  const layanan = await Layanan.cariAktif(idLayanan, conn);
  if (!layanan) throw new GalatAplikasi('Layanan tidak ditemukan atau sedang tidak dibuka', 404);

  const mahasiswa = await User.findById(mahasiswaId);
  const kelayakan = await periksaKelayakan({ layanan, mahasiswa }, conn);
  if (!kelayakan.boleh) throw new GalatAplikasi(kelayakan.alasan, 422);

  const berkas = cocokkanBerkas(layanan, files);
  const noReferensi = await buatNomorReferensi(conn);
  const pengajuanId = await Pengajuan.buat(conn, {
    noReferensi, mahasiswaId, jenisLayananId: layanan.id, keperluan: teksKeperluan,
  });
  await Pengajuan.tambahBerkas(conn, pengajuanId, berkas);
  await catatPengajuanBaru(conn, {
    pengajuan: { id: pengajuanId, no_referensi: noReferensi, mahasiswa_id: mahasiswaId },
    aktorId: mahasiswaId,
    ipAddress,
  });

  // Nomor telepon di formulir sekaligus memperbarui kontak di profil.
  if (teksNoHp && teksNoHp !== mahasiswa.no_hp) {
    await conn.query('UPDATE users SET no_hp = ? WHERE id = ?', [teksNoHp, mahasiswaId]);
  }

  return { id: pengajuanId, no_referensi: noReferensi, status: 'diajukan', layanan: { id: layanan.id, nama_layanan: layanan.nama_layanan } };
});

// Menyimpan pengajuan baru beserta berkasnya dalam satu transaksi.
// files = req.files yang sudah lolos middleware unggahBerkas.
const buatPengajuan = async ({ mahasiswaId, jenisLayananId, keperluan, noHp, files = [], ipAddress }) => {
  const isian = validasiIsian({ jenisLayananId, keperluan, noHp });
  try {
    return await simpanPengajuan({ mahasiswaId, ...isian, files, ipAddress });
  } catch (error) {
    // Nomor referensi kembar (sangat jarang, misalnya dua pengajuan pertama di tahun baru bersamaan): coba sekali lagi.
    if (error.code === 'ER_DUP_ENTRY' && String(error.sqlMessage).includes('no_referensi')) {
      return simpanPengajuan({ mahasiswaId, ...isian, files, ipAddress });
    }
    throw error;
  }
};

// Perbaiki dan ajukan ulang (#76): mahasiswa pemilik pengajuan berstatus perlu_perbaikan mengganti
// berkas yang dinyatakan Tidak Sesuai (dan boleh mengganti berkas lain), lalu status kembali ke diajukan.
// Mengembalikan { hasil, berkasLama } agar controller bisa menghapus file lama setelah transaksi berhasil.
const ajukanUlang = ({ pengajuanId, mahasiswaId, keperluan, files = [], ipAddress }) => denganTransaksi(async (conn) => {
  // ubahStatus mengunci baris, memastikan pemilik, dan memastikan status saat ini perlu_perbaikan.
  const hasil = await ubahStatus(conn, {
    pengajuanId, statusBaru: 'diajukan', aktor: { id: mahasiswaId, role: 'mahasiswa' }, ipAddress,
  });

  const [[{ jenis_layanan_id: layananId }]] = await conn.query('SELECT jenis_layanan_id FROM pengajuan WHERE id = ?', [pengajuanId]);
  const [syarat] = await conn.query(
    'SELECT id, nama_syarat, tipe_file, is_required FROM syarat_layanan WHERE jenis_layanan_id = ? ORDER BY id',
    [layananId]
  );
  const layanan = { syarat: syarat.map((s) => ({ ...s, is_required: false })) }; // kelengkapan diperiksa di bawah
  const berkasBaru = cocokkanBerkas(layanan, files);
  const baruPerSyarat = new Map(berkasBaru.map((b) => [b.syaratId, b]));

  const [berkasAda] = await conn.query(
    'SELECT id, syarat_layanan_id, file_path, status_verifikasi FROM berkas_pengajuan WHERE pengajuan_id = ?',
    [pengajuanId]
  );
  const adaPerSyarat = new Map(berkasAda.map((b) => [b.syarat_layanan_id, b]));

  const belumDiganti = berkasAda.filter((b) => b.status_verifikasi === 'tidak_sesuai' && !baruPerSyarat.has(b.syarat_layanan_id));
  const wajibKosong = syarat.filter((s) => s.is_required && !adaPerSyarat.has(s.id) && !baruPerSyarat.has(s.id));
  const kurang = [...belumDiganti.map((b) => syarat.find((s) => s.id === b.syarat_layanan_id)), ...wajibKosong];
  if (kurang.length > 0) {
    throw new GalatAplikasi(
      `Unggah berkas pengganti untuk: ${kurang.map((s) => s.nama_syarat).join(', ')}`,
      400,
      { syarat_kurang: kurang.map((s) => ({ id: s.id, nama_syarat: s.nama_syarat })) }
    );
  }

  const berkasLama = [];
  for (const baru of berkasBaru) {
    const lama = adaPerSyarat.get(baru.syaratId);
    if (lama) {
      berkasLama.push(lama.file_path);
      await conn.query(
        `UPDATE berkas_pengajuan SET file_path = ?, original_name = ?, status_verifikasi = 'belum_diperiksa', catatan_verifikasi = NULL
         WHERE id = ?`,
        [baru.filePath, baru.originalName, lama.id]
      );
    } else {
      await Pengajuan.tambahBerkas(conn, pengajuanId, [baru]);
    }
  }

  const teksKeperluan = typeof keperluan === 'string' ? keperluan.trim() : '';
  if (teksKeperluan) {
    if (teksKeperluan.length > KEPERLUAN_MAKS) throw new GalatAplikasi(`Keperluan surat maksimal ${KEPERLUAN_MAKS} karakter`, 400);
    await conn.query('UPDATE pengajuan SET keperluan = ? WHERE id = ?', [teksKeperluan, pengajuanId]);
  }

  return { hasil: { id: hasil.id, no_referensi: hasil.no_referensi, status: hasil.status }, berkasLama };
});

module.exports = { buatPengajuan, ajukanUlang };
