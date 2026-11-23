Alur status pengajuan

Sumber: A1 (FSM), A2 (kebutuhan dan BPMN To-Be), A3 (use case dan sequence diagram). Status memakai nilai konsisten di database dan kode. Daftar di bawah adalah usulan terpadu dari A1 sampai A3 dan ditandai [BELUM FINAL] sampai tim mengonfirmasi.

Status (status_pengajuan)
Status	Arti
Diajukan	Mahasiswa sudah mengirim; menunggu pemeriksaan berkas oleh Staf Akademik
Diverifikasi	Staf menyatakan berkas lengkap dan sah
Perlu Perbaikan	Staf meminta mahasiswa memperbaiki berkas
Ditolak	Berkas terindikasi tidak sah, atau Dekan menolak (status akhir)
Diproses	Staf menyusun draf surat
Menunggu Persetujuan	Draf diteruskan dan sedang diparaf pejabat atau menunggu keputusan Dekan
Selesai	Dekan menyetujui; surat terbit, ber-QR, dan sudah diarsipkan

A1 juga menyebut status "Disetujui" (antara Menunggu Persetujuan dan Selesai). Di A3, keputusan setuju langsung membuat status Selesai, jadi "Disetujui" dianggap tahap sementara dalam proses yang sama [BELUM FINAL].

Perpindahan yang diizinkan

Aktor menunjukkan siapa yang boleh memicu. Semua perpindahan lain harus ditolak (misalnya Diajukan langsung ke Selesai).

Diajukan -> Diverifikasi: Staf Akademik (berkas lengkap dan sesuai).
Diajukan -> Perlu Perbaikan: Staf Akademik (wajib catatan).
Diajukan -> Ditolak: Staf Akademik (berkas terindikasi tidak sah; wajib alasan).
Perlu Perbaikan -> Diajukan: Mahasiswa (mengajukan ulang setelah memperbaiki berkas).
Diverifikasi -> Diproses: Staf Akademik (mulai menyusun draf surat dari template).
Diproses -> Menunggu Persetujuan: Staf Akademik (menekan Teruskan pada draf).
Menunggu Persetujuan -> Diproses: Kepala Kantor, Wakil Dekan, atau Dekan (Kembalikan dengan catatan; draf berstatus "Dikembalikan untuk Revisi", staf merevisi lalu meneruskan lagi).
Menunggu Persetujuan -> Selesai: Dekan (Setujui). Memicu penerbitan surat otomatis (lihat bawah).
Menunggu Persetujuan -> Ditolak: Dekan (Tolak; wajib alasan).

Catatan: A1 menggambarkan "Perlu Perbaikan" dari status Diverifikasi, sedangkan A2/A3 menempatkan pemeriksaan berkas langsung dari Diajukan. Alur di atas mengikuti A2/A3 [BELUM FINAL].

Tahap persetujuan berjenjang

Urutan paraf: Kepala Kantor -> Wakil Dekan 1 -> Dekan. Urutan per jenis surat dan siapa yang berwenang menandatangani tiap jenis surat masih perlu dikonfirmasi [BELUM FINAL]. Setiap paraf, kembalikan, setuju, atau tolak dicatat di tabel persetujuan (tahap, keputusan, catatan, tanggal).

Efek samping setiap perpindahan (wajib)
Menambah satu baris riwayat_status (status_sebelumnya, status_baru, user_id pelaku, catatan, waktu).
Membuat notifikasi untuk mahasiswa pemilik pengajuan (judul, pesan, dibaca = belum).
Menulis log_aktivitas untuk tindakan penting [tabel belum ada di ERD].
Mengubah pengajuan.status_pengajuan dan pengajuan.catatan_terakhir.
Penerbitan surat (saat Dekan menyetujui)
Pastikan nomor surat sudah dibuat otomatis (format resmi FTI [BELUM FINAL]) dan tidak kembar.
Hitung hash SHA-256 isi surat; simpan di surat.hash_dokumen.
Buat kode_verifikasi dan QR (memuat nomor surat dan hash); tempel ke PDF final.
Simpan PDF final di server/uploads/letters/ dan path-nya di surat.lokasi_surat_final; isi tanggal_terbit.
Ubah status pengajuan menjadi Selesai, simpan ke arsip, kirim notifikasi ke mahasiswa.
Bila langkah gagal, status tidak berubah dan data tidak hilang; tampilkan pesan kesalahan.
Status draf surat (terpisah dari status pengajuan)

Dipakai di halaman Draft Surat staf: Belum Dibuat, Draf Dibuat, Dikembalikan untuk Revisi.

Banding atas penolakan (opsional) [BELUM FINAL]

A1 menyebut jalur banding: mahasiswa meminta klarifikasi ke pimpinan untuk ditinjau manual. Belum ada di A2/A3. Pengajuan Ditolak bersifat akhir; mahasiswa melanjutkan dengan pengajuan baru.