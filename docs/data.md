Struktur data

Sumber kebenaran skema: `server/database/schema.sql` (struktur yang diekspor dari database pengembangan, 2026-11-23) ditambah file di `server/database/migrations/` yang dijalankan berurutan. Dokumen ini meringkas isinya. ERD pada A3 (Gambar 3.23) adalah rancangan awal; skema yang dipakai kode sudah berbeda, lihat bagian "Perbedaan dengan ERD A3" di bawah.

Cara menyiapkan database kosong
1. Buat database sesuai DB_NAME di server/.env (XAMPP, phpMyAdmin).
2. Impor server/database/schema.sql.
3. Jalankan file di server/database/migrations/ berurutan dari nomor terkecil.
4. Isi SEED_PASSWORD di server/.env, lalu jalankan `npm run seed` di folder server untuk data awal, penanda tangan uji, dan akun uji.

Cara mengubah skema
- Jangan mengedit tabel langsung di phpMyAdmin tanpa jejak. Buat file migrasi baru bernomor urut, misalnya `002_nama_perubahan.sql`, berisi perintah ALTER/CREATE yang aman dijalankan ulang bila memungkinkan.
- Perbarui dokumen ini pada commit yang sama.
- Beri tahu tim karena setiap anggota perlu menjalankan migrasi itu di database lokalnya.

Konvensi kolom
- Kunci utama setiap tabel bernama `id` (INT AUTO_INCREMENT). Kunci asing bernama `<tabel>_id`.
- Waktu: `created_at`, dan `updated_at` bila baris bisa berubah.
- Nilai ya/tidak memakai TINYINT(1) dengan awalan `is_` (misalnya `is_active`, `is_read`).
- Charset utf8mb4, collation utf8mb4_general_ci, engine InnoDB.

Tabel (11 di schema.sql + 2 dari migrasi 001 + 1 dari migrasi 004 + 1 dari migrasi 005; migrasi 002 sampai 005 menambah kolom)

users: id, identifier (NIM/NIP, unik), nama, email (unik), password (hash bcrypt, tidak boleh teks biasa), role, prodi, jenjang, angkatan, no_hp, is_active (migrasi 002, default 1), created_at, updated_at.
  Akun dengan is_active = 0 ditolak saat login dan saat memperpanjang sesi.
  jenjang (misalnya 'S1') dan angkatan (tahun masuk) ditambahkan di migrasi 003; hanya diisi untuk mahasiswa. Dipakai untuk memeriksa syarat peserta Permohonan Penyesuaian UKT; semester dihitung dari angkatan.
  role = ENUM('mahasiswa', 'staf', 'kakor', 'wadek1', 'dekan'). kakor = Kepala Kantor, wadek1 = Wakil Dekan 1. Staf Akademik (`staf`) juga bertindak sebagai admin.
  Data akademik mahasiswa (NIM, prodi) disimpan langsung di tabel ini; tidak ada tabel mahasiswa terpisah.

jenis_layanan: id, kode_layanan (unik), nama_layanan, deskripsi, is_active, penanda_tangan_id (migrasi 004, FK ke penanda_tangan, SET NULL bila dihapus), atas_nama (migrasi 004, misalnya "a.n. Wakil Dekan I"; kosong bila pejabat menandatangani langsung), created_at.

penanda_tangan (migrasi 004): id, nama (beserta gelar), nip (unik), pangkat_golongan, jabatan, is_active, created_at, updated_at. Pejabat yang namanya dicetak di surat. Dikelola Staf Akademik; pejabat bisa berganti tanpa mengubah template. Setiap jenis layanan menunjuk satu penanda tangan.

syarat_layanan: id, jenis_layanan_id (FK), nama_syarat, tipe_file (default 'pdf'; seed memakai 'pdf,jpg,png'), is_required. tipe_file diperiksa per syarat saat unggah (server dan formulir), misalnya pas foto 'jpg,png'. Template yang memakai [[foto]] menempelkan berkas pertama dari syarat yang tidak menerima PDF. Satu layanan punya banyak syarat. Pengajuan baru bisa dikirim bila semua syarat dengan is_required = 1 sudah ada berkasnya.

