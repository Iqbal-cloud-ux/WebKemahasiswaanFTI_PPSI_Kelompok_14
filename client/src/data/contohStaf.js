// Data contoh halaman staf. Semua nama dan NIM PALSU. Diganti data dari server setelah API tersedia.

export const staffSubmissions = [
  { id: 'PGJ-2026-0186', name: 'Budi Santoso', nim: '9900000001', service: 'Aktif Kuliah', date: '20 Okt 2026', dateValue: '2026-10-20', waiting: '3 hari', status: 'Diajukan' },
  { id: 'PGJ-2026-0187', name: 'Siti Aminah', nim: '9900000002', service: 'Beasiswa', date: '20 Okt 2026', dateValue: '2026-10-20', waiting: '3 hari', status: 'Diajukan' },
  { id: 'PGJ-2026-0188', name: 'Rudi Hartono', nim: '9900000003', service: 'Penurunan UKT', date: '21 Okt 2026', dateValue: '2026-10-21', waiting: '2 hari', status: 'Diajukan' },
  { id: 'PGJ-2026-0189', name: 'Dewi Kartika', nim: '9900000004', service: 'Pengembalian UKT', date: '21 Okt 2026', dateValue: '2026-10-21', waiting: '2 hari', status: 'Diajukan' },
  { id: 'PGJ-2026-0190', name: 'Agus Setiawan', nim: '9900000005', service: 'Pengunduran Diri', date: '22 Okt 2026', dateValue: '2026-10-22', waiting: '1 hari', status: 'Diajukan' },
  { id: 'PGJ-2026-0191', name: 'Rina Marlina', nim: '9900000006', service: 'Aktif Kuliah', date: '23 Okt 2026', dateValue: '2026-10-23', waiting: '1 hari', status: 'Diverifikasi' },
  { id: 'PGJ-2026-0192', name: 'Hendra Wijaya', nim: '9900000007', service: 'Beasiswa', date: '23 Okt 2026', dateValue: '2026-10-23', waiting: '2 hari', status: 'Perlu Perbaikan' },
  { id: 'PGJ-2026-0193', name: 'Fitri Handayani', nim: '9900000008', service: 'Penurunan UKT', date: '23 Okt 2026', dateValue: '2026-10-23', waiting: '3 hari', status: 'Diproses' },
  { id: 'PGJ-2026-0194', name: 'Joko Susilo', nim: '9900000009', service: 'Pengembalian UKT', date: '23 Okt 2026', dateValue: '2026-10-23', waiting: '4 hari', status: 'Menunggu Persetujuan' },
  { id: 'PGJ-2026-0195', name: 'Lina Susanti', nim: '9900000010', service: 'Pengunduran Diri', date: '23 Okt 2026', dateValue: '2026-10-23', waiting: '5 hari', status: 'Disetujui' },
  { id: 'PGJ-2026-0196', name: 'Eko Prasetyo', nim: '9900000011', service: 'Aktif Kuliah', date: '23 Okt 2026', dateValue: '2026-10-23', waiting: '6 hari', status: 'Selesai' },
  { id: 'PGJ-2026-0197', name: 'Yuni Astuti', nim: '9900000012', service: 'Beasiswa', date: '23 Okt 2026', dateValue: '2026-10-23', waiting: '7 hari', status: 'Ditolak' },
]

export const submissionServices = [...new Set(staffSubmissions.map(({ service }) => service))]
export const submissionStatuses = ['Diajukan', 'Diverifikasi', 'Perlu Perbaikan', 'Diproses', 'Menunggu Persetujuan', 'Disetujui', 'Selesai', 'Ditolak']

