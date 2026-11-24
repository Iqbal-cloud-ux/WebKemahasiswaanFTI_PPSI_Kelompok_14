// Penerimaan berkas persyaratan (AGENTS.md aturan 1): hanya PDF, JPG, PNG; maksimal 5 MB per berkas.
// - Nama file di disk dibuat acak; nama asli hanya disimpan di database (original_name).
// - Folder uploads tidak disajikan sebagai file statis; berkas dibuka lewat endpoint yang memeriksa hak akses.
// - Selain ekstensi dan tipe MIME, isi awal berkas (magic bytes) juga diperiksa agar berkas
//   yang sekadar diganti ekstensinya ditolak.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { sendError } = require('../utils/responseHandler');

const FOLDER_PERSYARATAN = path.join(__dirname, '../../uploads/requirements');
const UKURAN_MAKS = 5 * 1024 * 1024;
const JUMLAH_MAKS = 20;

// ekstensi -> { mime yang diterima, ekstensi simpan, pemeriksa isi awal berkas }
const JENIS_BERKAS = {
  '.pdf': { mime: ['application/pdf'], simpan: '.pdf', cocok: (b) => b.subarray(0, 5).toString('latin1') === '%PDF-' },
  '.png': { mime: ['image/png'], simpan: '.png', cocok: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  '.jpg': { mime: ['image/jpeg', 'image/pjpeg'], simpan: '.jpg', cocok: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  '.jpeg': { mime: ['image/jpeg', 'image/pjpeg'], simpan: '.jpg', cocok: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
};

const PESAN_FORMAT = 'Gunakan berkas PDF, JPG, atau PNG.';

fs.mkdirSync(FOLDER_PERSYARATAN, { recursive: true });

const jenisDari = (namaAsli) => JENIS_BERKAS[path.extname(namaAsli || '').toLowerCase()];

const upload = multer({
  storage: multer.diskStorage({
    destination: FOLDER_PERSYARATAN,
    filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}${jenisDari(file.originalname).simpan}`),
  }),
  limits: { fileSize: UKURAN_MAKS, files: JUMLAH_MAKS },
  defParamCharset: 'utf8', // nama file berhuruf non-ASCII tetap terbaca benar
  fileFilter: (req, file, cb) => {
    const jenis = jenisDari(file.originalname);
    if (!jenis || !jenis.mime.includes(file.mimetype)) {
      const galat = new Error(`Berkas "${file.originalname}" tidak didukung. ${PESAN_FORMAT}`);
      galat.code = 'FORMAT_TIDAK_DIDUKUNG';
      return cb(galat);
    }
    return cb(null, true);
  },
});

// Menghapus berkas yang sudah tersimpan, misalnya bila validasi atau penyimpanan ke database gagal.
const hapusBerkas = async (files = []) => {
  await Promise.all(files.map((file) => fs.promises.unlink(file.path).catch(() => {})));
};

const bacaAwalBerkas = async (filePath) => {
  const handle = await fs.promises.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(8);
    await handle.read(buffer, 0, 8, 0);
    return buffer;
  } finally {
    await handle.close();
  }
};

const pesanGalatMulter = (error) => {
  if (error.code === 'LIMIT_FILE_SIZE') return 'Ukuran berkas maksimal 5 MB. Kecilkan atau kompres berkas yang terlalu besar, lalu unggah ulang.';
  if (error.code === 'LIMIT_FILE_COUNT') return `Jumlah berkas terlalu banyak (maksimal ${JUMLAH_MAKS}).`;
  if (error.code === 'FORMAT_TIDAK_DIDUKUNG') return error.message;
  return 'Berkas gagal diunggah. Periksa berkas Anda lalu coba lagi.';
};

// Middleware untuk rute yang menerima berkas persyaratan (multipart/form-data).
// Setelah lolos, req.files berisi berkas yang sudah tersimpan; nama field-nya ditentukan rute.
const terimaBerkasPersyaratan = (req, res, next) => {
  upload.any()(req, res, async (error) => {
    if (error) {
      await hapusBerkas(req.files);
      const status = error instanceof multer.MulterError || error.code === 'FORMAT_TIDAK_DIDUKUNG' ? 400 : 500;
      if (status === 500) console.error('Error Unggah Berkas:', error);
      return sendError(res, pesanGalatMulter(error), status);
    }

    const files = req.files || [];
    try {
      for (const file of files) {
        const awal = await bacaAwalBerkas(file.path);
        if (!jenisDari(file.originalname).cocok(awal)) {
          await hapusBerkas(files);
          return sendError(res, `Isi berkas "${file.originalname}" tidak sesuai dengan formatnya. ${PESAN_FORMAT}`, 400);
        }
      }
    } catch (galat) {
      await hapusBerkas(files);
      console.error('Error Periksa Berkas:', galat);
      return sendError(res, 'Berkas gagal diperiksa. Coba unggah ulang.', 500);
    }
    return next();
  });
};

// Path yang disimpan di database relatif terhadap folder uploads, misalnya "requirements/abc.pdf".
const pathRelatif = (file) => `requirements/${path.basename(file.path)}`;

module.exports = { terimaBerkasPersyaratan, hapusBerkas, pathRelatif, UKURAN_MAKS, FOLDER_PERSYARATAN };
