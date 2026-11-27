-- Migrasi 006: foto profil pengguna
-- Foto disimpan sebagai data URL gambar JPG/PNG pada akun milik pengguna.

SET NAMES utf8mb4;

ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `foto_profil` mediumtext DEFAULT NULL AFTER `no_hp`;

-- Untuk membatalkan migrasi:
-- ALTER TABLE `users` DROP COLUMN `foto_profil`;
