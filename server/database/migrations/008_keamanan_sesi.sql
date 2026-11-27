-- Migrasi 008: keamanan sesi dan kata sandi
-- 1. wajib_ganti_sandi: diisi 1 saat Staf Akademik mereset kata sandi mahasiswa (kata sandi sementara).
--    Selama bernilai 1, pengguna hanya bisa membuka halaman ganti kata sandi.
-- 2. versi_token: dimuat di setiap token login. Nilainya naik saat logout, ganti kata sandi, atau reset,
--    sehingga semua token lama langsung ditolak server (middlewares/authMiddleware.js).

SET NAMES utf8mb4;

ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `wajib_ganti_sandi` tinyint(1) NOT NULL DEFAULT 0 COMMENT '1 = harus mengganti kata sandi sementara sebelum memakai sistem' AFTER `password`,
  ADD COLUMN IF NOT EXISTS `versi_token` int(10) unsigned NOT NULL DEFAULT 0 COMMENT 'Naik saat logout atau kata sandi berubah; token dengan versi lama ditolak' AFTER `wajib_ganti_sandi`;

-- Untuk membatalkan migrasi ini:
-- ALTER TABLE `users` DROP COLUMN `wajib_ganti_sandi`, DROP COLUMN `versi_token`;
