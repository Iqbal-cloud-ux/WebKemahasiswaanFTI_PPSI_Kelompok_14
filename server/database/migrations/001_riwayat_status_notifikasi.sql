-- Migrasi 001: tabel riwayat_status dan notifikasi
-- Alasan: AGENTS.md aturan 2 dan docs/alur-status.md mewajibkan setiap perpindahan status
-- pengajuan mencatat satu baris riwayat dan mengirim notifikasi ke mahasiswa.
-- Kedua tabel ini belum ada di schema.sql.
--
-- Aman dijalankan lebih dari sekali (IF NOT EXISTS). Tidak mengubah tabel lain.
-- Jalankan lewat phpMyAdmin (tab SQL atau Import) pada database sesuai DB_NAME.

SET NAMES utf8mb4;

-- Satu baris per perpindahan status pengajuan.
-- Kolom status memakai VARCHAR (bukan ENUM) karena daftar status final belum diputuskan;
-- nilainya harus sama dengan nilai pengajuan.status.
CREATE TABLE IF NOT EXISTS `riwayat_status` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pengajuan_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL COMMENT 'Pelaku perubahan; NULL bila oleh sistem atau akunnya sudah dihapus',
  `status_sebelumnya` varchar(30) DEFAULT NULL COMMENT 'NULL untuk pengajuan pertama kali dikirim',
  `status_baru` varchar(30) NOT NULL,
  `catatan` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `riwayat_pengajuan_waktu` (`pengajuan_id`, `created_at`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `riwayat_status_ibfk_1` FOREIGN KEY (`pengajuan_id`) REFERENCES `pengajuan` (`id`) ON DELETE CASCADE,
  CONSTRAINT `riwayat_status_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Pemberitahuan dalam aplikasi untuk satu pengguna (umumnya mahasiswa pemilik pengajuan).
CREATE TABLE IF NOT EXISTS `notifikasi` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL COMMENT 'Penerima notifikasi',
  `pengajuan_id` int(11) DEFAULT NULL COMMENT 'Pengajuan terkait; NULL untuk pemberitahuan umum',
  `judul` varchar(150) NOT NULL,
  `pesan` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `notifikasi_penerima` (`user_id`, `is_read`, `created_at`),
  KEY `pengajuan_id` (`pengajuan_id`),
  CONSTRAINT `notifikasi_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notifikasi_ibfk_2` FOREIGN KEY (`pengajuan_id`) REFERENCES `pengajuan` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Untuk membatalkan migrasi ini (hapus kedua tabel beserta isinya):
-- DROP TABLE IF EXISTS `notifikasi`;
-- DROP TABLE IF EXISTS `riwayat_status`;
