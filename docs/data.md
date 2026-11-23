Struktur data

Sumber kebenaran skema: `server/database/schema.sql` (struktur yang diekspor dari database pengembangan, 2026-11-23) ditambah file di `server/database/migrations/` yang dijalankan berurutan. Dokumen ini meringkas isinya. ERD pada A3 (Gambar 3.23) adalah rancangan awal; skema yang dipakai kode sudah berbeda, lihat bagian "Perbedaan dengan ERD A3" di bawah.

Cara menyiapkan database kosong
1. Buat database sesuai DB_NAME di server/.env (XAMPP, phpMyAdmin).
2. Impor server/database/schema.sql.
3. Jalankan file di server/database/migrations/ berurutan dari nomor terkecil.

Cara mengubah skema
- Jangan mengedit tabel langsung di phpMyAdmin tanpa jejak. Buat file migrasi baru bernomor urut, misalnya `002_nama_perubahan.sql`, berisi perintah ALTER/CREATE yang aman dijalankan ulang bila memungkinkan.
- Perbarui dokumen ini pada commit yang sama.
- Beri tahu tim karena setiap anggota perlu menjalankan migrasi itu di database lokalnya.

Konvensi kolom
- Kunci utama setiap tabel bernama `id` (INT AUTO_INCREMENT). Kunci asing bernama `<tabel>_id`.
- Waktu: `created_at`, dan `updated_at` bila baris bisa berubah.
- Nilai ya/tidak memakai TINYINT(1) dengan awalan `is_` (misalnya `is_active`, `is_read`).
- Charset utf8mb4, collation utf8mb4_general_ci, engine InnoDB.

Tabel (11 di schema.sql + 2 dari migrasi 001)

users: id, identifier (NIM/NIP, unik), nama, email (unik), password (hash bcrypt, tidak boleh teks biasa), role, prodi, no_hp, created_at, updated_at.
  role = ENUM('mahasiswa', 'staf', 'kakor', 'wadek1', 'dekan'). kakor = Kepala Kantor, wadek1 = Wakil Dekan 1. Staf Akademik (`staf`) juga bertindak sebagai admin.
  Data akademik mahasiswa (NIM, prodi) disimpan langsung di tabel ini; tidak ada tabel mahasiswa terpisah.

jenis_layanan: id, kode_layanan (unik), nama_layanan, deskripsi, is_active, created_at.

syarat_layanan: id, jenis_layanan_id (FK), nama_syarat, tipe_file (default 'pdf'), is_required. Satu layanan punya banyak syarat. Pengajuan baru bisa dikirim bila semua syarat dengan is_required = 1 sudah ada berkasnya.

template_surat: id, jenis_layanan_id (FK, unik: satu template per layanan), header_surat, body_template, footer_surat, updated_at. Template berisi variabel dinamis yang diganti dari data pengajuan dan mahasiswa.

pengajuan: id, no_referensi (unik), mahasiswa_id (FK ke users.id), jenis_layanan_id (FK), keperluan, status, catatan_revisi, created_at, updated_at.
  status = ENUM('diajukan', 'perlu_perbaikan', 'diverifikasi', 'pending_kakor', 'pending_wadek1', 'pending_dekan', 'disetujui', 'ditolak'), default 'diajukan'. Arti, label tampilan, dan perpindahan yang diizinkan ada di docs/alur-status.md. Format no_referensi [BELUM FINAL].

berkas_pengajuan: id, pengajuan_id (FK), syarat_layanan_id (FK), file_path, original_name, created_at. File disimpan di server/uploads/requirements/ dan hanya boleh dibuka lewat endpoint yang memeriksa hak akses.

persetujuan: id, pengajuan_id (FK), pimpinan_id (FK ke users.id), role_pimpinan ENUM('kakor', 'wadek1', 'dekan'), status ENUM('approved', 'rejected'), catatan, created_at. Satu baris per keputusan pejabat.