template_surat: id, jenis_layanan_id (FK, unik: satu template per layanan), header_surat, body_template, footer_surat, format_nomor (migrasi 005), updated_at.
  format_nomor = format nomor surat resmi layanan itu, diatur Staf Akademik di menu Jenis Layanan & Template, misalnya `B/{urut}/UN.16.15/KM.00.00/{tahun}`. Penanda: {urut} (wajib), {tahun}, {bulan} (angka Romawi). Kosong = surat layanan itu belum bisa terbit. Kode di server/src/utils/nomorSurat.js. Template berisi variabel dinamis yang diganti dari data pengajuan dan mahasiswa.
  Variabel (daftar lengkap di server/src/utils/templateSurat.js): {{nama}}, {{nim}}, {{prodi}}, {{jenjang}}, {{no_hp}} (profil), {{keperluan}}, {{no_surat}}, {{tanggal}}; {{semester_berjalan}} (Ganjil/Genap) dan {{tahun_akademik}} (misalnya 2026/2027) dihitung dari tanggal draf dibuat, dengan aturan semester ganjil mulai Agustus (server/src/utils/semester.js); penanda tangan layanan (migrasi 004): {{ttd_nama}}, {{ttd_nip}}, {{ttd_pangkat}}, {{ttd_jabatan}}, {{ttd_atas_nama}}; isian tambahan dari pengajuan.data_isian, didefinisikan per layanan di ISIAN_LAYANAN (templateSurat.js); saat ini AKTIF-ORTU: {{ortu_nama}}, {{ortu_nip}}, {{ortu_pangkat}}, {{ortu_unit_kerja}}, {{ortu_instansi}}; TIDAK-BEASISWA: {{alamat_rumah}}, {{nama_beasiswa}}; KET-LULUS: {{tempat_lahir}}, {{tanggal_lahir}}, {{alamat}}, {{gelar_lulus}}, {{tanggal_lulus}}, {{sks}}, {{ipk}}, {{predikat}}. Isian berjenis tanggal diisi lewat kalender (tidak boleh setelah hari ini), disimpan YYYY-MM-DD, dan dicetak "24 April 2000". Isian berjenis angka (SKS, NIP/NRV/NOPEN) hanya digit, dan desimal (IPK) hanya digit dengan satu titik; formulir membuang karakter lain saat diketik dan server memeriksa ulang. Isian tidak wajib yang kosong dicetak "-". Variabel yang diisi staf (VARIABEL_STAF, saat ini {{periode_wisuda}}) muncul di draf baru sebagai penanda [ISI OLEH STAF: ...]; draf tidak bisa diteruskan ke Kepala Kantor selama penanda itu masih ada. Layanan di KEPERLUAN_TETAP (saat ini AKTIF-ORTU) tidak menampilkan kolom Keperluan; pengajuan.keperluan diisi teks tetap itu. Nilai dari isian pengguna dibersihkan dari baris baru dan tanda tata letak sebelum dimasukkan. Baris yang hanya berisi variabel bernilai kosong (misalnya {{ttd_atas_nama}} untuk surat Dekan) dihapus. Bila template memakai {{ttd_...}} tetapi layanan belum punya penanda tangan aktif, draf tidak bisa dibuat.
  Aturan penulisan template (dibaca server/src/services/pdfService.js saat membuat PDF; huruf bawaan Times, ukuran 12):
  - Per baris: `[14]` di awal = ukuran huruf; `^` di awal = rata tengah; `>` di awal = rata kanan; `kiri >> kanan` = teks kanan rata kanan di baris yang sama; baris kosong = jarak paragraf. Paragraf biasa rata kanan-kiri.
  - `Label :: nilai` dicetak "Label : nilai" dengan titik dua sejajar untuk baris-baris berurutan. Spasi di awal baris = menjorok (4 spasi kira-kira 1 cm).
  - `| a | b | c |` = baris tabel; baris pertama judul kolom (tebal). Baris `|:-:|:--|--:|` (opsional, sesudah judul) mengatur perataan kolom: tengah, kiri, kanan.
  - Di dalam teks: `**tebal**`, `*miring*`, `__garis bawah__`, boleh digabung (`__**JUDUL**__`).
  - Kepala surat: baris pertama `[[logo]]` menaruh logo Unand (server/assets/images/logo-unand.png) di kiri, teks kop di tengah ruang kanannya, lalu satu garis tebal.
  - Isi: baris `[[huruf helvetica]]` mengganti huruf isi dan kaki menjadi Helvetica (setara Arial); baris `[[ukuran 11]]` mengganti ukuran huruf bawaan isi dan kaki (8 sampai 14, bawaan 12).
  - Kaki: baris sebelum baris kosong pertama = blok tanda tangan di kanan; sesudahnya = keterangan kecil di tengah. `kiri || kanan` = dua kolom tanda tangan; `[[ttd]]` = ruang tanda tangan, diisi kode QR pada surat final; `[[foto]]` = pas foto 3x4 di kiri blok tanda tangan (kotak penanda tempat bila belum ada foto).
  - Template lama tanpa aturan ini tetap dicetak seperti sebelumnya (baris pertama isi berhuruf kapital menjadi judul; QR di bawah blok tanda tangan).

