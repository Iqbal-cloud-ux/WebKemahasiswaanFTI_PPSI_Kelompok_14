Alur status pengajuan

Sumber: A1 (FSM), A2 (kebutuhan dan BPMN To-Be), A3 (use case dan sequence diagram), disesuaikan dengan ENUM pengajuan.status di database (server/database/schema.sql). Kode dan database memakai nilai teknis di kolom pertama; antarmuka menampilkan label di kolom kedua. Pemetaan ini usulan dan ditandai [BELUM FINAL] sampai tim mengonfirmasi.

Status (pengajuan.status)
Nilai database	Label di antarmuka	Arti
diajukan	Diajukan	Mahasiswa sudah mengirim; menunggu pemeriksaan berkas oleh Staf Akademik
perlu_perbaikan	Perlu Perbaikan	Staf meminta mahasiswa memperbaiki berkas
diverifikasi	Diverifikasi / Diproses	Berkas lengkap dan sah; staf menyusun draf surat. Disebut "Diproses" bila draf sudah dibuat atau dikembalikan untuk revisi
pending_kakor	Menunggu Persetujuan	Draf diteruskan; menunggu paraf Kepala Kantor
pending_wadek1	Menunggu Persetujuan	Sudah diparaf Kepala Kantor; menunggu paraf Wakil Dekan 1
pending_dekan	Menunggu Persetujuan	Sudah diparaf lengkap; menunggu keputusan Dekan
disetujui	Selesai	Dekan menyetujui; surat terbit, ber-QR, dan sudah diarsipkan (status akhir)
ditolak	Ditolak	Berkas terindikasi tidak sah, atau Dekan menolak (status akhir)

Catatan pemetaan:
- Docs lama memakai status "Diproses" terpisah. Di database, tahap menyusun draf tetap berstatus diverifikasi; kemajuan draf dilacak lewat status draf (lihat bawah).
- "Menunggu Persetujuan" dipecah per tahap paraf, sehingga sistem tahu siapa yang sedang memegang draf. Mahasiswa cukup melihat label "Menunggu Persetujuan"; staf dan pimpinan boleh melihat tahapnya.
- A1 menyebut "Disetujui" dan "Selesai" sebagai dua status. Di sini keduanya satu: disetujui hanya diset setelah surat berhasil terbit, dan ditampilkan sebagai "Selesai".

Perpindahan yang diizinkan

Aktor menunjukkan siapa yang boleh memicu. Semua perpindahan lain harus ditolak server (misalnya diajukan langsung ke disetujui).

diajukan -> diverifikasi: Staf Akademik (berkas lengkap dan sesuai).
diajukan -> perlu_perbaikan: Staf Akademik (wajib catatan; disimpan di pengajuan.catatan_revisi).
diajukan -> ditolak: Staf Akademik (berkas terindikasi tidak sah; wajib alasan).
perlu_perbaikan -> diajukan: Mahasiswa pemilik pengajuan (mengajukan ulang setelah memperbaiki berkas).
diverifikasi -> pending_kakor: Staf Akademik (menekan Teruskan pada draf yang sudah dibuat).
pending_kakor -> pending_wadek1: Kepala Kantor (Setujui dan Paraf).
pending_wadek1 -> pending_dekan: Wakil Dekan 1 (Setujui dan Paraf).
pending_dekan -> disetujui: Dekan (Setujui). Memicu penerbitan surat otomatis (lihat bawah).
pending_dekan -> ditolak: Dekan (Tolak; wajib alasan).
pending_kakor, pending_wadek1, atau pending_dekan -> diverifikasi: pejabat pada tahap itu (Kembalikan dengan catatan). Draf berstatus "Dikembalikan untuk Revisi"; staf merevisi lalu meneruskan lagi mulai dari pending_kakor.

Catatan: A1 menggambarkan "Perlu Perbaikan" dari status Diverifikasi, sedangkan A2/A3 menempatkan pemeriksaan berkas langsung dari Diajukan. Alur di atas mengikuti A2/A3 [BELUM FINAL].

Tahap persetujuan berjenjang

Urutan paraf: Kepala Kantor (kakor) -> Wakil Dekan 1 (wadek1) -> Dekan. Urutan per jenis surat dan siapa yang berwenang menandatangani tiap jenis surat masih perlu dikonfirmasi [BELUM FINAL]. Setiap keputusan pejabat dicatat satu baris di tabel persetujuan (pimpinan_id, role_pimpinan, status, catatan, created_at).
Saat ini persetujuan.status hanya punya nilai approved dan rejected. Untuk "Kembalikan dengan catatan" perlu nilai tambahan (misalnya returned) lewat migrasi baru [BELUM FINAL].

Efek samping setiap perpindahan (wajib)
Mengubah pengajuan.status (dan pengajuan.catatan_revisi bila ada catatan).
Menambah satu baris riwayat_status (pengajuan_id, user_id pelaku, status_sebelumnya, status_baru, catatan).
Membuat notifikasi untuk mahasiswa pemilik pengajuan (judul, pesan, is_read = 0).
Menulis log_aktivitas untuk tindakan penting.
Ketiga langkah pertama dijalankan dalam satu transaksi database, agar tidak ada status yang berubah tanpa riwayat atau notifikasi.

Penerbitan surat (saat Dekan menyetujui)
Pastikan nomor surat sudah dibuat otomatis (format resmi FTI [BELUM FINAL]) dan tidak kembar (surat_resmi.no_surat unik).
Hitung hash SHA-256 isi surat; simpan di surat_resmi.hash_sha256.
Buat QR yang memuat nomor surat dan hash (simpan di surat_resmi.qr_code_path); tempel ke PDF final.
Simpan PDF final di server/uploads/letters/ dan path-nya di surat_resmi.file_pdf_path; isi tgl_terbit.
Baru setelah semua langkah berhasil: ubah status pengajuan menjadi disetujui, kirim notifikasi ke mahasiswa.
Bila langkah gagal, status tetap pending_dekan dan data tidak hilang; tampilkan pesan kesalahan.

Status draf surat (terpisah dari status pengajuan)

Dipakai di halaman Draf Surat staf untuk pengajuan berstatus diverifikasi: Belum Dibuat, Draf Dibuat, Dikembalikan untuk Revisi. Database belum punya kolom untuk menyimpannya (lihat docs/data.md) [BELUM FINAL].

Banding atas penolakan (opsional) [BELUM FINAL]

A1 menyebut jalur banding: mahasiswa meminta klarifikasi ke pimpinan untuk ditinjau manual. Belum ada di A2/A3. Pengajuan Ditolak bersifat akhir; mahasiswa melanjutkan dengan pengajuan baru.
