Alur status pengajuan

Sumber: A1 (FSM), A2 (kebutuhan dan BPMN To-Be), A3 (use case dan sequence diagram), disesuaikan dengan ENUM pengajuan.status di database (server/database/schema.sql). Kode dan database memakai nilai teknis di kolom pertama; antarmuka menampilkan label di kolom kedua. Pemetaan ini sudah disetujui tim (24 November 2026); bila ternyata perlu diubah, perbaiki di sini dan di docs/data.md.

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
Nilai persetujuan.status: approved (Setujui dan Paraf, atau Setujui oleh Dekan), rejected (Tolak oleh Dekan), returned (Kembalikan dengan catatan; ditambahkan di migrasi 002).

Efek samping setiap perpindahan (wajib)
Mengubah pengajuan.status (dan pengajuan.catatan_revisi bila ada catatan).
Menambah satu baris riwayat_status (pengajuan_id, user_id pelaku, status_sebelumnya, status_baru, catatan).
Membuat notifikasi untuk mahasiswa pemilik pengajuan (judul, pesan, is_read = 0).
Menulis log_aktivitas untuk tindakan penting.
Ketiga langkah pertama dijalankan dalam satu transaksi database, agar tidak ada status yang berubah tanpa riwayat atau notifikasi.

Penerbitan surat (saat Dekan menyetujui)
Buat nomor surat otomatis dari format nomor layanan (template_surat.format_nomor, diatur staf) dan nomor urut berikutnya (satu urutan untuk semua surat per tahun, tabel nomor_surat_urut), lewat buatNomorSurat di server/src/utils/nomorSurat.js di dalam transaksi penerbitan. Nomor tidak boleh kembar (surat_resmi.no_surat unik). Bila format belum diatur, penerbitan gagal dengan pesan dan status tetap pending_dekan. Pengecualian: layanan di LAYANAN_TANPA_NOMOR (server/src/utils/templateSurat.js; saat ini Tidak Menerima Beasiswa) tidak bernomor; buatNomorSurat mengembalikan null, no_surat dibiarkan kosong, dan QR memuat nomor pengajuan (no_referensi) beserta hash.
Layanan berformulir (FORMULIR_MAHASISWA; saat ini Tidak Menerima Beasiswa): PDF final mempertahankan pindaian unggahan mahasiswa (PDF draf), lalu menambahkan halaman verifikasi di bagian akhir yang memuat QR, nomor referensi, sidik jari SHA-256, dan keterangan persetujuan elektronik (pdf-lib, #95).
Hitung hash SHA-256 PDF sumber sebelum QR ditambahkan; untuk surat template, sumbernya PDF yang dirender tanpa QR, sedangkan untuk TIDAK-BEASISWA sumbernya pindaian yang diunggah. Simpan di surat_resmi.hash_sha256.
Buat QR berisi tautan verifikasi `<ALAMAT_VERIFIKASI>/verifikasi?nomor=<no_surat atau no_referensi>&hash=<hash_sha256>` (simpan PNG di surat_resmi.qr_code_path), lalu tempelkan pada PDF final. ALAMAT_VERIFIKASI diatur di server/.env (bawaan http://localhost:5173 saat pengembangan; wajib diisi di server sungguhan), dan alamat itu terkunci di surat yang sudah terbit. Surat yang terbit sebelum 27 November 2026 memuat payload JSON `{"nomor":"...","hash":"..."}`; halaman verifikasi tetap menerimanya. Hash tidak menghitung QR yang ditambahkan agar tidak terjadi hash melingkar.
Simpan PDF final di server/uploads/letters/ dan path-nya di surat_resmi.file_pdf_path; isi tgl_terbit.
Baru setelah semua langkah berhasil: ubah status pengajuan menjadi disetujui, kirim notifikasi ke mahasiswa.
Khusus Surat Keterangan Lulus (KET-LULUS): dalam transaksi yang sama, users.tgl_lulus mahasiswa diisi tanggal terbit (bila belum diisi staf), mahasiswa mendapat notifikasi bahwa akunnya akan ditutup 30 hari lagi, dan tindakan ini dicatat di log_aktivitas (lihat status studi di docs/data.md).
Bila langkah gagal, status tetap pending_dekan dan data tidak hilang; tampilkan pesan kesalahan.

Status draf surat (terpisah dari status pengajuan)

Dipakai di halaman Draf Surat staf untuk pengajuan berstatus diverifikasi. Disimpan di surat_resmi.status_draf (migrasi 002, lihat docs/data.md).

Nilai database	Label di antarmuka	Kapan
(belum ada baris surat_resmi)	Belum Dibuat	Pengajuan baru diverifikasi; staf belum menyimpan draf
dibuat	Draf Dibuat	Staf menyimpan draf; belum diteruskan
diteruskan	(mengikuti status pengajuan)	Staf menekan Teruskan; pengajuan pindah ke pending_kakor
dikembalikan	Dikembalikan untuk Revisi	Pejabat menekan Kembalikan; pengajuan kembali ke diverifikasi
terbit	(mengikuti status pengajuan: Selesai)	Dekan menyetujui dan surat berhasil terbit

Perubahan status_draf terjadi dalam transaksi yang sama dengan perpindahan pengajuan.status terkait.

Banding atas penolakan (opsional) [BELUM FINAL]

A1 menyebut jalur banding: mahasiswa meminta klarifikasi ke pimpinan untuk ditinjau manual. Belum ada di A2/A3. Pengajuan Ditolak bersifat akhir; mahasiswa melanjutkan dengan pengajuan baru.
