# AGENTS.md - Sistem Informasi Layanan Kemahasiswaan FTI Unand

Panduan untuk agent AI (GitHub Copilot, Claude Code, dan sejenisnya). Baca file ini lebih dulu,
lalu buka file di `docs/` sesuai kebutuhan tugas. Bahasa komunikasi dan teks antarmuka: **Indonesia**.

## Aturan kerja untuk agent

- **Jangan menebak.** Bagian bertanda `[BELUM FINAL]` belum diputuskan tim. Tanyakan ke pengguna
  sebelum mengimplementasikannya, atau pilih opsi paling sederhana lalu beri tahu pengguna.
- **Sumber kebenaran tugas:** GitHub Issues dan GitHub Project "WBS PPSI Kelompok 14". Kerjakan
  satu sub-issue per tugas, dan jangan melebar ke fitur lain.
- **Repositori ini PUBLIK.** Siapa pun bisa membaca kode dan riwayat commit. Jangan pernah menulis
  atau meng-commit isi `.env`, kata sandi, kunci rahasia, isi folder `server/uploads/`, atau data
  pribadi mahasiswa (termasuk nama dan NIM asli). File `.env`, `node_modules/`, dan isi `server/uploads/` sudah diabaikan lewat `.gitignore`;
  jangan menghapus aturan itu. Jangan menempelkan data asli mahasiswa pada contoh kode atau seed data;
  pakai data palsu.
- **Struktur database boleh berubah** sesuai kebutuhan pengembangan. Sumber kebenaran skema adalah
  `server/database/schema.sql` ditambah migrasi di `server/database/migrations/` (ringkasannya di
  `docs/data.md`); ERD A3 hanya rancangan awal. Periksa itu dulu sebelum menulis kueri. Setiap
  perubahan tabel dibuat sebagai file migrasi bernomor baru, dan beri tahu pengguna sebelumnya.
- **Ikuti pola kode yang sudah ada** (lihat alur `routes -> controllers -> services/models` pada
  fitur autentikasi di `server/src`). Jangan refactor di luar tugas yang diminta.
- Perubahan kecil dan terfokus. Jelaskan apa yang diubah dan bagaimana mengujinya.

## Status pekerjaan: ambil langsung dari GitHub

Daftar tugas, siapa pengerjanya, dan mana yang sudah selesai **tidak ditulis di file ini** karena
cepat basi. Ambil dari GitHub setiap kali pengguna bertanya "apa yang harus dikerjakan" atau sebelum
memulai tugas. Repositori: `Iqbal-cloud-ux/WebKemahasiswaanFTI_PPSI_Kelompok_14`. Project:
"WBS PPSI Kelompok 14" (nomor 3, pemilik `Iqbal-cloud-ux`).

Aturan membaca status:

- Issue **open** = belum selesai. Issue **closed** = Done (selesai). Status Done di Project otomatis
  menutup issue.
- Ada tiga jenis issue: **issue utama** (satu fitur besar, tidak dikerjakan langsung, progresnya naik
  dari sub-issue), **sub-issue** (tugas kecil milik satu orang, inilah yang dikerjakan), dan **issue
  tunggal** (berdiri sendiri, misalnya dokumen A1 sampai A5; label `issue-tunggal`).
- Satu tugas = satu sub-issue atau issue tunggal. Baca deskripsi issue-nya sebelum mengerjakan, dan
  jangan mengerjakan issue yang milik orang lain tanpa diminta pengguna.

Perintah yang bisa dijalankan di terminal (butuh GitHub CLI `gh` yang sudah login):

```
gh issue list --state open --limit 100 --json number,title,assignees,milestone,labels
gh issue list --state closed --limit 100 --json number,title,assignees,milestone
gh issue view NOMOR --comments
gh project item-list 3 --owner Iqbal-cloud-ux --limit 100 --format json
gh api repos/Iqbal-cloud-ux/WebKemahasiswaanFTI_PPSI_Kelompok_14/issues/NOMOR/sub_issues
```

Bila `gh project` menolak akses, minta pengguna menjalankan `gh auth refresh -s read:project`.
Bila `gh` belum ada atau belum login, bilang ke pengguna; jangan menebak status dari ingatan.
Saat melaporkan, ringkas per milestone: apa yang sudah Done, apa yang sedang dikerjakan, apa yang belum
dimulai, dan tugas milik pengguna yang sedang bertanya.

## Tentang proyek