Data awal (seed): `npm run seed` di folder server mengisi 8 jenis layanan, syaratnya, satu template per layanan, 4 penanda tangan uji palsu beserta penunjukannya untuk 5 layanan yang punya contoh surat resmi, dan akun uji palsu untuk 5 peran (kata sandi dari SEED_PASSWORD di .env). Butuh migrasi 002, 003, dan 004. Penunjukan penanda tangan tidak menimpa layanan yang sudah punya penanda tangan.
  Template yang mengikuti contoh surat resmi FTI ada di server/database/templateResmi.js (saat ini: AKTIF-PRIBADI, AKTIF-ORTU, KET-LULUS, TIDAK-BEASISWA, dan UNDUR-DIRI; tiga layanan lain belum punya contoh surat resmi). Layanan di FORMULIR_MAHASISWA (templateSurat.js; saat ini TIDAK-BEASISWA) memakai template sebagai formulir yang diunduh mahasiswa lewat POST /api/layanan/:id/formulir (tidak disimpan), lalu diunggah kembali setelah ditandatangani pada syarat yang namanya sama dengan nilai di FORMULIR_MAHASISWA. Seed hanya memakainya untuk database baru; untuk database yang sudah berjalan, jalankan `npm run template:resmi` (atau `npm run template:resmi -- KODE_LAYANAN`) di folder server. Skrip itu menimpa template layanan tersebut, termasuk suntingan staf, dan mencatatnya di log_aktivitas. Draf yang sudah disimpan tidak berubah. Aman dijalankan ulang; data yang sudah ada tidak ditimpa. Daftar akun uji ada di server/database/seed.js.

pengajuan: id, no_referensi (unik), mahasiswa_id (FK ke users.id), jenis_layanan_id (FK), keperluan, data_isian (migrasi 004), status, catatan_revisi, created_at, updated_at.
  data_isian = JSON { nama_isian: nilai } berisi data tambahan yang diisi mahasiswa (misalnya data orang tua atau data kelulusan), diverifikasi dan boleh dikoreksi staf. Hanya nama isian yang terdaftar sebagai variabel template yang dipakai di surat.
  status = ENUM('diajukan', 'perlu_perbaikan', 'diverifikasi', 'pending_kakor', 'pending_wadek1', 'pending_dekan', 'disetujui', 'ditolak'), default 'diajukan'. Arti, label tampilan, dan perpindahan yang diizinkan ada di docs/alur-status.md; di kode, aturan itu ada di server/src/services/statusService.js.
  no_referensi dibuat server dengan format PGJ-<tahun>-<urut 5 digit>, misalnya PGJ-2026-00001; urutan mulai lagi dari 1 setiap tahun. Ini nomor pengajuan, bukan nomor surat resmi.

berkas_pengajuan: id, pengajuan_id (FK), syarat_layanan_id (FK), file_path, original_name, status_verifikasi, catatan_verifikasi, created_at. File disimpan di server/uploads/requirements/ dengan nama acak dan hanya boleh dibuka lewat endpoint yang memeriksa hak akses. file_path relatif terhadap folder uploads (misalnya requirements/<uuid>.pdf); original_name adalah nama asli dari mahasiswa.
  status_verifikasi (migrasi 002) = ENUM('belum_diperiksa', 'sesuai', 'tidak_sesuai'), default 'belum_diperiksa'. Hasil pemeriksaan staf per dokumen; catatan_verifikasi berisi alasan bila tidak sesuai.

persetujuan: id, pengajuan_id (FK), pimpinan_id (FK ke users.id), role_pimpinan ENUM('kakor', 'wadek1', 'dekan'), status ENUM('approved', 'rejected', 'returned'), catatan, created_at. Satu baris per keputusan pejabat. 'returned' (migrasi 002) = Kembalikan dengan catatan.

surat_resmi: id, pengajuan_id (FK, unik: satu surat per pengajuan), status_draf, isi_draf, file_draf_path, penanda_tangan (migrasi 004), no_surat (unik), file_pdf_path, hash_sha256, qr_code_path, tgl_terbit, created_at, updated_at. PDF di server/uploads/letters/.
  Tabel ini menyimpan draf sekaligus surat final. Baris dibuat saat staf pertama kali menyimpan draf; no_surat, hash, QR, PDF final, dan tgl_terbit baru diisi saat Dekan menyetujui.
  penanda_tangan = JSON salinan data penanda tangan (nama, nip, pangkat_golongan, jabatan, atas_nama) saat draf terakhir disimpan. Penerbitan surat wajib memakai salinan ini, bukan data penanda_tangan terbaru, agar surat tidak berubah (dan hash tetap cocok) bila pejabat berganti.
  status_draf (migrasi 002) = ENUM('dibuat', 'dikembalikan', 'diteruskan', 'terbit'), default 'dibuat'. Pengajuan diverifikasi yang belum punya baris surat_resmi berarti draf "Belum Dibuat". Pemetaan ke label ada di docs/alur-status.md.

