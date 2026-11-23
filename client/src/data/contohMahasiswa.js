// Data contoh halaman mahasiswa. Diganti data dari server setelah API tersedia (#60, #62, #84).

export const services = [
  { title: 'Surat Keterangan Aktif Kuliah', description: 'Keterangan status aktif untuk keperluan administrasi.', documents: ['KRS Semester Berjalan', 'Surat Permohonan'] },
  { title: 'Beasiswa', description: 'Dokumen pendukung pengajuan bantuan pendidikan.', documents: ['KRS Semester Berjalan', 'Surat Permohonan'] },
  { title: 'Penurunan UKT', description: 'Permohonan penyesuaian biaya kuliah Anda.', documents: ['KRS Semester Berjalan', 'Surat Permohonan'] },
  { title: 'Pengembalian UKT', description: 'Permohonan pengembalian pembayaran UKT.', documents: ['Bukti Pembayaran UKT', 'Surat Permohonan'] },
  { title: 'Pengunduran Diri', description: 'Pengajuan pengunduran diri dari perkuliahan.', documents: ['KRS Semester Berjalan', 'Surat Permohonan'] },
]

export const buatPengajuanContoh = (user) => [
  { id: 'PGJ-2026-00123', title: 'Surat Keterangan Aktif Kuliah', date: '22 Oktober 2026', dateValue: '2026-10-22', status: 'Diproses', tone: 'purple', applicant: user.nama || 'Mahasiswa', detail: 'Surat terbit tersedia dalam format PDF untuk keperluan ini.' },
  { id: 'PGJ-2026-00119', title: 'Beasiswa', date: '21 Oktober 2026', dateValue: '2026-10-21', status: 'Perlu Perbaikan', tone: 'orange', applicant: user.nama || 'Mahasiswa', detail: 'Mohon unggah kembali dokumen pendukung yang lebih jelas.' },
  { id: 'PGJ-2026-00118', title: 'Penurunan UKT', date: '21 Oktober 2026', dateValue: '2026-10-21', status: 'Menunggu Persetujuan', tone: 'amber', applicant: user.nama || 'Mahasiswa', detail: 'Dokumen telah diperiksa dan menunggu persetujuan.' },
  { id: 'PGJ-2026-00115', title: 'Pengembalian UKT', date: '20 Oktober 2026', dateValue: '2026-10-20', status: 'Ditolak', tone: 'red', applicant: user.nama || 'Mahasiswa', detail: 'Pengajuan belum dapat diproses. Silakan hubungi Staf Akademik untuk informasi lebih lanjut.' },
  { id: 'PGJ-2026-00110', title: 'Surat Keterangan Aktif Kuliah', date: '19 Oktober 2026', dateValue: '2026-10-19', status: 'Selesai', tone: 'green', applicant: user.nama || 'Mahasiswa', detail: 'Surat terbit tersedia dalam format PDF untuk keperluan ini.' },
]

export const notifications = [
  { id: 'n-processing', submissionId: 'PGJ-2026-00123', status: 'Diproses', tone: 'purple', time: '1 jam lalu', message: 'berubah status menjadi Diproses.' },
  { id: 'n-revision', submissionId: 'PGJ-2026-00119', status: 'Perlu Perbaikan', tone: 'orange', time: '2 jam lalu', message: 'berubah status menjadi Perlu Perbaikan.' },
  { id: 'n-verified', submissionId: 'PGJ-2026-00123', status: 'Diverifikasi', tone: 'teal', time: '3 jam lalu', message: 'telah diverifikasi oleh Staf Akademik.' },
  { id: 'n-complete', submissionId: 'PGJ-2026-00110', status: 'Selesai', tone: 'green', time: '3 hari lalu', message: 'berubah status menjadi Selesai.' },
  { id: 'n-submitted', submissionId: 'PGJ-2026-00123', status: 'Diajukan', tone: 'blue', time: '4 hari lalu', message: 'berhasil dikirim dan sedang menunggu pemeriksaan.' },
]

export const notifikasiAwalDibaca = ['n-complete', 'n-submitted']