Platform web untuk mendigitalkan layanan surat akademik di Fakultas Teknologi Informasi (FTI)
Universitas Andalas. Sebelumnya prosesnya terpisah-pisah (Google Form, tanda tangan basah, arsip PDF
di komputer staf, WhatsApp). Sistem ini menyatukan: pengajuan, unggah berkas, verifikasi, pembuatan
surat dari template, paraf berjenjang, persetujuan Dekan, kode verifikasi (QR + hash), arsip, dan unduhan.

Jenis layanan (surat):

1. Surat Keterangan Aktif Kuliah
2. Surat Keterangan Beasiswa
3. Surat Keterangan Penurunan UKT
4. Surat Keterangan Pengembalian UKT
5. Surat Keterangan Pengunduran Diri `[BELUM FINAL: tercantum di A2 tetapi belum di semua dokumen]`

Konteks: tugas kelompok mata kuliah PPSI (Kelompok 14), dosen pengampu Husnil Kamil, M.T.
Dokumen proyek: A1 (proposal), A2 (spesifikasi), A3 (rancangan); A4 dan A5 menyusul.
Prototipe tampilan: Figma "WebKemahasiswaanFTI"
(https://www.figma.com/design/mS37dDPrsYLJraWTbmcdG0/WebKemahasiswaanFTI).

## Teknologi dan struktur folder

Monorepo dengan dua aplikasi terpisah:

```
client/   Frontend: Vite + React (JavaScript, bukan TypeScript)
  src/
    assets/ components/ context/ hooks/ layouts/ pages/ services/ utils/
    App.jsx  main.jsx  App.css  index.css
  vite.config.js  eslint.config.js  index.html  package.json
server/   Backend: Node.js + Express (REST API)
  src/
    config/db.js            koneksi database
    controllers/            logika penanganan request (saat ini: authController.js)
    middlewares/            (saat ini: authMiddleware.js)
    models/                 akses data (saat ini: userModel.js)
    routes/                 definisi endpoint (saat ini: authRoutes.js)
    services/               logika bisnis
    utils/responseHandler.js  format respons API yang seragam
    app.js                  konfigurasi Express
  database/schema.sql       struktur tabel (tanpa data), diimpor lewat phpMyAdmin
  database/migrations/      perubahan skema bernomor urut (001_..., 002_...)
  uploads/letters/          surat hasil generate (PDF)
  uploads/requirements/     berkas persyaratan dari mahasiswa
  index.js  .env  package.json
```

- Database: **MySQL/MariaDB** (XAMPP). Detail tabel di `docs/data.md`. Nilai `users.role`:
  `mahasiswa`, `staf`, `kakor` (Kepala Kantor), `wadek1` (Wakil Dekan 1), `dekan`.
- Autentikasi: login dengan NIM/email dan kata sandi; sandi disimpan dalam bentuk hash; sesi/token
  berakhir otomatis bila tidak aktif (usulan 30 menit). `[BELUM FINAL: mekanisme token]`
- Library tambahan (CSS framework, pembuat PDF, pembuat QR, dll.): cek `client/package.json` dan
  `server/package.json` sebelum menambah library baru. Jangan menambah dependensi tanpa alasan jelas.
- Proyek masih berkembang: baru kerangka, autentikasi, dan sebagian halaman yang ada. Lihat isi
  `client/src` dan `server/src` yang sebenarnya sebelum menambah file, karena strukturnya terus bertambah.
  Jalankan perintah lewat skrip di `package.json` masing-masing.

## Menjalankan di komputer lokal

1. Di `server/`: salin `.env.example` menjadi `.env`, lalu isi nilainya (nilai rahasia diminta ke ketua
   kelompok lewat chat pribadi, jangan ditulis di kode atau chat publik).
2. Database MySQL berjalan lokal lewat XAMPP (phpMyAdmin); buat database sesuai `DB_NAME` di `.env`.
3. `npm install` di `server/` dan di `client/`, lalu jalankan keduanya sesuai skrip di `package.json`.

## Lima peran pengguna

| Peran                                        | Yang boleh dilakukan (ringkas)                                                                                     |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Mahasiswa                                    | Mengajukan layanan, unggah berkas, memantau status, perbaiki dan ajukan ulang, unduh surat miliknya, kelola profil |
| Staf Akademik (juga bertindak sebagai admin) | Verifikasi berkas, susun draf surat dari template, kelola jenis layanan dan template, arsip, rekap dan laporan     |
| Kepala Kantor                                | Periksa dan paraf draf surat (tahap pertama), atau kembalikan dengan catatan                                       |
| Wakil Dekan (Wakil Dekan 1)                  | Periksa dan paraf draf surat (tahap kedua), atau kembalikan dengan catatan                                         |
| Dekan                                        | Keputusan akhir: setujui (pengesahan elektronik), kembalikan, atau tolak; kelola Pengaturan TTE                    |

Aturan akses: setiap pengguna hanya melihat dan mengubah data sesuai perannya (RBAC). Mahasiswa A
tidak boleh melihat pengajuan, berkas, atau surat Mahasiswa B, baik lewat menu maupun URL langsung.
Pengguna tanpa login selalu diarahkan ke halaman login. Penolakan akses memakai HTTP 403.

## Aturan penting yang tidak boleh dilanggar

1. **Berkas unggahan:** hanya PDF, JPG, PNG; maksimal 5 MB per berkas; tolak yang lain dengan pesan
   yang jelas; berkas tidak boleh dieksekusi server. Berkas persyaratan memuat data sensitif
   (misalnya data gaji/tunjangan orang tua, nomor BPJS): jangan disajikan sebagai file statis
   publik; unduhan harus melewati pemeriksaan hak akses, dan pembukaan berkas dicatat di log.
2. **Status pengajuan** hanya boleh berpindah mengikuti aturan di `docs/alur-status.md`. Setiap
   perpindahan wajib mencatat satu baris `Riwayat_Status` dan memicu `Notifikasi` ke mahasiswa.
3. **Kode verifikasi surat:** setelah Dekan setuju, sistem menghitung hash SHA-256 isi surat,
   membuat QR yang memuat nomor surat dan hash, lalu menempelkannya di PDF final. Halaman verifikasi
   publik (tanpa login) memeriksa keaslian surat dan hanya menampilkan nomor, jenis, tanggal, dan
   status, tanpa data pribadi berlebih.
4. **Jangan menyatakan surat "bertanda tangan elektronik tersertifikasi" atau "berkekuatan hukum"**
   di teks mana pun, kecuali FTI/Unand sudah mengonfirmasi mekanismenya. Sebelum itu, tampilkan
   sebagai "persetujuan elektronik beserta kode verifikasi". Penyedia pengesahan dipilih Dekan di
   Pengaturan TTE: _Internal Engine_ atau _External BSrE API_. Kunci rahasia penyedia disimpan
   terenkripsi dan tidak pernah ditampilkan kembali.
5. **Log aktivitas tidak bisa diubah atau dihapus** lewat antarmuka pengguna (login, pembukaan
   dokumen, paraf, keputusan, penerbitan, unduhan surat, perubahan pengaturan TTE).
6. **Performa (target):** halaman utama dimuat 3 detik atau kurang pada 95% permintaan (50 pengguna
   bersamaan); pembuatan PDF dan hash surat 10 detik atau kurang; bila gagal, data pengajuan tidak
   hilang dan pengguna mendapat pesan.
7. **Responsif:** fungsi utama (pengajuan, pantau status, unduh surat) harus berfungsi dari lebar
   layar 360 px sampai desktop tanpa gulir horizontal.

## Konvensi

- Nama entitas, tabel, dan istilah domain memakai bahasa Indonesia sesuai ERD (`pengajuan`,
  `jenis_layanan`, `riwayat_status`, dan seterusnya). Teks antarmuka berbahasa Indonesia.
- Respons API lewat `server/src/utils/responseHandler.js`. Autentikasi dan otorisasi lewat
  `middlewares/authMiddleware.js` (perluas untuk pembatasan per peran).
- Pesan kesalahan untuk pengguna harus jelas dan menyebut apa yang kurang (misalnya dokumen
  persyaratan mana yang belum diunggah).

## Peta dokumentasi

- `docs/alur-layar.md`: layar demi layar per peran, tombol, dan tujuan perpindahannya.
- `docs/alur-status.md`: status pengajuan, aturan perpindahan, siapa yang boleh, efek samping.
- `docs/data.md`: tabel database, kolom, dan relasi.

## Yang belum diputuskan (tanyakan sebelum mengerjakan)

- Konfirmasi tim atas pemetaan status: kode memakai ENUM `pengajuan.status` di database, antarmuka
  memakai label di `docs/alur-status.md`. Juga aturan pengembalian draf dan tempat menyimpan status draf.
- Layanan ke-5 (Pengunduran Diri) dan daftar dokumen persyaratan tiap layanan.
- Penomoran surat: format resmi FTI belum dikonfirmasi.
- Mekanisme TTE sungguhan (Internal Engine atau BSrE) dan masa retensi arsip.
- Pembuat PDF yang dipakai (PDFKit atau Puppeteer) dan kanal notifikasi (dalam aplikasi saja atau juga email).