export const initialStaffDrafts = [
  { ...staffSubmissions[0], draftStatus: 'Belum Dibuat' },
  { ...staffSubmissions[1], draftStatus: 'Draf Dibuat' },
  { ...staffSubmissions[2], draftStatus: 'Dikembalikan untuk Revisi' },
  { ...staffSubmissions[3], draftStatus: 'Dikembalikan untuk Revisi' },
  { ...staffSubmissions[4], draftStatus: 'Dikembalikan untuk Revisi' },
  { ...staffSubmissions[5], draftStatus: 'Draf Dibuat' },
  { ...staffSubmissions[6], draftStatus: 'Belum Dibuat' },
  { ...staffSubmissions[7], draftStatus: 'Belum Dibuat' },
  { ...staffSubmissions[8], draftStatus: 'Draf Dibuat' },
  { ...staffSubmissions[9], draftStatus: 'Belum Dibuat' },
  { ...staffSubmissions[10], draftStatus: 'Draf Dibuat' },
  { ...staffSubmissions[11], draftStatus: 'Belum Dibuat' },
  { id: 'PGJ-2026-0198', name: 'Bayu Saputro', nim: '9900000013', service: 'Penurunan UKT', date: '23 Okt 2026', dateValue: '2026-10-23', draftStatus: 'Belum Dibuat' },
  { id: 'PGJ-2026-0199', name: 'Indah Permata', nim: '9900000014', service: 'Pengembalian UKT', date: '23 Okt 2026', dateValue: '2026-10-23', draftStatus: 'Draf Dibuat' },
  { id: 'PGJ-2026-0200', name: 'Wahyu Hidayat', nim: '9900000015', service: 'Pengunduran Diri', date: '23 Okt 2026', dateValue: '2026-10-23', draftStatus: 'Belum Dibuat' },
  { id: 'PGJ-2026-0201', name: 'Sri Wahyuni', nim: '9900000016', service: 'Aktif Kuliah', date: '23 Okt 2026', dateValue: '2026-10-23', draftStatus: 'Draf Dibuat' },
  { id: 'PGJ-2026-0202', name: 'Doni Kurniawan', nim: '9900000017', service: 'Beasiswa', date: '23 Okt 2026', dateValue: '2026-10-23', draftStatus: 'Belum Dibuat' },
  { id: 'PGJ-2026-0203', name: 'Mega Sari', nim: '9900000018', service: 'Pengunduran Diri', date: '23 Okt 2026', dateValue: '2026-10-23', draftStatus: 'Belum Dibuat' },
]

export const draftStatuses = ['Belum Dibuat', 'Draf Dibuat', 'Dikembalikan untuk Revisi']

const archiveSamples = [
  { archiveNumber: 'B/352/UN.16.15.WDI/KM.00.00/2026', student: staffSubmissions[0] },
  { archiveNumber: 'B/353/UN.16.15.WDI/KM.00.00/2026', student: staffSubmissions[1] },
  { archiveNumber: 'B/354/UN.16.15.WDI/KM.00.00/2026', student: staffSubmissions[2] },
  { archiveNumber: 'B/355/UN.16.15.WDI/KM.00.00/2026', student: staffSubmissions[3] },
  { archiveNumber: 'B/356/UN.16.15.WDI/KM.00.00/2026', student: staffSubmissions[4] },
]

export const initialStaffArchives = Array.from({ length: 128 }, (_, index) => {
  const sample = archiveSamples[index] || {
    archiveNumber: `B/${352 + index}/UN.16.15.WDI/KM.00.00/2026`,
    student: staffSubmissions[index % staffSubmissions.length],
  }
  const day = index < archiveSamples.length ? 23 : (index % 23) + 1
  const dateValue = `2026-10-${String(day).padStart(2, '0')}`

  return {
    ...sample.student,
    archiveNumber: sample.archiveNumber,
    dateValue,
    publishedDate: `${day} Okt 2026`,
    status: 'Selesai',
  }
})

export const initialStaffServices = [
  { id: 'LYN-01', code: 'LYN-01', name: 'Aktif Kuliah', templateId: 'TPL-01', documents: ['Dokumen wajib 1', 'Dokumen wajib 2'], updated: '23 Okt 2026', active: true },
  { id: 'LYN-02', code: 'LYN-02', name: 'Beasiswa', templateId: 'TPL-02', documents: ['Dokumen wajib 1', 'Dokumen wajib 2'], updated: '23 Okt 2026', active: true },
  { id: 'LYN-03', code: 'LYN-03', name: 'Penurunan UKT', templateId: 'TPL-03', documents: ['Dokumen wajib 1', 'Dokumen wajib 2', 'Dokumen wajib 3'], updated: '23 Okt 2026', active: true },
  { id: 'LYN-04', code: 'LYN-04', name: 'Pengembalian UKT', templateId: 'TPL-04', documents: ['Dokumen wajib 1', 'Dokumen wajib 2', 'Dokumen wajib 3'], updated: '23 Okt 2026', active: true },
  { id: 'LYN-05', code: 'LYN-05', name: 'Pengunduran Diri', templateId: 'TPL-05', documents: ['Dokumen wajib 1', 'Dokumen wajib 2', 'Dokumen wajib 3'], updated: '23 Okt 2026', active: true },
]

