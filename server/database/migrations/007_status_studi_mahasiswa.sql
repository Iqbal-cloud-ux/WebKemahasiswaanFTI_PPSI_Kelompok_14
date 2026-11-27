-- Migrasi 007: status studi mahasiswa (keputusan tim 27 November 2026)
-- Akun mahasiswa ditutup otomatis bila:
--   1. sudah lulus, 30 hari setelah tgl_lulus (masa tenggang untuk mengunduh surat), atau
--   2. masa studi melewati 14 semester + tambahan_semester (perpanjangan karena cuti, diisi Staf Akademik).
-- tgl_lulus diisi otomatis saat Surat Keterangan Lulus terbit, atau oleh Staf Akademik di Manajemen Akun.
-- Aturannya ada di server/src/utils/statusStudi.js.

SET NAMES utf8mb4;

ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `tgl_lulus` date DEFAULT NULL COMMENT 'Tanggal mahasiswa ditandai lulus; akun ditutup 30 hari setelahnya' AFTER `angkatan`,
  ADD COLUMN IF NOT EXISTS `tambahan_semester` tinyint(3) unsigned NOT NULL DEFAULT 0 COMMENT 'Perpanjangan batas 14 semester, misalnya karena cuti' AFTER `tgl_lulus`;

-- Untuk membatalkan migrasi ini:
-- ALTER TABLE `users` DROP COLUMN `tgl_lulus`, DROP COLUMN `tambahan_semester`;
