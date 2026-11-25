-- Migrasi 004: penanda tangan surat dan isian tambahan pengajuan
-- Alasan: template surat disesuaikan dengan contoh surat resmi FTI (keputusan 25 November 2026).
-- 1. Surat resmi ditandatangani pejabat yang berbeda per layanan (Kepala Kantor, Kepala Seksi,
--    Wakil Dekan I, Dekan), dan pejabatnya bisa berganti. Data pejabat dikelola Staf Akademik di
--    tabel penanda_tangan, bukan ditulis mati di template.
-- 2. Surat resmi memuat data yang tidak ada di tabel users (data orang tua, data kelulusan, alamat,
--    dan seterusnya). Data itu diisi mahasiswa saat mengajukan, lalu diverifikasi dan bisa dikoreksi staf.
-- 3. Data penanda tangan disalin ke surat_resmi saat draf disimpan, agar surat yang sudah terbit
--    tidak ikut berubah (dan hash-nya tetap cocok) ketika pejabat berganti.
--
-- Butuh MariaDB 10.0.2 atau lebih baru (XAMPP memakai MariaDB 10.4). Aman dijalankan lebih dari sekali.
-- Jalankan setelah migrasi 003.

SET NAMES utf8mb4;

-- 1. Pejabat penanda tangan surat.
CREATE TABLE IF NOT EXISTS `penanda_tangan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama` varchar(150) NOT NULL COMMENT 'Nama lengkap beserta gelar, sesuai yang dicetak di surat',
  `nip` varchar(30) DEFAULT NULL,
  `pangkat_golongan` varchar(100) DEFAULT NULL COMMENT 'Misalnya Penata Tk. I / III/d',
  `jabatan` varchar(150) NOT NULL COMMENT 'Jabatan yang dicetak di blok tanda tangan',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `nip` (`nip`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. Penanda tangan per jenis layanan, beserta baris "atas nama" di atas jabatan (boleh kosong).
ALTER TABLE `jenis_layanan`
  ADD COLUMN IF NOT EXISTS `penanda_tangan_id` int(11) DEFAULT NULL AFTER `is_active`,
  ADD COLUMN IF NOT EXISTS `atas_nama` varchar(150) DEFAULT NULL COMMENT 'Misalnya a.n. Wakil Dekan I' AFTER `penanda_tangan_id`;

ALTER TABLE `jenis_layanan`
  ADD CONSTRAINT `jenis_layanan_penanda_tangan_fk` FOREIGN KEY IF NOT EXISTS (`penanda_tangan_id`)
    REFERENCES `penanda_tangan` (`id`) ON DELETE SET NULL;

-- 3. Isian tambahan dari mahasiswa (JSON: { "nama_isian": "nilai" }). Daftar isian per layanan
--    didefinisikan di server/src/utils/templateSurat.js.
ALTER TABLE `pengajuan`
  ADD COLUMN IF NOT EXISTS `data_isian` longtext DEFAULT NULL CHECK (`data_isian` IS NULL OR json_valid(`data_isian`)) AFTER `keperluan`;

-- 4. Salinan data penanda tangan saat draf disimpan (JSON: nama, nip, pangkat_golongan, jabatan, atas_nama).
ALTER TABLE `surat_resmi`
  ADD COLUMN IF NOT EXISTS `penanda_tangan` longtext DEFAULT NULL CHECK (`penanda_tangan` IS NULL OR json_valid(`penanda_tangan`)) AFTER `file_draf_path`;

-- Untuk membatalkan migrasi ini (kolom baru beserta isinya ikut terhapus):
-- ALTER TABLE `surat_resmi` DROP COLUMN `penanda_tangan`;
-- ALTER TABLE `pengajuan` DROP COLUMN `data_isian`;
-- ALTER TABLE `jenis_layanan` DROP FOREIGN KEY `jenis_layanan_penanda_tangan_fk`;
-- ALTER TABLE `jenis_layanan` DROP COLUMN `penanda_tangan_id`, DROP COLUMN `atas_nama`;
-- DROP TABLE `penanda_tangan`;
