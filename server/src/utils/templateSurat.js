// Template surat: variabel yang boleh dipakai, isi bawaan, dan pengisian variabel.
// Dipakai server (draf dan penerbitan surat) dan seed (database/seed.js).

// {{nama}}, {{nim}}, {{prodi}}, {{keperluan}} diisi saat draf dibuat dari data pengajuan.
// {{no_surat}} dan {{tanggal}} baru diisi saat surat terbit (keputusan Dekan).
const VARIABEL = {
  nama: 'Nama mahasiswa',
  nim: 'NIM mahasiswa',
  prodi: 'Program studi',
  keperluan: 'Keperluan dari pengajuan',
  no_surat: 'Nomor surat (diisi saat terbit)',
  tanggal: 'Tanggal terbit (diisi saat terbit)',
};
const VARIABEL_TERBIT = ['no_surat', 'tanggal'];
const POLA_VARIABEL = /\{\{\s*([a-z_]+)\s*\}\}/g;

const KEPALA_SURAT = [
  'UNIVERSITAS ANDALAS',
  'FAKULTAS TEKNOLOGI INFORMASI',
  'Kampus Universitas Andalas, Limau Manis, Padang',
].join('\n');

// Kalimat pengesahan mengikuti AGENTS.md aturan 4: jangan menyebut "tersertifikasi" atau "berkekuatan hukum".
const KAKI_SURAT = [
  'Padang, {{tanggal}}',
  'Dekan Fakultas Teknologi Informasi',
  '',
  'Dokumen ini disahkan melalui persetujuan elektronik beserta kode verifikasi.',
  'Keaslian dokumen dapat diperiksa dengan memindai kode QR pada surat ini.',
].join('\n');

const isiBawaan = (namaLayanan) => [
  namaLayanan.toUpperCase(),
  'Nomor: {{no_surat}}',
  '',
  'Dekan Fakultas Teknologi Informasi Universitas Andalas dengan ini menerangkan bahwa:',
  '',
  'Nama: {{nama}}',
  'NIM: {{nim}}',
  'Program Studi: {{prodi}}',
  '',
  'adalah mahasiswa Fakultas Teknologi Informasi Universitas Andalas.',
  '',
  'Surat ini dibuat untuk keperluan: {{keperluan}}.',
].join('\n');

// Nama variabel di teks yang tidak dikenal (untuk validasi saat staf menyimpan template).
const variabelTidakDikenal = (teks = '') => [...new Set([...String(teks).matchAll(POLA_VARIABEL)].map((m) => m[1]))]
  .filter((nama) => !VARIABEL[nama]);

// Mengganti variabel yang ada di nilai; variabel lain dibiarkan apa adanya.
const isiVariabel = (teks = '', nilai = {}) => String(teks).replace(POLA_VARIABEL, (asli, nama) => (
  nilai[nama] !== undefined && nilai[nama] !== null ? String(nilai[nama]) : asli
));

module.exports = { VARIABEL, VARIABEL_TERBIT, KEPALA_SURAT, KAKI_SURAT, isiBawaan, variabelTidakDikenal, isiVariabel };
