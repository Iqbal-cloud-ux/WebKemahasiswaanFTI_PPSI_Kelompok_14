Alur layar per peran

Sumber: rancangan antarmuka di dokumen A3 (subbab 3.4) dan prototipe Figma "WebKemahasiswaanFTI". Tanda: [A3] = tertulis jelas di dokumen. [USULAN] = disimpulkan dari alur dan perlu dikonfirmasi dengan Figma. Nama rute URL belum ditetapkan [BELUM FINAL]; pakai pola konsisten, misalnya /mahasiswa/..., /staf/..., /kepala-kantor/..., /wakil-dekan/..., /dekan/....

Semua peran
Halaman Login (NIM atau email + kata sandi) [A3].
Login berhasil: masuk ke Beranda sesuai peran [A3].
Login gagal: tetap di Login dengan pesan kesalahan [A3].
Pengguna belum login yang membuka halaman lain: diarahkan ke Login [A3].
Logout mengakhiri sesi; tombol Back peramban tidak boleh membuka halaman terproteksi lagi [A3].
Mahasiswa

Menu: Beranda, Pengajuan Layanan, Riwayat Pengajuan, Notifikasi, Profil.

Beranda [A3]: kartu statistik (Diproses, Perlu Perbaikan, Selesai), banner peringatan bila ada pengajuan yang perlu diperbaiki, daftar pengajuan terbaru, dan katalog layanan.
Klik banner revisi atau pengajuan "Perlu Perbaikan": ke halaman pengajuan tersebut untuk memperbaiki berkas [USULAN].
Klik kartu layanan di katalog: mulai pengajuan untuk layanan itu [USULAN].
Pengajuan Layanan (stepper 3 tahap) [A3]:
Pilih Layanan: daftar jenis surat beserta syarat dokumen. Pilih satu layanan, lalu lanjut.
Isi Formulir dan Unggah Dokumen: data profil terisi otomatis; area tarik-dan-lepas untuk berkas persyaratan dengan validasi format dan ukuran (PDF/JPG/PNG, maks 5 MB). Pengajuan tidak bisa dilanjutkan sebelum semua dokumen wajib terunggah; sistem menampilkan daftar yang kurang.
Tinjau dan Kirim: ringkasan seluruh data dan berkas. Tombol Kirim menyimpan pengajuan, memberi nomor referensi, dan mengubah status menjadi Diajukan.
Setelah Kirim: halaman Pengajuan Berhasil Terkirim dengan ringkasan data yang dikirim [A3]. Dari sana mahasiswa menuju halaman pantau status [USULAN].
Surat Pengajuan / Pantau Status [A3]: linimasa progres secara real-time. Bila status Selesai, tampil tombol Unduh Surat (PDF ber-QR). Bila Perlu Perbaikan, tampil catatan staf dan jalan ke perbaikan berkas.
Tombol Unduh hanya aktif untuk status Selesai; bila berkas hilang tampil "Gagal mengunduh file surat" [A3].
Perbaiki dan Ajukan Ulang [A3]: mahasiswa melihat catatan, mengunggah berkas pengganti, lalu mengajukan ulang; status kembali ke Diajukan.
Riwayat Pengajuan [A3]: semua pengajuan dengan filter dan pencarian; klik satu baris untuk melihat detail dan tombol unduh surat bila Selesai.
Notifikasi [A3]: daftar semua pemberitahuan; klik satu item membuka Detail Notifikasi.
Profil [A3]: data akademik (hanya baca), ubah kontak (email, nomor telepon), ganti kata sandi.
Staf Akademik

Menu: Beranda, Daftar Pengajuan, Draft Surat, Arsip Surat, Jenis Layanan, Rekapitulasi, Profil.

