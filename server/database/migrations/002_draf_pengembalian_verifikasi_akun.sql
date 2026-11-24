-- Migrasi 002: status draf surat, pengembalian draf oleh pejabat, verifikasi per berkas, status akun
-- Alasan: menutup kekurangan skema di docs/data.md (bagian "Perbedaan dengan ERD A3", butir 2 sampai 5)
-- yang menghalangi pemeriksaan staf (#71), penyusunan draf (#81, #82), dan paraf berjenjang (#88).
--
-- Butuh MariaDB 10.0.2 atau lebih baru (XAMPP memakai MariaDB 10.4). ADD COLUMN IF NOT EXISTS
-- membuat migrasi ini aman dijalankan lebih dari sekali. Jalankan setelah migrasi 001.

SET NAMES utf8mb4;

-- 1. Draf surat disimpan di surat_resmi (satu baris per pengajuan).
--    Baris dibuat saat staf pertama kali menyimpan draf. Pengajuan berstatus 'diverifikasi' yang belum
--    punya baris surat_resmi ditampilkan sebagai "Belum Dibuat".
--    status_draf:
--      dibuat       = draf tersimpan, belum diteruskan ("Draf Dibuat")
--      dikembalikan = dikembalikan pejabat untuk direvisi ("Dikembalikan untuk Revisi")
--      diteruskan   = sedang dalam alur paraf (pengajuan berstatus pending_kakor/wadek1/dekan)
--      terbit       = disetujui Dekan; no_surat, hash_sha256, qr_code_path, file_pdf_path, tgl_terbit terisi
ALTER TABLE `surat_resmi`
  ADD COLUMN IF NOT EXISTS `status_draf` enum('dibuat','dikembalikan','diteruskan','terbit') NOT NULL DEFAULT 'dibuat' AFTER `pengajuan_id`,
  ADD COLUMN IF NOT EXISTS `isi_draf` longtext DEFAULT NULL COMMENT 'Isi surat setelah variabel template diganti; bisa disunting staf' AFTER `status_draf`,
  ADD COLUMN IF NOT EXISTS `file_draf_path` varchar(255) DEFAULT NULL COMMENT 'PDF pratinjau draf di uploads/letters/' AFTER `isi_draf`,
  ADD COLUMN IF NOT EXISTS `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp();

-- 2. Pejabat (Kepala Kantor, Wakil Dekan 1, Dekan) bisa "Kembalikan dengan catatan".
ALTER TABLE `persetujuan`
  MODIFY `status` enum('approved','rejected','returned') NOT NULL;

-- 3. Hasil pemeriksaan staf untuk setiap dokumen (Sesuai / Tidak Sesuai).
ALTER TABLE `berkas_pengajuan`
  ADD COLUMN IF NOT EXISTS `status_verifikasi` enum('belum_diperiksa','sesuai','tidak_sesuai') NOT NULL DEFAULT 'belum_diperiksa',
  ADD COLUMN IF NOT EXISTS `catatan_verifikasi` text DEFAULT NULL;

-- 4. Akun nonaktif ditolak saat login dan saat memperpanjang sesi.
ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `is_active` tinyint(1) NOT NULL DEFAULT 1 AFTER `no_hp`;

-- Untuk membatalkan migrasi ini (kolom baru beserta isinya ikut terhapus).
-- Ubah dulu baris persetujuan berstatus 'returned' sebelum menjalankan MODIFY terakhir.
-- ALTER TABLE `surat_resmi` DROP COLUMN `status_draf`, DROP COLUMN `isi_draf`, DROP COLUMN `file_draf_path`, DROP COLUMN `updated_at`;
-- ALTER TABLE `berkas_pengajuan` DROP COLUMN `status_verifikasi`, DROP COLUMN `catatan_verifikasi`;
-- ALTER TABLE `users` DROP COLUMN `is_active`;
-- ALTER TABLE `persetujuan` MODIFY `status` enum('approved','rejected') NOT NULL;
