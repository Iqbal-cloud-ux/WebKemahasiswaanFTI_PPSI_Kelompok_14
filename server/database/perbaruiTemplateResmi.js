// Menimpa template_surat di database yang sudah berjalan dengan template resmi dari database/templateResmi.js.
// Jalankan dari folder server:
//   npm run template:resmi                 semua layanan yang ada di templateResmi.js
//   npm run template:resmi -- AKTIF-PRIBADI  hanya layanan tertentu (boleh lebih dari satu kode)
//
// PERHATIAN: suntingan staf pada template dan format nomor surat layanan itu ikut tertimpa. Draf yang sudah disimpan
// (surat_resmi.isi_draf) tidak berubah. Setiap template yang ditimpa dicatat di log_aktivitas.
require('dotenv').config();
const db = require('../src/config/db');
const { LogAktivitas } = require('../src/models/logModel');
const { TEMPLATE_RESMI } = require('./templateResmi');
const { variabelTidakDikenal } = require('../src/utils/templateSurat');
const { validasiFormatNomor } = require('../src/utils/nomorSurat');

const main = async () => {
  const diminta = process.argv.slice(2).map((k) => k.toUpperCase());
  const kode = diminta.length ? diminta : Object.keys(TEMPLATE_RESMI);
  const asing = kode.filter((k) => !TEMPLATE_RESMI[k]);
  if (asing.length) throw new Error(`Belum ada template resmi untuk: ${asing.join(', ')}`);

  for (const k of kode) {
    const t = TEMPLATE_RESMI[k];
    const tidakDikenal = variabelTidakDikenal(`${t.header}\n${t.isi}\n${t.footer}`);
    if (tidakDikenal.length) throw new Error(`Template ${k} memakai variabel tidak dikenal: ${tidakDikenal.join(', ')}`);
    validasiFormatNomor(t.formatNomor);
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    for (const k of kode) {
      const t = TEMPLATE_RESMI[k];
      const [[layanan]] = await conn.query('SELECT id FROM jenis_layanan WHERE kode_layanan = ?', [k]);
      if (!layanan) {
        console.warn(`Lewati ${k}: jenis layanan tidak ada di database (jalankan npm run seed).`);
        continue;
      }
      await conn.query(
        `INSERT INTO template_surat (jenis_layanan_id, header_surat, body_template, footer_surat, format_nomor) VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE header_surat = VALUES(header_surat), body_template = VALUES(body_template),
           footer_surat = VALUES(footer_surat), format_nomor = VALUES(format_nomor)`,
        [layanan.id, t.header, t.isi, t.footer, t.formatNomor || null]
      );
      await LogAktivitas.create({
        action: 'ubah_template',
        description: `Template surat layanan ${k} diganti dengan template resmi (skrip perbaruiTemplateResmi)`,
      }, conn);
      console.log(`Template ${k} diperbarui.`);
    }
    await conn.commit();
  } catch (error) {
    await conn.rollback().catch(() => {});
    throw error;
  } finally {
    conn.release();
  }
};

main()
  .catch((error) => {
    console.error('Gagal memperbarui template:', error.message);
    process.exitCode = 1;
  })
  .finally(() => db.end());
