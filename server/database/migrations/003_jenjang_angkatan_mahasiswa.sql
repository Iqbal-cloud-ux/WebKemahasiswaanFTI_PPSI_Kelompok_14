-- Migrasi 003: jenjang dan angkatan mahasiswa
-- Alasan: Permohonan Penyesuaian UKT hanya untuk mahasiswa S1 yang aktif mulai semester 3
-- (docs/persyaratan-layanan.md, layanan 4). Sistem perlu jenjang dan angkatan untuk memeriksanya.
-- Semester dihitung dari angkatan, sehingga tidak perlu diperbarui setiap semester.
--
-- Butuh MariaDB 10.0.2 atau lebih baru. Aman dijalankan lebih dari sekali. Jalankan setelah migrasi 002.
-- Kedua kolom boleh kosong: akun staf dan pimpinan tidak memakainya.

SET NAMES utf8mb4;

ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `jenjang` varchar(10) DEFAULT NULL COMMENT 'Jenjang studi mahasiswa, misalnya S1' AFTER `prodi`,
  ADD COLUMN IF NOT EXISTS `angkatan` smallint(4) DEFAULT NULL COMMENT 'Tahun masuk mahasiswa, misalnya 2023' AFTER `jenjang`;

-- Untuk membatalkan migrasi ini:
-- ALTER TABLE `users` DROP COLUMN `jenjang`, DROP COLUMN `angkatan`;
