-- Skema database Sistem Informasi Layanan Kemahasiswaan FTI Unand
-- Diekspor dari database pengembangan (MariaDB 10.4 / XAMPP) pada 2026-11-23.
-- Hanya STRUKTUR tabel, tanpa data. Jangan menambahkan data asli mahasiswa ke file ini.
--
-- Cara pakai (database kosong): buat database sesuai DB_NAME di server/.env, lalu impor
-- file ini lewat phpMyAdmin (tab Import), kemudian jalankan file di folder migrations/ berurutan.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `identifier` varchar(50) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('mahasiswa','staf','kakor','wadek1','dekan') NOT NULL,
  `prodi` varchar(100) DEFAULT NULL,
  `no_hp` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `identifier` (`identifier`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `jenis_layanan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `kode_layanan` varchar(20) NOT NULL,
  `nama_layanan` varchar(100) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `kode_layanan` (`kode_layanan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `syarat_layanan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `jenis_layanan_id` int(11) NOT NULL,
  `nama_syarat` varchar(150) NOT NULL,
  `tipe_file` varchar(50) DEFAULT 'pdf',
  `is_required` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `jenis_layanan_id` (`jenis_layanan_id`),
  CONSTRAINT `syarat_layanan_ibfk_1` FOREIGN KEY (`jenis_layanan_id`) REFERENCES `jenis_layanan` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `template_surat` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `jenis_layanan_id` int(11) NOT NULL,
  `header_surat` text DEFAULT NULL,
  `body_template` longtext NOT NULL,
  `footer_surat` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `jenis_layanan_id` (`jenis_layanan_id`),
  CONSTRAINT `template_surat_ibfk_1` FOREIGN KEY (`jenis_layanan_id`) REFERENCES `jenis_layanan` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `config_tte` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `provider_name` varchar(100) NOT NULL DEFAULT 'Internal FTI Security',
  `api_endpoint` varchar(255) DEFAULT NULL,
  `encrypted_secret_key` text NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `log_aktivitas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `log_aktivitas_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `pengajuan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `no_referensi` varchar(50) NOT NULL,
  `mahasiswa_id` int(11) NOT NULL,
  `jenis_layanan_id` int(11) NOT NULL,
  `keperluan` text NOT NULL,
  `status` enum('diajukan','perlu_perbaikan','diverifikasi','pending_kakor','pending_wadek1','pending_dekan','disetujui','ditolak') DEFAULT 'diajukan',
  `catatan_revisi` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `no_referensi` (`no_referensi`),
  KEY `mahasiswa_id` (`mahasiswa_id`),
  KEY `jenis_layanan_id` (`jenis_layanan_id`),
  CONSTRAINT `pengajuan_ibfk_1` FOREIGN KEY (`mahasiswa_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pengajuan_ibfk_2` FOREIGN KEY (`jenis_layanan_id`) REFERENCES `jenis_layanan` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `berkas_pengajuan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pengajuan_id` int(11) NOT NULL,
  `syarat_layanan_id` int(11) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `pengajuan_id` (`pengajuan_id`),
  KEY `syarat_layanan_id` (`syarat_layanan_id`),
  CONSTRAINT `berkas_pengajuan_ibfk_1` FOREIGN KEY (`pengajuan_id`) REFERENCES `pengajuan` (`id`) ON DELETE CASCADE,
  CONSTRAINT `berkas_pengajuan_ibfk_2` FOREIGN KEY (`syarat_layanan_id`) REFERENCES `syarat_layanan` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `persetujuan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pengajuan_id` int(11) NOT NULL,
  `pimpinan_id` int(11) NOT NULL,
  `role_pimpinan` enum('kakor','wadek1','dekan') NOT NULL,
  `status` enum('approved','rejected') NOT NULL,
  `catatan` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `pengajuan_id` (`pengajuan_id`),
  KEY `pimpinan_id` (`pimpinan_id`),
  CONSTRAINT `persetujuan_ibfk_1` FOREIGN KEY (`pengajuan_id`) REFERENCES `pengajuan` (`id`) ON DELETE CASCADE,
  CONSTRAINT `persetujuan_ibfk_2` FOREIGN KEY (`pimpinan_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `surat_resmi` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pengajuan_id` int(11) NOT NULL,
  `no_surat` varchar(100) DEFAULT NULL,
  `file_pdf_path` varchar(255) DEFAULT NULL,
  `hash_sha256` varchar(64) DEFAULT NULL,
  `qr_code_path` varchar(255) DEFAULT NULL,
  `tgl_terbit` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `pengajuan_id` (`pengajuan_id`),
  UNIQUE KEY `no_surat` (`no_surat`),
  CONSTRAINT `surat_resmi_ibfk_1` FOREIGN KEY (`pengajuan_id`) REFERENCES `pengajuan` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `public_verification` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `surat_id` int(11) NOT NULL,
  `scanned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `user_agent` varchar(255) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `surat_id` (`surat_id`),
  CONSTRAINT `public_verification_ibfk_1` FOREIGN KEY (`surat_id`) REFERENCES `surat_resmi` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET FOREIGN_KEY_CHECKS = 1;
