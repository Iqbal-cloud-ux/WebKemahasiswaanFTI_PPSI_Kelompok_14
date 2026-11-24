// Label dan warna status pengajuan untuk mahasiswa (docs/alur-status.md).
// Nilai kunci = pengajuan.status di database; tone = kelas warna .status-pill.
export const STATUS_MAHASISWA = {
  diajukan: { label: 'Diajukan', tone: 'blue' },
  perlu_perbaikan: { label: 'Perlu Perbaikan', tone: 'orange' },
  diverifikasi: { label: 'Diverifikasi', tone: 'teal' },
  pending_kakor: { label: 'Menunggu Persetujuan', tone: 'amber' },
  pending_wadek1: { label: 'Menunggu Persetujuan', tone: 'amber' },
  pending_dekan: { label: 'Menunggu Persetujuan', tone: 'amber' },
  disetujui: { label: 'Selesai', tone: 'green' },
  ditolak: { label: 'Ditolak', tone: 'red' },
}

export const statusMahasiswa = (status) => STATUS_MAHASISWA[status] || { label: status, tone: 'blue' }

// Warna pill dari label (judul notifikasi berbentuk "Pengajuan PGJ-...: <label>").
export const toneDariLabel = (label) => Object.values(STATUS_MAHASISWA).find((item) => item.label === label)?.tone || 'blue'

// Label untuk staf dan pimpinan (boleh melihat tahap paraf); kelas = akhiran kelas CSS status-<kelas> di staf.css.
export const STATUS_STAF = {
  diajukan: { label: 'Diajukan', kelas: 'diajukan' },
  perlu_perbaikan: { label: 'Perlu Perbaikan', kelas: 'perlu-perbaikan' },
  diverifikasi: { label: 'Diverifikasi', kelas: 'diverifikasi' },
  pending_kakor: { label: 'Menunggu Paraf Kepala Kantor', kelas: 'menunggu-persetujuan' },
  pending_wadek1: { label: 'Menunggu Paraf Wakil Dekan 1', kelas: 'menunggu-persetujuan' },
  pending_dekan: { label: 'Menunggu Keputusan Dekan', kelas: 'menunggu-persetujuan' },
  disetujui: { label: 'Selesai', kelas: 'selesai' },
  ditolak: { label: 'Ditolak', kelas: 'ditolak' },
}

export const statusStaf = (status) => STATUS_STAF[status] || { label: status, kelas: 'diajukan' }

// Jumlah hari sejak tanggal tertentu (untuk "lama menunggu").
export const hariSejak = (nilai) => {
  const tanggal = new Date(nilai)
  if (Number.isNaN(tanggal.getTime())) return 0
  return Math.max(0, Math.floor((Date.now() - tanggal.getTime()) / (24 * 60 * 60 * 1000)))
}

export const formatWaktu = (nilai) => {
  const tanggal = new Date(nilai)
  return Number.isNaN(tanggal.getTime())
    ? '-'
    : tanggal.toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// Status yang masih berjalan (belum selesai, belum ditolak, dan tidak menunggu perbaikan mahasiswa).
export const sedangDiproses = (status) => !['perlu_perbaikan', 'disetujui', 'ditolak'].includes(status)

export const formatTanggal = (nilai) => {
  const tanggal = new Date(nilai)
  return Number.isNaN(tanggal.getTime())
    ? '-'
    : tanggal.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Tanggal lokal dalam bentuk YYYY-MM-DD, untuk filter rentang tanggal.
export const tanggalIso = (nilai) => {
  const tanggal = new Date(nilai)
  if (Number.isNaN(tanggal.getTime())) return ''
  const dua = (angka) => String(angka).padStart(2, '0')
  return `${tanggal.getFullYear()}-${dua(tanggal.getMonth() + 1)}-${dua(tanggal.getDate())}`
}

// Bentuk data server (GET /api/pengajuan) menjadi baris tabel.
export const keBarisStaf = (item) => ({
  id: item.id,
  no: item.no_referensi,
  name: item.mahasiswa.nama,
  nim: item.mahasiswa.nim,
  service: item.layanan.nama_layanan,
  date: formatTanggal(item.created_at),
  dateValue: tanggalIso(item.created_at),
  createdAt: item.created_at,
  statusKode: item.status,
  status: statusStaf(item.status).label,
  kelas: statusStaf(item.status).kelas,
})