public_verification: id, surat_id (FK ke surat_resmi), scanned_at, user_agent, ip_address. Mencatat setiap pemeriksaan keaslian surat lewat halaman publik.

config_tte: id, provider_name, api_endpoint, encrypted_secret_key (terenkripsi, tidak pernah ditampilkan kembali), is_active, updated_at. Hanya dikelola Dekan (dibatasi di kode, bukan di database).

log_aktivitas: id, user_id (FK, SET NULL bila akun dihapus), action, description, ip_address, created_at. Hanya boleh ditambah; tidak boleh diubah atau dihapus lewat antarmuka. Dipakai untuk login, pembukaan dokumen persyaratan, paraf, keputusan, penerbitan dan unduhan surat, serta perubahan pengaturan TTE.

riwayat_status (migrasi 001): id, pengajuan_id (FK), user_id (FK pelaku, boleh NULL), status_sebelumnya (NULL untuk pengiriman pertama), status_baru, catatan, created_at. Satu baris untuk setiap perpindahan status pengajuan. Nilai status sama dengan pengajuan.status.

nomor_surat_urut (migrasi 005): tahun (kunci utama), nomor_terakhir, updated_at. Satu urutan nomor surat untuk SEMUA surat yang terbit, mulai dari 1 setiap tahun (keputusan 25 November 2026), seperti buku agenda surat keluar. Saat surat terbit, nomor_terakhir dinaikkan satu di dalam transaksi penerbitan (buatNomorSurat di nomorSurat.js), sehingga nomor tidak kembar dan tidak terbuang bila penerbitan gagal. Staf boleh mengatur nomor terakhir tahun berjalan (misalnya untuk melanjutkan buku agenda manual); perubahannya dicatat di log_aktivitas.

notifikasi (migrasi 001): id, user_id (FK penerima), pengajuan_id (FK, boleh NULL), judul, pesan, is_read (default 0), created_at.

Relasi utama
users 1-N pengajuan (sebagai mahasiswa), persetujuan (sebagai pimpinan), log_aktivitas, riwayat_status (pelaku), notifikasi (penerima).
jenis_layanan 1-N syarat_layanan, pengajuan; jenis_layanan 1-1 template_surat. penanda_tangan 1-N jenis_layanan.
pengajuan 1-N berkas_pengajuan, persetujuan, riwayat_status, notifikasi; pengajuan 1-1 surat_resmi.
syarat_layanan 1-N berkas_pengajuan. surat_resmi 1-N public_verification.

Perbedaan dengan ERD A3 dan docs lain
1. Status pengajuan: ENUM database dipakai apa adanya. docs/alur-status.md memetakan nilai database ke label antarmuka (misalnya pending_kakor/pending_wadek1/pending_dekan tampil "Menunggu Persetujuan", disetujui tampil "Selesai"). Pemetaan ini sudah disetujui tim (24 November 2026); bila ternyata perlu diubah, perbaiki di sini dan di alur-status.md.
2. Status draf surat, nilai 'returned' untuk "Kembalikan dengan catatan", verifikasi per dokumen, dan status akun sudah ditambahkan lewat migrasi 002.
3. Nama tabel dan kolom berbeda dengan ERD: users.user_id menjadi users.id; tabel mahasiswa digabung ke users; persyaratan_layanan menjadi syarat_layanan; dokumen_pengajuan menjadi berkas_pengajuan; surat menjadi surat_resmi; pengaturan_tte menjadi config_tte; pengajuan.catatan_terakhir menjadi catatan_revisi.

Aturan data
Mahasiswa hanya boleh mengakses baris miliknya sendiri (pengajuan, berkas, surat, notifikasi, profil).
Jangan menyimpan kata sandi atau kunci rahasia dalam teks biasa; jangan mencatatnya ke log.
Akses berkas persyaratan harus lewat pemeriksaan hak akses, bukan URL file langsung.
Jangan menaruh data asli mahasiswa di schema.sql, migrasi, atau data contoh.
Backup basis data dan berkas arsip dilakukan berkala (usulan minimal sekali sehari).