export const initialStaffTemplates = [
  { id: 'TPL-01', name: 'Template Aktif Kuliah', content: 'SURAT KETERANGAN AKTIF KULIAH\nNomor: [NOMOR SURAT]\n\nMenerangkan bahwa [NAMA MAHASISWA] dengan NIM [NIM] berstatus sebagai mahasiswa aktif.', updated: '23 Okt 2026', active: true },
  { id: 'TPL-02', name: 'Template Beasiswa', content: 'SURAT KETERANGAN BEASISWA\nNomor: [NOMOR SURAT]\n\nMenerangkan bahwa [NAMA MAHASISWA] dengan NIM [NIM] mengajukan layanan beasiswa.', updated: '23 Okt 2026', active: true },
  { id: 'TPL-03', name: 'Template Penurunan UKT', content: 'SURAT KETERANGAN PENURUNAN UKT\nNomor: [NOMOR SURAT]\n\nMenerangkan bahwa [NAMA MAHASISWA] dengan NIM [NIM] mengajukan penurunan UKT.', updated: '23 Okt 2026', active: true },
  { id: 'TPL-04', name: 'Template Pengembalian UKT', content: 'SURAT KETERANGAN PENGEMBALIAN UKT\nNomor: [NOMOR SURAT]\n\nMenerangkan bahwa [NAMA MAHASISWA] dengan NIM [NIM] mengajukan pengembalian UKT.', updated: '23 Okt 2026', active: true },
  { id: 'TPL-05', name: 'Template Pengunduran Diri', content: 'SURAT KETERANGAN PENGUNDURAN DIRI\nNomor: [NOMOR SURAT]\n\nMenerangkan bahwa [NAMA MAHASISWA] dengan NIM [NIM] mengajukan pengunduran diri.', updated: '23 Okt 2026', active: true },
]

export const staffActivities = [
  { title: 'Draf dikembalikan untuk revisi', description: 'Kepala Kantor · Perbaiki penulisan tahun akademik.', time: '10 menit lalu' },
  { title: 'Pengajuan PGJ-2026-0191 diterima', description: 'Rina Marlina · Surat Keterangan Aktif Kuliah.', time: '28 menit lalu' },
  { title: 'Surat B/352 telah diterbitkan', description: 'Persetujuan akhir oleh Dekan dicatat.', time: '1 jam lalu' },
]

export const serviceVolumes = [
  { name: 'Aktif Kuliah', value: 68 },
  { name: 'Beasiswa', value: 46 },
  { name: 'Penurunan UKT', value: 30 },
  { name: 'Pengembalian UKT', value: 19 },
  { name: 'Pengunduran Diri', value: 11 },
]

export const reportServiceSeeds = [
  { name: 'Aktif Kuliah', total: 68, completed: 52, processing: 14, rejected: 2, oneDayCompletions: 21 },
  { name: 'Beasiswa', total: 46, completed: 34, processing: 10, rejected: 2, oneDayCompletions: 13 },
  { name: 'Penurunan UKT', total: 30, completed: 22, processing: 7, rejected: 1, oneDayCompletions: 9 },
  { name: 'Pengembalian UKT', total: 19, completed: 13, processing: 5, rejected: 1, oneDayCompletions: 5 },
  { name: 'Pengunduran Diri', total: 11, completed: 7, processing: 4, rejected: 0, oneDayCompletions: 3 },
]

const reportDateBuckets = [
  { start: 1, end: 7 },
  { start: 8, end: 14 },
  { start: 15, end: 21 },
  { start: 22, end: 23 },
]
const reportStatusBucketCounts = {
  Selesai: [15, 40, 7, 66],
  Diproses: [4, 8, 9, 19],
  Ditolak: [1, 2, 2, 1],
}
const reportStatusBucketSequence = Object.fromEntries(Object.entries(reportStatusBucketCounts).map(([status, counts]) => [
  status,
  counts.flatMap((count, bucketIndex) => Array(count).fill(bucketIndex)),
]))
const reportStatusIndexes = { Selesai: 0, Diproses: 0, Ditolak: 0 }
const reportBucketDayIndexes = { Selesai: [0, 0, 0, 0], Diproses: [0, 0, 0, 0], Ditolak: [0, 0, 0, 0] }

export const initialReportRecords = reportServiceSeeds.flatMap((service, serviceIndex) => {
  let completedIndex = 0
  return Array.from({ length: service.total }, (_, index) => {
    const status = index < service.completed
      ? 'Selesai'
      : index < service.completed + service.processing
        ? 'Diproses'
        : 'Ditolak'
    const turnaroundDays = status === 'Selesai'
      ? (completedIndex++ < service.oneDayCompletions ? 1 : 2)
      : null

    return {
      id: `RPT-${String(serviceIndex * 100 + index + 1).padStart(4, '0')}`,
      service: service.name,
      status,
      turnaroundDays,
    }
  })
}).map((record) => {
  const bucketIndex = reportStatusBucketSequence[record.status][reportStatusIndexes[record.status]++]
  const bucket = reportDateBuckets[bucketIndex]
  const dayOffset = reportBucketDayIndexes[record.status][bucketIndex]++ % (bucket.end - bucket.start + 1)
  const day = bucket.start + dayOffset

  return { ...record, dateValue: `2026-10-${String(day).padStart(2, '0')}` }
})
