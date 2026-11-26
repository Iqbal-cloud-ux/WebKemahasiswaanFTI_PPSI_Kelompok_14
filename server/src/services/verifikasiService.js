const crypto = require('crypto');
const { GalatAplikasi } = require('../utils/galat');

const HASH_SHA256 = /^[a-f0-9]{64}$/i;

const verifikasiSurat = async ({ nomor, hash, userAgent, ipAddress }, executor) => {
  const nomorBersih = typeof nomor === 'string' ? nomor.trim() : '';
  const hashBersih = typeof hash === 'string' ? hash.trim() : '';
  if (!nomorBersih || nomorBersih.length > 150) {
    throw new GalatAplikasi('Nomor surat atau referensi wajib diisi dan maksimal 150 karakter', 400);
  }
  if (!HASH_SHA256.test(hashBersih)) {
    throw new GalatAplikasi('Hash harus berupa 64 karakter heksadesimal', 400);
  }

  const db = executor || require('../config/db');
  const [rows] = await db.query(
    `SELECT s.id AS surat_id, s.no_surat, s.hash_sha256, s.tgl_terbit,
       p.no_referensi, j.nama_layanan
     FROM surat_resmi s
     JOIN pengajuan p ON p.id = s.pengajuan_id
     JOIN jenis_layanan j ON j.id = p.jenis_layanan_id
     WHERE s.status_draf = 'terbit' AND p.status = 'disetujui'
       AND ((s.no_surat IS NOT NULL AND s.no_surat = ?)
         OR (s.no_surat IS NULL AND p.no_referensi = ?))
     LIMIT 1`,
    [nomorBersih, nomorBersih]
  );
  const surat = rows[0];
  if (!surat) return { valid: false };

  await db.query(
    'INSERT INTO public_verification (surat_id, user_agent, ip_address) VALUES (?, ?, ?)',
    [
      surat.surat_id,
      typeof userAgent === 'string' ? userAgent.slice(0, 255) : null,
      typeof ipAddress === 'string' ? ipAddress.slice(0, 45) : null,
    ]
  );

  const hashTersimpan = typeof surat.hash_sha256 === 'string' ? surat.hash_sha256 : '';
  const hashCocok = HASH_SHA256.test(hashTersimpan)
    && crypto.timingSafeEqual(Buffer.from(hashBersih.toLowerCase(), 'hex'), Buffer.from(hashTersimpan.toLowerCase(), 'hex'));
  if (!hashCocok) return { valid: false };

  return {
    valid: true,
    surat: {
      nomor: surat.no_surat || surat.no_referensi,
      jenis: surat.nama_layanan,
      tanggal_terbit: surat.tgl_terbit,
      status: 'Selesai',
    },
  };
};

module.exports = { verifikasiSurat };