surat_resmi: id, pengajuan_id (FK, unik: satu surat per pengajuan), no_surat (unik), file_pdf_path, hash_sha256, qr_code_path, tgl_terbit, created_at. PDF di server/uploads/letters/.

public_verification: id, surat_id (FK ke surat_resmi), scanned_at, user_agent, ip_address. Mencatat setiap pemeriksaan keaslian surat lewat halaman publik.

config_tte: id, provider_name, api_endpoint, encrypted_secret_key (terenkripsi, tidak pernah ditampilkan kembali), is_active, updated_at. Hanya dikelola Dekan (dibatasi di kode, bukan di database).

log_aktivitas: id, user_id (FK, SET NULL bila akun dihapus), action, description, ip_address, created_at. Hanya boleh ditambah; tidak boleh diubah atau dihapus lewat antarmuka. Dipakai untuk login, pembukaan dokumen persyaratan, paraf, keputusan, penerbitan dan unduhan surat, serta perubahan pengaturan TTE.

riwayat_status (migrasi 001): id, pengajuan_id (FK), user_id (FK pelaku, boleh NULL), status_sebelumnya (NULL untuk pengiriman pertama), status_baru, catatan, created_at. Satu baris untuk setiap perpindahan status pengajuan. Nilai status sama dengan pengajuan.status.

notifikasi (migrasi 001): id, user_id (FK penerima), pengajuan_id (FK, boleh NULL), judul, pesan, is_read (default 0), created_at.

Relasi utama
users 1-N pengajuan (sebagai mahasiswa), persetujuan (sebagai pimpinan), log_aktivitas, riwayat_status (pelaku), notifikasi (penerima).
jenis_layanan 1-N syarat_layanan, pengajuan; jenis_layanan 1-1 template_surat.
pengajuan 1-N berkas_pengajuan, persetujuan, riwayat_status, notifikasi; pengajuan 1-1 surat_resmi.
syarat_layanan 1-N berkas_pengajuan. surat_resmi 1-N public_verification.

Perbedaan dengan ERD A3 dan docs lain [BELUM FINAL: perlu keputusan tim]
1. Status pengajuan: ENUM database dipakai apa adanya. docs/alur-status.md memetakan nilai database ke label antarmuka (misalnya pending_kakor/pending_wadek1/pending_dekan tampil "Menunggu Persetujuan", disetujui tampil "Selesai"). Usulan ini perlu dikonfirmasi tim sebelum issue #71 dikerjakan.
2. Status draf surat (Belum Dibuat, Draf Dibuat, Dikembalikan untuk Revisi) belum punya tempat penyimpanan; surat_resmi juga belum punya kolom lokasi draf.
3. persetujuan.status hanya 'approved' dan 'rejected'; belum ada nilai untuk "Kembalikan dengan catatan" yang dipakai Kepala Kantor, Wakil Dekan, dan Dekan.
4. berkas_pengajuan belum punya status dan catatan verifikasi per dokumen, padahal halaman pemeriksaan staf menandai tiap dokumen Sesuai atau Tidak Sesuai.
5. users belum punya status akun (aktif/nonaktif), jadi login belum bisa menolak akun nonaktif.
6. Nama tabel dan kolom berbeda dengan ERD: users.user_id menjadi users.id; tabel mahasiswa digabung ke users; persyaratan_layanan menjadi syarat_layanan; dokumen_pengajuan menjadi berkas_pengajuan; surat menjadi surat_resmi; pengaturan_tte menjadi config_tte; pengajuan.catatan_terakhir menjadi catatan_revisi.

Aturan data
Mahasiswa hanya boleh mengakses baris miliknya sendiri (pengajuan, berkas, surat, notifikasi, profil).
Jangan menyimpan kata sandi atau kunci rahasia dalam teks biasa; jangan mencatatnya ke log.
Akses berkas persyaratan harus lewat pemeriksaan hak akses, bukan URL file langsung.
Jangan menaruh data asli mahasiswa di schema.sql, migrasi, atau data contoh.
Backup basis data dan berkas arsip dilakukan berkala (usulan minimal sekali sehari).