Beranda Staf [A3]: statistik layanan, antrean yang perlu ditindaklanjuti, aktivitas terbaru, grafik rekap per jenis layanan.
Daftar Pengajuan [A3]: tabel seluruh pengajuan dengan pencarian dan filter status. Klik satu baris: Periksa dan Verifikasi Pengajuan [USULAN].
Periksa dan Verifikasi Pengajuan [A3]: data pemohon, pratinjau dokumen persyaratan, dan tiga aksi: Verifikasi (setuju), Minta Perbaikan (wajib catatan), Tolak (dokumen terindikasi tidak sah, wajib alasan). Hasil: status berubah dan mahasiswa mendapat notifikasi.
Draft Surat [A3]: daftar pengajuan terverifikasi dengan filter status draf (Belum Dibuat, Draf Dibuat, Dikembalikan untuk Revisi). Tombol Buat atau Sunting membuka Buat Draf.
Buat Draf [A3]: pilih template sesuai layanan, lengkapi data variabel (nama, NIM, program studi, keperluan, dan seterusnya), pratinjau PDF, Simpan, lalu Teruskan ke pemeriksaan pejabat.
Arsip Surat [A3]: surat yang sudah terbit (setelah persetujuan Dekan), dengan pencarian dan filter tanggal terbit. Klik baris: Rincian Arsip Surat (pratinjau, nomor, tombol unduh, kode verifikasi QR, ringkasan SHA-256).
Jenis Layanan [A3]: daftar layanan (status aktif, tanggal pembaruan), tombol tambah, edit, hapus. Edit template membuka Edit Template Surat (sisipkan variabel dinamis, pratinjau, simpan).
Rekapitulasi [A3]: volume pengajuan, statistik penyelesaian, grafik tren, distribusi status, ekspor laporan (PDF atau Excel).
Profil [A3]: lihat dan ubah data profil.
Kepala Kantor dan Wakil Dekan

Menu: Draft Menunggu Pemeriksaan, Riwayat Pengesahan.

Draft Menunggu Pemeriksaan [A3]: antrean draf yang perlu diperiksa. Kepala Kantor lebih dulu, lalu Wakil Dekan 1. Klik baris: Detail Pemeriksaan Surat.
Detail Pemeriksaan Surat [A3]: pratinjau surat, ringkasan pengajuan, alur persetujuan berjenjang.
Setujui dan Paraf: muncul pop-up konfirmasi; setelah dikonfirmasi paraf tercatat dan draf diteruskan ke tahap berikutnya.
Kembalikan (wajib catatan): draf kembali ke Staf Akademik untuk direvisi.
Riwayat Pengesahan [A3]: statistik dan daftar draf yang sudah diperiksa, diparaf, atau dikembalikan.
Dekan

Menu: Beranda, Menunggu Keputusan, Riwayat Keputusan, Pengaturan TTE.

Beranda [A3]: statistik permohonan, status penyedia TTE yang aktif, dan tabel surat menunggu keputusan.
Menunggu Keputusan [A3]: antrean surat yang sudah diverifikasi dan diparaf lengkap. Klik baris: Tinjau Surat.
Tinjau Surat [A3]: pratinjau surat, ringkasan pengajuan, riwayat paraf, kolom catatan, dan tiga keputusan: Setujui (pengesahan elektronik), Kembalikan (revisi), Tolak.
Setujui: sistem membentuk hash SHA-256 dan QR, menempelkannya ke PDF final, status Selesai, menyimpan ke arsip, dan memberi notifikasi ke mahasiswa.
Bila gagal menyematkan pengesahan, tampil pesan kesalahan dan status tidak berubah.
Riwayat Keputusan [A3]: statistik dan daftar keputusan (disetujui, dikembalikan, ditolak).
Pengaturan TTE [A3]: pilih Internal Engine FTI atau External BSrE API, isi konfigurasi, lihat status provider aktif, informasi enkripsi, dan audit log perubahan. Kunci rahasia tidak pernah ditampilkan kembali.
Halaman publik (tanpa login)
Verifikasi Keaslian Surat [A3]: dibuka dari pemindaian QR atau tautan di surat. Menampilkan nomor, jenis, tanggal terbit, dan status surat. Bila isi dokumen yang diperiksa berbeda dari yang tercatat (hash tidak cocok), tampil "tidak valid". Tidak boleh menampilkan data pribadi berlebih.