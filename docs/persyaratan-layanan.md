# Persyaratan layanan

Sumber: halaman resmi FTI Unand "Syarat Pengurusan Dokumen"
(https://fti.unand.ac.id/en/form-layanan/syarat-pengurusan-dokumen.html), dibaca pada 24 November 2026.
Isinya dirangkum dengan kata-kata sendiri. Bila FTI mengubah aturan, perbarui file ini.

Ada **7 layanan** dalam lingkup proyek saat ini. Layanan 1 dipecah menjadi dua jenis layanan di sistem
(1a dan 1b), sehingga tabel `jenis_layanan` berisi **8 baris**. Layanan lain di halaman itu (Berhenti Studi
Sementara, Legalisir Ijazah dan Transkrip, Transkrip Translate) **tidak dikerjakan**. Nama layanan di bawah
dipakai sebagai nilai `jenis_layanan.nama_layanan`; kode di dalam tanda kurung siku dipakai sebagai
`jenis_layanan.kode_layanan`.

## Keputusan tim (24 November 2026)

- **Semua surat dibuat oleh sistem** dari template, dengan data diambil dari profil mahasiswa dan isian
  pengajuan. Ini berlaku juga untuk formulir dan surat permohonan yang di aturan lama harus diunduh,
  diisi, atau diketik sendiri oleh mahasiswa. Yang diunggah mahasiswa hanya **berkas pendukung**.
- **Berkas pendukung cukup diunggah** dalam bentuk salinan digital (PDF, JPG, PNG; maksimal 5 MB). Aslinya
  tidak perlu diserahkan langsung. Ini juga berlaku untuk dokumen yang di aturan resmi disebut "asli",
  misalnya bukti pembayaran UKT.
- **Sewa baju wisuda tidak dikerjakan sekarang.** Syaratnya tidak ada di halaman resmi, dan tidak boleh
  diisi dengan tebakan. Layanan nomor 7 hanya mencakup pendaftaran wisuda dan kliring fakultas.

## 1. Surat Keterangan Aktif Kuliah

Persyaratan berbeda menurut keperluan. Agar tidak membingungkan mahasiswa, layanan ini dipecah menjadi
dua jenis layanan terpisah (keputusan tim, 24 November 2026). Surat dibuat sistem.

### 1a. Surat Keterangan Aktif Kuliah (Keperluan Pribadi) [AKTIF-PRIBADI]

Untuk keperluan mahasiswa sendiri, misalnya beasiswa.
- KRS semester berjalan yang sudah ditandatangani Pembimbing Akademik (wajib).

### 1b. Surat Keterangan Aktif Kuliah (Keperluan Orang Tua) [AKTIF-ORTU]

Untuk keperluan orang tua, misalnya tunjangan, Taspen, atau BPJS.
- KRS semester berjalan yang sudah ditandatangani Pembimbing Akademik (wajib).
- SK terbaru orang tua. Di sistem ditandai tidak wajib, karena hanya diperlukan bila orang tua berstatus
  PNS; staf memeriksanya saat verifikasi.

## 2. Surat Keterangan Lulus [KET-LULUS]

Dokumen yang diunggah:
- Surat pengantar dari departemen yang menyatakan mahasiswa sudah lulus sidang atau ujian komprehensif.
- Bukti kliring fakultas sudah selesai dan bukti terdaftar di wisuda.unand.ac.id.

Surat dibuat sistem. `[BELUM FINAL]` Apakah sistem memeriksa kliring otomatis (misalnya dari pengajuan
layanan nomor 7 yang berstatus Selesai) atau hanya mengandalkan bukti yang diunggah.

## 3. Surat Keterangan Tidak Menerima Beasiswa [TIDAK-BEASISWA]

- Surat pernyataan dibuat sistem dari template (menggantikan formulir Word di halaman resmi), dengan data
  dari profil mahasiswa, lalu ditandatangani lewat alur persetujuan.
- Tidak ada dokumen pendukung wajib di halaman resmi.
- Catatan: di dokumen A1 sampai A3 layanan ini bernama "Surat Keterangan Beasiswa". Nama di sistem
  mengikuti halaman resmi FTI.

## 4. Permohonan Penyesuaian UKT [PENYESUAIAN-UKT]

(Di dokumen A1 sampai A3 disebut "Penurunan UKT".)

Syarat peserta (sistem memeriksanya sebelum pengajuan dikirim):
- Mahasiswa S1 reguler.
- Aktif kuliah mulai semester 3.
- Hanya boleh sekali selama masa studi.

Cara sistem memeriksa: jenjang dan angkatan diambil dari `users.jenjang` dan `users.angkatan`
(migrasi 003). Semester dihitung dari angkatan: semester ganjil dianggap mulai Agustus. "Hanya sekali"
berarti mahasiswa belum punya pengajuan layanan ini yang statusnya selain `ditolak`. `[BELUM FINAL]`
Status "reguler" belum disimpan di database; saat ini yang diperiksa hanya jenjang S1.

Dokumen yang diunggah:
1. Surat keterangan masih kuliah. `[USULAN]` Dapat diambil dari Surat Keterangan Aktif Kuliah yang
   diterbitkan sistem (layanan nomor 1).
2. Surat keterangan penghasilan orang tua, atau surat keterangan tidak mampu dari lurah.
3. Fotokopi KTP orang tua atau wali.
4. Fotokopi Kartu Keluarga.
5. Fotokopi tagihan listrik 2 bulan terakhir.
6. Foto rumah dari depan, belakang, dan dalam, masing-masing 2 lembar.

Berkas ini berisi data sensitif: unduhannya wajib lewat pemeriksaan hak akses dan pembukaannya dicatat di log.
Cara pengajuan di aturan lama (diserahkan langsung, lewat pos, atau lewat email) digantikan oleh sistem.

## 5. Pengembalian UKT [PENGEMBALIAN-UKT]

- Surat permohonan kepada Wakil Dekan II dibuat sistem dari template. Wakil Dekan II hanya tujuan di teks
  surat; alur paraf tetap Kepala Kantor, Wakil Dekan 1, lalu Dekan (keputusan tim, 24 November 2026).
- Dokumen yang diunggah: bukti pembayaran UKT (salinan digital cukup), SK Rektor tentang penyesuaian UKT
  yang memuat nama pemohon, dan fotokopi buku tabungan.
- Layanan ini terkait dengan layanan nomor 4: pemohon harus sudah punya SK penyesuaian UKT.

## 6. Pengunduran Diri atau Pindah Mahasiswa [UNDUR-DIRI]

- Surat permohonan pengunduran diri dibuat sistem dari template (menggantikan formulir Word di halaman
  resmi), dengan data dari profil mahasiswa.
- Hasil akhirnya adalah SK Pengunduran Diri.
- `[BELUM FINAL]` Cara menangani pindah mahasiswa, dan dokumen pendukung bila ada.

## 7. Pendaftaran Wisuda Online atau Kliring Fakultas [KLIRING-WISUDA]

Dokumen yang diunggah:
1. Surat keterangan lunas UKT dari Keuangan Rektorat.
2. Surat keterangan bebas perpustakaan Unand.
3. Surat keterangan bebas ruang baca FTI dan laboratorium program studi.

Sistem membuat surat hasil kliring. Sewa baju wisuda tidak termasuk (lihat Keputusan tim).

## Ringkasan data yang berguna untuk implementasi

- Tabel `jenis_layanan` memuat 8 baris (layanan 1 dipecah menjadi 1a dan 1b), dan `syarat_layanan` memuat
  dokumen tiap layanan dengan kolom `is_required`. Data awalnya dibuat oleh skrip seed (`npm run seed`
  di folder server).
- Setiap layanan punya satu `template_surat` yang dipakai sistem untuk membuat surat.
- Layanan 4 punya syarat peserta yang harus diperiksa sistem sebelum pengajuan dikirim.
- Layanan 4 dan 5 saling berkaitan, begitu pula layanan 2 dan 7.