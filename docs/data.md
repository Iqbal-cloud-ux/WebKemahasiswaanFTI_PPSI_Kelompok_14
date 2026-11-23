Struktur data

Sumber: ERD pada A3 (Gambar 3.23, subbab 3.3) dan diagram kelas (Gambar 3.1). Nama tabel dan kolom di bawah mengikuti ERD. Ini rancangan awal dan boleh berubah sesuai kebutuhan pengembangan; sumber kebenaran skema adalah database dan kode yang benar-benar ada. Bila skema berubah, perbarui file ini. Pusat proses adalah tabel pengajuan.

Tabel (11 pada ERD)

users: user_id (PK), nama, email, password (disimpan sebagai hash, tidak boleh teks biasa), role, status_akun. role memuat lima peran: Mahasiswa, Staf Akademik, Kepala Kantor, Wakil Dekan, Dekan. Nilai teks role belum ditetapkan [BELUM FINAL].

mahasiswa: mahasiswa_id (PK), user_id (FK ke users, satu-ke-satu), nim, program_studi, angkatan, no_telepon.

jenis_layanan: layanan_id (PK), nama_layanan, deskripsi, status_aktif.

persyaratan_layanan: persyaratan_id (PK), layanan_id (FK), nama_persyaratan, wajib. Satu layanan punya banyak persyaratan. Validasi kelengkapan: semua persyaratan wajib harus ada dokumennya sebelum pengajuan bisa dikirim.

template_surat: template_id (PK), layanan_id (FK), nama_template, lokasi_template, status_aktif. Template berisi variabel dinamis yang diganti dari data pengajuan dan mahasiswa.

pengajuan: pengajuan_id (PK), mahasiswa_id (FK), layanan_id (FK), tanggal_pengajuan, status_pengajuan, catatan_terakhir. Nomor referensi pengajuan dibuat otomatis [BELUM FINAL: format].

dokumen_pengajuan: dokumen_id (PK), pengajuan_id (FK), persyaratan_id (FK), nama_file, lokasi_file, status_verifikasi, catatan_verifikasi, diunggah_pada. File disimpan di server/uploads/requirements/.

surat: surat_id (PK), pengajuan_id (FK), template_id (FK), nomor_surat, lokasi_draf, lokasi_surat_final, hash_dokumen, kode_verifikasi, tanggal_terbit. File di server/uploads/letters/.

persetujuan: persetujuan_id (PK), surat_id (FK), user_id (FK pejabat), tahap_persetujuan, keputusan, catatan, tanggal_keputusan. Satu surat melewati beberapa tahap (Kepala Kantor, Wakil Dekan, Dekan).

notifikasi: notifikasi_id (PK), user_id (FK), pengajuan_id (FK), judul, pesan, dibaca, dibuat_pada.

riwayat_status: riwayat_id (PK), pengajuan_id (FK), user_id (FK pelaku), status_sebelumnya, status_baru, catatan, waktu_perubahan.

Relasi utama
users 1-1 mahasiswa; users 1-N notifikasi, persetujuan, riwayat_status.
mahasiswa 1-N pengajuan; jenis_layanan 1-N pengajuan, persyaratan_layanan, template_surat.
pengajuan 1-N dokumen_pengajuan, notifikasi, riwayat_status; pengajuan 1-N surat (umumnya satu).
persyaratan_layanan 1-N dokumen_pengajuan.
surat 1-N persetujuan.
Ada di diagram kelas tetapi belum di ERD [BELUM FINAL: tambahkan migrasi]
log_aktivitas (hanya boleh ditambah, tidak boleh diubah atau dihapus lewat antarmuka): mencatat login, pembukaan dokumen persyaratan, paraf, keputusan, penerbitan dan unduhan surat, serta perubahan pengaturan TTE.
pengaturan_tte: provider pengesahan (Internal Engine atau External BSrE API), endpoint, identitas klien, kunci rahasia terenkripsi (tidak pernah ditampilkan kembali). Hanya dikelola Dekan.
Aturan data
Mahasiswa hanya boleh mengakses baris miliknya sendiri (pengajuan, dokumen, surat, notifikasi, profil).
Jangan menyimpan kata sandi atau kunci rahasia dalam teks biasa; jangan mencatatnya ke log.
Akses berkas persyaratan harus lewat pemeriksaan hak akses, bukan URL file langsung.
Backup basis data dan berkas arsip dilakukan berkala (usulan minimal sekali sehari).