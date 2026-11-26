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

Template surat mengikuti contoh surat resmi FTI (25 November 2026): "Surat Keterangan" yang ditandatangani
Kepala Kantor Sekretariat atas nama Wakil Dekan I. Keperluan diisi mahasiswa dan dicetak pada kalimat
"Surat aktif ini sebagai persyaratan ...".

### 1b. Surat Keterangan Aktif Kuliah (Keperluan Orang Tua) [AKTIF-ORTU]

Untuk keperluan orang tua, misalnya tunjangan, Taspen, atau BPJS.
- KRS semester berjalan yang sudah ditandatangani Pembimbing Akademik (wajib).
- SK terbaru orang tua. Di sistem ditandai tidak wajib, karena hanya diperlukan bila orang tua berstatus
  PNS; staf memeriksanya saat verifikasi.

Template surat mengikuti contoh surat resmi FTI (25 November 2026): "Surat Keterangan" yang ditandatangani
Kepala Seksi Umum & Akademik atas nama Wakil Dekan I. Keperluan tetap "Untuk Mendapatkan Tunjangan
Anak/Taspen/BPJS", jadi kolom Keperluan tidak ditampilkan ke mahasiswa. Mahasiswa mengisi data orang tua/wali
(nama, NIP/NRV/NOPEN, pangkat/golongan/jabatan, unit kerja, instansi induk). Semua kolom wajib;
NIP/NRV/NOPEN hanya boleh berisi angka. Staf memeriksa data itu terhadap dokumen pendukung dan mengoreksinya lewat isi draf bila perlu.

## 2. Surat Keterangan Lulus [KET-LULUS]

Dokumen yang diunggah:
- Surat pengantar dari departemen yang menyatakan mahasiswa sudah lulus sidang atau ujian komprehensif.
- Bukti kliring fakultas sudah selesai dan bukti terdaftar di wisuda.unand.ac.id.
- Pas foto 3x4 (hanya JPG/PNG, karena ditempel ke surat; keputusan 25 November 2026).

Template surat mengikuti contoh surat resmi FTI (25 November 2026), ditandatangani Dekan, dengan nama
kementerian terbaru di kop. Mahasiswa mengisi tempat dan tanggal lahir, alamat, ujian sarjana yang
diluluskan (gelar), tanggal lulus, jumlah SKS, IPK, dan predikat lulus; staf memeriksanya terhadap dokumen
pendukung. Periode wisuda diisi staf di isi draf.

Surat dibuat sistem. `[BELUM FINAL]` Apakah sistem memeriksa kliring otomatis (misalnya dari pengajuan
layanan nomor 7 yang berstatus Selesai) atau hanya mengandalkan bukti yang diunggah.

## 3. Surat Keterangan Tidak Menerima Beasiswa [TIDAK-BEASISWA]

- Keputusan 25 November 2026 (mengganti keputusan 24 November untuk layanan ini): surat ini adalah pernyataan
  mahasiswa yang harus bermeterai dan bertanda tangan basah, jadi sistem membuat **formulir** dari template
  (sudah terisi nama, NIM, jurusan, alamat rumah, nomor HP, dan nama beasiswa). Mahasiswa mengunduhnya di
  formulir pengajuan, mencetak, menempel meterai Rp10.000, menandatangani, memindai, lalu mengunggahnya.
- Dokumen yang diunggah: surat pernyataan bermeterai yang sudah ditandatangani (hasil pindai), **wajib PDF**.
  Staf memeriksa isi dan kejelasan pindaian; bila belum sesuai, minta perbaikan. Setelah itu alur berlanjut
  sampai persetujuan Dekan; PDF hasil akhir mempertahankan pindaian asli dan menambahkan satu halaman
  verifikasi di bagian akhir yang memuat QR, nomor referensi, sidik jari SHA-256, dan keterangan persetujuan
  elektronik (#95, memakai library pdf-lib).
- Keperluan tetap "Persyaratan pengajuan beasiswa"; nama beasiswa diisi mahasiswa.
- Keputusan 26 November 2026: setelah staf memverifikasi pindaian, alurnya seperti biasa (draf, paraf Kepala
  Kantor dan Wakil Dekan I, keputusan Dekan). PDF draf yang dilihat staf dan pimpinan adalah pindaian unggahan
  mahasiswa; isi draf tidak disunting. Surat **tidak bernomor**, mengikuti contoh resmi. Kalimat penutup
  disalin persis dari contoh resmi.
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

- Keputusan 25 November 2026: surat yang dibuat sistem adalah **surat pengantar fakultas kepada Wakil Rektor I**
  (perihal Permohonan Pengunduran Diri), mengikuti contoh surat resmi FTI, ditandatangani Wakil Dekan I atas
  nama Dekan. Satu surat untuk satu mahasiswa (satu pengajuan); tabel di surat berisi satu baris.
- Surat ini menggantikan keterangan lama "surat permohonan dibuat sistem" dan "hasil akhirnya SK Pengunduran
  Diri" (SK diterbitkan di tingkat universitas, di luar sistem ini).
- `[BELUM FINAL]` Surat resmi mencantumkan "Lamp : 1 Lembar" (surat permohonan dari mahasiswa), tetapi layanan ini
  belum punya syarat unggah untuk lampiran itu. Cara menangani pindah mahasiswa juga belum diputuskan.

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