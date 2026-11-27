Alur layar per peran

Sumber: rancangan antarmuka di dokumen A3 (subbab 3.4) dan prototipe Figma "WebKemahasiswaanFTI". Tanda: [A3] = tertulis jelas di dokumen. [USULAN] = disimpulkan dari alur dan perlu dikonfirmasi dengan Figma. Nama rute URL belum ditetapkan [BELUM FINAL]; pakai pola konsisten, misalnya /mahasiswa/..., /staf/..., /kepala-kantor/..., /wakil-dekan/..., /dekan/....

Semua peran
Halaman Login (NIM atau email + kata sandi) [A3].
Login berhasil: masuk ke Beranda sesuai peran [A3].
Login gagal: tetap di Login dengan pesan kesalahan [A3].
Pengguna belum login yang membuka halaman lain: diarahkan ke Login [A3].
Logout mengakhiri sesi; tombol Back peramban tidak boleh membuka halaman terproteksi lagi [A3]. Token dicabut di server, sehingga sesi di perangkat lain ikut berakhir; begitu juga setelah ganti kata sandi.
Lupa kata sandi: mahasiswa menghubungi Staf Akademik, yang mereset kata sandi di Manajemen Akun dan menyampaikan kata sandi sementara secara langsung. Setelah login dengan kata sandi sementara, hanya halaman Ganti Kata Sandi yang tampil sampai kata sandi baru disimpan.
Batas percobaan login: 5 kali gagal per akun dan IP, serta 30 kali gagal per IP, dalam 15 menit.
Mahasiswa

Menu: Beranda, Pengajuan Layanan, Riwayat Pengajuan, Notifikasi. Profil dan Keluar ada di menu akun (tombol avatar di bar atas), tidak diulang di sidebar.

Beranda [A3]: kartu statistik (Diproses, Perlu Perbaikan, Selesai), banner peringatan bila ada pengajuan yang perlu diperbaiki, daftar pengajuan terbaru, dan katalog layanan.
Klik banner revisi atau pengajuan "Perlu Perbaikan": ke halaman pengajuan tersebut untuk memperbaiki berkas [USULAN].
Klik kartu layanan di katalog: mulai pengajuan untuk layanan itu [USULAN].
Pengajuan Layanan (stepper 3 tahap) [A3]:
Pilih Layanan: daftar jenis surat beserta syarat dokumen. Klik satu layanan untuk langsung masuk ke tahap Isi Formulir (tanpa tombol Lanjut). Tombol Ajukan di katalog Beranda juga langsung membuka tahap ini; bila layanan itu tidak boleh diajukan, yang tampil tahap Pilih Layanan beserta alasannya.
Isi Formulir dan Unggah Dokumen: data profil terisi otomatis; layanan tertentu meminta isian tambahan yang dicetak di surat (misalnya data orang tua untuk Aktif Kuliah Orang Tua), dan layanan dengan keperluan tetap tidak menampilkan kolom Keperluan; layanan berformulir (Tidak Menerima Beasiswa) menampilkan tombol Unduh formulir terisi beserta petunjuk cetak, tempel meterai, tanda tangan, pindai, dan unggah PDF; area tarik-dan-lepas untuk berkas persyaratan dengan validasi format dan ukuran (PDF/JPG/PNG, maks 5 MB). Berkas yang sudah dipilih dapat dihapus atau diganti sebelum pengajuan dikirim. Setelah dikirim, berkas diperbaiki atau diganti melalui alur Perbaiki dan Ajukan Ulang jika staf meminta perbaikan. Pengajuan tidak bisa dilanjutkan sebelum semua dokumen wajib terunggah; sistem menampilkan daftar yang kurang.
Tinjau dan Kirim: ringkasan seluruh data dan berkas. Tombol Kirim menyimpan pengajuan, memberi nomor referensi, dan mengubah status menjadi Diajukan.
Setelah Kirim: halaman Pengajuan Berhasil Terkirim dengan ringkasan data yang dikirim [A3]. Dari sana mahasiswa menuju halaman pantau status [USULAN].
Surat Pengajuan / Pantau Status [A3]: linimasa progres secara real-time. Bila status Selesai, tampil tombol Unduh Surat (PDF final ber-QR) melalui endpoint berizin `/api/surat/:pengajuanId/pdf`; mahasiswa hanya dapat mengunduh surat miliknya dan setiap unduhan dicatat. Bila Perlu Perbaikan, tampil catatan staf dan jalan ke perbaikan berkas.
Tombol Unduh hanya aktif untuk status Selesai; bila berkas hilang tampil "Gagal mengunduh file surat" [A3].
Perbaiki dan Ajukan Ulang [A3]: mahasiswa melihat catatan, memperbaiki isian tambahan bila ada, mengunggah berkas pengganti, lalu mengajukan ulang; status kembali ke Diajukan.
Riwayat Pengajuan [A3]: semua pengajuan dengan filter dan pencarian; klik satu baris (atau tombol Lihat Detail) untuk membuka halaman Detail Pengajuan (/mahasiswa/riwayat/<nomor pengajuan>) yang menggantikan daftar: linimasa status, berkas pendukung, catatan staf, tombol Perbaiki atau Unduh Surat bila Selesai, dan tombol Kembali ke Riwayat. Lihat Detail dari Beranda dan Notifikasi juga membuka halaman ini.
Notifikasi [A3]: daftar semua pemberitahuan dengan tiga tab: Semua Notifikasi, Belum Dibaca, dan Sudah Dibaca (masing-masing dengan jumlahnya); klik satu item membuka Detail Notifikasi.
Profil [A3]: data akademik (hanya baca), ubah kontak (email, nomor telepon), ganti kata sandi.
Staf Akademik

