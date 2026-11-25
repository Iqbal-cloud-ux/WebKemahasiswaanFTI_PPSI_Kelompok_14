-- Migrasi 005: format nomor surat per layanan dan nomor urut surat per tahun
-- Alasan (keputusan 25 November 2026):
-- 1. Format nomor surat diatur Staf Akademik per jenis layanan, karena kode klasifikasi tiap jenis surat
--    berbeda (misalnya B/{urut}/UN.16.15/KM.00.00/{tahun}). Disimpan bersama template surat.
-- 2. Nomor urut ({urut}) memakai SATU urutan bersama untuk semua surat yang terbit, mulai dari 1 setiap
--    tahun, seperti buku agenda surat keluar. Staf bisa mengatur nomor terakhir agar melanjutkan
--    nomor yang sudah dipakai di luar sistem.
-- Nomor diberikan saat Dekan menyetujui (docs/alur-status.md); surat_resmi.no_surat tetap unik.
--
-- Butuh MariaDB 10.0.2 atau lebih baru. Aman dijalankan lebih dari sekali. Jalankan setelah migrasi 004.

SET NAMES utf8mb4;

ALTER TABLE `template_surat`
  ADD COLUMN IF NOT EXISTS `format_nomor` varchar(150) DEFAULT NULL
    COMMENT 'Format nomor surat; penanda {urut}, {tahun}, {bulan} (Romawi)' AFTER `footer_surat`;

CREATE TABLE IF NOT EXISTS `nomor_surat_urut` (
  `tahun` smallint(4) NOT NULL,
  `nomor_terakhir` int(11) NOT NULL DEFAULT 0 COMMENT 'Nomor urut terakhir yang sudah dipakai pada tahun itu',
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`tahun`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Untuk membatalkan migrasi ini:
-- ALTER TABLE `template_surat` DROP COLUMN `format_nomor`;
-- DROP TABLE `nomor_surat_urut`;