Menu: Beranda, Daftar Pengajuan, Draft Surat, Arsip Surat, Jenis Layanan, Manajemen Akun, Rekapitulasi, Profil.

Beranda Staf [A3]: statistik layanan, antrean yang perlu ditindaklanjuti, aktivitas terbaru, grafik rekap per jenis layanan.
Daftar Pengajuan [A3]: tabel seluruh pengajuan dengan pencarian dan filter status. Klik satu baris: Periksa dan Verifikasi Pengajuan [USULAN].
Periksa dan Verifikasi Pengajuan [A3]: data pemohon (termasuk isian tambahan dari mahasiswa), pratinjau dokumen persyaratan, dan tiga aksi: Verifikasi (setuju), Minta Perbaikan (wajib catatan), Tolak (dokumen terindikasi tidak sah, wajib alasan). Hasil: status berubah dan mahasiswa mendapat notifikasi.
Draft Surat [A3]: daftar pengajuan terverifikasi dengan filter status draf (Belum Dibuat, Draf Dibuat, Dikembalikan untuk Revisi). Tombol Buat atau Sunting membuka Buat Draf.
Buat Draf [A3]: pilih template sesuai layanan, lengkapi data variabel (nama, NIM, program studi, keperluan, dan seterusnya; bagian bertanda [ISI OLEH STAF: ...], misalnya periode wisuda, wajib diganti sebelum Teruskan; untuk layanan berformulir seperti Tidak Menerima Beasiswa, isi draf hanya catatan dan PDF draf adalah pindaian unggahan mahasiswa), pratinjau PDF, Simpan, lalu Teruskan ke pemeriksaan pejabat.
Arsip Surat [A3]: surat yang sudah terbit (setelah persetujuan Dekan), dengan pencarian dan filter tanggal terbit. Klik baris: Rincian Arsip Surat (pratinjau, nomor, tombol unduh, kode verifikasi QR, ringkasan SHA-256).
Jenis Layanan [A3]: daftar layanan (status aktif, tanggal pembaruan), tombol tambah, edit, hapus. Edit template membuka Edit Template Surat (format nomor surat dengan penanda {urut}/{tahun}/{bulan} beserta contoh hasilnya, sisipkan variabel dinamis, pratinjau, simpan). Tab Template Surat juga menampilkan nomor urut surat terakhir tahun berjalan dan form untuk mengubahnya.
Rekapitulasi [A3]: volume pengajuan, statistik penyelesaian, grafik tren bulanan, distribusi status, dan rincian per jenis layanan. Filter tanggal, layanan, dan status diterapkan pada ringkasan serta ekspor; data laporan bersifat agregat dan tidak menampilkan identitas mahasiswa. Rata-rata penyelesaian dihitung dari tanggal pengajuan hingga tanggal surat terbit. Ekspor tersedia sebagai PDF melalui cetak peramban atau CSV yang dapat dibuka di Excel.
Manajemen Akun (#131, `/staf/akun`): daftar semua akun dengan pencarian (nama, NIM/NIP, email), filter peran, dan filter status akun (Aktif, Lulus (masa tenggang), Lulus, Lewat masa studi, Nonaktif; dihitung otomatis, lihat status studi di docs/data.md). Kolom status juga menampilkan semester berjalan atau tanggal akun ditutup. Untuk akun mahasiswa saja: Ubah membuka formulir data (NIM FTI, nama, email, nomor telepon, program studi, tanggal lulus, perpanjangan semester); angkatan dan jenjang ditampilkan dari NIM; NIM dan email harus unik. Membuka kembali akun yang tertutup: hapus tanggal lulus atau beri perpanjangan semester. Aktifkan (dengan konfirmasi) hanya untuk akun yang dinonaktifkan manual. Reset Sandi (dengan konfirmasi) membuat kata sandi sementara yang tampil sekali untuk disampaikan ke mahasiswa. Setiap perubahan dicatat di log_aktivitas. Tidak termasuk: membuat atau menghapus akun, mengganti kata sandi orang lain, menetapkan peran, dan menonaktifkan akun manual.
Login mahasiswa yang akunnya tertutup ditolak dengan alasannya (sudah lulus, atau masa studi lewat dan perlu perpanjangan).
Profil [A3]: lihat dan ubah data profil.
Kepala Kantor dan Wakil Dekan

Menu: Draft Menunggu Pemeriksaan, Riwayat Pengesahan.

Draft Menunggu Pemeriksaan [A3]: antrean draf yang perlu diperiksa. Kepala Kantor lebih dulu, lalu Wakil Dekan 1. Klik baris: Detail Pemeriksaan Surat.
Detail Pemeriksaan Surat [A3]: pratinjau surat, ringkasan pengajuan, alur persetujuan berjenjang.
Setujui dan Paraf: muncul pop-up konfirmasi; setelah dikonfirmasi paraf tercatat dan draf diteruskan ke tahap berikutnya.
Kembalikan (wajib catatan): draf kembali ke Staf Akademik untuk direvisi.
Riwayat Pengesahan [A3]: statistik dan daftar draf yang sudah diperiksa, diparaf, atau dikembalikan.
Dekan

Menu: Beranda, Menunggu Keputusan, Riwayat Keputusan, Log Aktivitas, Pengaturan TTE (#92, belum dibuat).

Beranda [A3]: statistik permohonan, status penyedia TTE yang aktif, dan tabel surat menunggu keputusan. Sudah ada (`/dekan`): menunggu keputusan, menunggu lebih dari 2 hari, keputusan bulan berjalan (disetujui, dikembalikan, ditolak), metode pengesahan yang dipakai, lima surat terlama di antrean, dan lima keputusan terakhir. Status penyedia TTE menyusul bersama Pengaturan TTE (#92). Antrean lengkap pindah ke `/dekan/antrean`.
Menunggu Keputusan [A3]: antrean surat yang sudah diverifikasi dan diparaf lengkap. Klik baris: Tinjau Surat.
Tinjau Surat [A3]: pratinjau surat, ringkasan pengajuan, riwayat paraf, kolom catatan, dan tiga keputusan: Setujui (pengesahan elektronik), Kembalikan (revisi), Tolak.
Setujui: sistem membentuk hash SHA-256 dan QR, menempelkannya ke PDF final, status Selesai, menyimpan ke arsip, dan memberi notifikasi ke mahasiswa.
Bila gagal menyematkan pengesahan, tampil pesan kesalahan dan status tidak berubah.
Riwayat Keputusan [A3]: statistik dan daftar keputusan (disetujui, dikembalikan, ditolak).
Log Aktivitas (`/dekan/log`; keputusan tim 27 November 2026: khusus Dekan, Kepala Kantor dan Wakil Dekan 1 tidak punya akses): log audit seluruh pengguna dari tabel log_aktivitas, terbaru lebih dulu, 25 baris per halaman, dengan pencarian (nama, NIM/NIP, keterangan) dan filter peran, jenis aktivitas, serta rentang tanggal. Hanya bisa dibaca; tidak ada tombol ubah atau hapus. Alamat IP tidak ditampilkan.
Pengaturan TTE [A3]: pilih Internal Engine FTI atau External BSrE API, isi konfigurasi, lihat status provider aktif, informasi enkripsi, dan audit log perubahan. Kunci rahasia tidak pernah ditampilkan kembali.
Halaman publik (tanpa login)
Verifikasi Keaslian Surat [A3] (`/verifikasi`): pengguna memindai QR surat dengan kamera HP; QR berisi tautan `/verifikasi?nomor=...&hash=...` sehingga halaman langsung memeriksa surat tanpa langkah tambahan. Pengguna juga bisa menempelkan tautan itu, atau payload JSON dari surat lama, di kotak isian. Halaman mengirim nomor dan hash ke `POST /api/verifikasi` tanpa login. Menampilkan nomor, jenis, tanggal terbit, dan status hanya jika hash cocok. Bila tidak cocok atau surat tidak ditemukan, tampil "tidak dapat diverifikasi" tanpa membocorkan data pribadi. Pemeriksaan untuk surat yang ditemukan dicatat pada `public_verification`.