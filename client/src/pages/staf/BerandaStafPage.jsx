import { AlertCircle, Check, FileText, LogOut, Send, Undo2 } from 'lucide-react'
import { useDataServer } from '../../hooks/useDataServer.js'
import { aktivitasStafRequest } from '../../services/api.js'
import { formatWaktu, hariSejak, keBarisStaf } from '../../utils/statusPengajuan.js'

const JUMLAH_ANTREAN = 5
const BATAS_TUNGGU_HARI = 2

// "baru saja", "12 menit lalu", "3 jam lalu"; lebih dari sehari memakai tanggal dan jam.
const waktuRelatif = (nilai) => {
  const menit = Math.floor((Date.now() - new Date(nilai).getTime()) / 60000)
  if (Number.isNaN(menit)) return '-'
  if (menit < 1) return 'baru saja'
  if (menit < 60) return `${menit} menit lalu`
  if (menit < 24 * 60) return `${Math.floor(menit / 60)} jam lalu`
  return formatWaktu(nilai)
}

const hariIni = () => new Date().toDateString()
const bulanIni = (nilai) => {
  const tanggal = new Date(nilai)
  const sekarang = new Date()
  return tanggal.getFullYear() === sekarang.getFullYear() && tanggal.getMonth() === sekarang.getMonth()
}

// Beranda staf. Judul dan breadcrumb-nya dirender oleh StafPortal.
// pengajuan = { status, data, pesan } dari StafPortal (GET /api/pengajuan).
// Aktivitas Terbaru = perpindahan status pengajuan terakhir dari server (GET /api/pengajuan/aktivitas).
export function BerandaStafPage({ pengajuan, onReview }) {
  const [aktivitas] = useDataServer(aktivitasStafRequest)
  const rows = pengajuan.data.map((item) => ({ ...keBarisStaf(item), updatedAt: item.updated_at }))
  const siap = pengajuan.status === 'siap'
  const hitung = (cek) => (siap ? rows.filter(cek).length : '-')
  // Antrean: pengajuan berstatus Diajukan, yang paling lama menunggu lebih dulu.
  const antrean = rows
    .filter((row) => row.statusKode === 'diajukan')
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  const perLayanan = Object.entries(rows.filter((row) => bulanIni(row.createdAt)).reduce((acc, row) => ({ ...acc, [row.service]: (acc[row.service] || 0) + 1 }), {}))
    .sort((a, b) => b[1] - a[1])
  const totalBulanIni = perLayanan.reduce((jumlah, [, nilai]) => jumlah + nilai, 0)

  return (
    <>
      {pengajuan.status === 'galat' && <div className="staff-notice error" role="alert"><AlertCircle size={16} /><span>{pengajuan.pesan}</span></div>}
      <section className="staff-stats-grid" aria-label="Ringkasan layanan">
        <article className="staff-stat-card featured"><span>Pengajuan Baru</span><FileText size={17} /><strong>{hitung((row) => new Date(row.createdAt).toDateString() === hariIni())}</strong><b>Masuk hari ini</b><small>Semua status</small></article>
        <article className="staff-stat-card"><span>Perlu Diverifikasi</span><FileText size={17} /><strong>{hitung((row) => row.statusKode === 'diajukan')}</strong><b>Menunggu pemeriksaan</b><small>{siap ? `${antrean.filter((row) => hariSejak(row.createdAt) > BATAS_TUNGGU_HARI).length} menunggu lebih dari ${BATAS_TUNGGU_HARI} hari` : '-'}</small></article>
        <article className="staff-stat-card"><span>Perlu Perbaikan</span><FileText size={17} /><strong>{hitung((row) => row.statusKode === 'perlu_perbaikan')}</strong><b>Menunggu mahasiswa</b><small>Dokumen perlu dilengkapi</small></article>
        <article className="staff-stat-card"><span>Sudah Diverifikasi</span><FileText size={17} /><strong>{hitung((row) => row.statusKode === 'diverifikasi')}</strong><b>Siap disusun drafnya</b><small>Lihat menu Draf Surat</small></article>
        <article className="staff-stat-card"><span>Selesai Bulan Ini</span><FileText size={17} /><strong>{hitung((row) => row.statusKode === 'disetujui' && bulanIni(row.updatedAt))}</strong><b>Surat telah terbit</b><small>Bulan berjalan</small></article>
      </section>

      <section className="staff-panel staff-queue-panel" id="staff-queue">
        <div className="staff-panel-heading"><div><h2>Antrean Pengajuan</h2><p>{JUMLAH_ANTREAN} pengajuan terlama yang belum diperiksa. Dahulukan pengajuan dengan waktu tunggu lebih dari {BATAS_TUNGGU_HARI} hari.</p></div></div>
        <div className="staff-table-wrap">
          <table className="staff-submission-table">
            <thead><tr><th>Nomor Pengajuan</th><th>Mahasiswa / NIM</th><th>Jenis Surat</th><th>Tanggal Masuk</th><th>Status</th><th>Lama Menunggu</th><th>Aksi</th></tr></thead>
            <tbody>
              {antrean.slice(0, JUMLAH_ANTREAN).map((row) => {
                const hari = hariSejak(row.createdAt)
                const lewat = hari > BATAS_TUNGGU_HARI
                return (
                  <tr key={row.id}>
                    <td>{row.no}</td>
                    <td><strong>{row.name}</strong><span>{row.nim}</span></td>
                    <td>{row.service}</td>
                    <td>{row.date}</td>
                    <td><span className="staff-submission-status"><Send size={11} /> {row.status}</span></td>
                    <td className={lewat ? 'staff-waiting overdue' : 'staff-waiting'}>{lewat && <span>△ </span>}{hari === 0 ? 'Hari ini' : `${hari} hari`}</td>
                    <td><button type="button" className="staff-review-button" onClick={() => onReview(row)}><LogOut size={13} /> Periksa</button></td>
                  </tr>
                )
              })}
              {siap && antrean.length === 0 && <tr><td className="staff-empty-results" colSpan="7">Tidak ada pengajuan yang menunggu pemeriksaan.</td></tr>}
              {pengajuan.status === 'memuat' && <tr><td className="staff-empty-results" colSpan="7">Memuat antrean...</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <div className="staff-lower-grid">
        <section className="staff-panel staff-activity-panel">
          <h2>Aktivitas Terbaru</h2>
          {aktivitas.status === 'galat' && <div className="staff-notice error" role="alert"><AlertCircle size={16} /><span>{aktivitas.pesan}</span></div>}
          {/* Aktivitas yang perlu diperhatikan (perbaikan, penolakan, draf dikembalikan) diberi ikon dan warna berbeda. */}
          <div className="staff-activity-list">{aktivitas.data.map((item) => (
            <article className="staff-activity-item" key={item.id}>
              <span className={`staff-activity-check${item.perhatian ? ' perhatian' : ''}`}>{item.perhatian ? <Undo2 size={13} /> : <Check size={14} />}</span>
              <div><strong>{item.judul}</strong><p>{item.keterangan}</p><small>{waktuRelatif(item.waktu)}</small></div>
            </article>
          ))}</div>
          {aktivitas.status === 'memuat' && <p className="staff-chart-caption">Memuat aktivitas...</p>}
          {aktivitas.status === 'siap' && aktivitas.data.length === 0 && <p className="staff-chart-caption">Belum ada aktivitas pengajuan.</p>}
        </section>
        <section className="staff-panel staff-services-panel">
          <h2>Pengajuan per Jenis Layanan <span>(bulan ini)</span></h2>
          <div className="staff-service-chart">{perLayanan.map(([name, value], index) => (
            <div className="staff-service-row" key={name}>
              <span>{name}</span><div className="staff-service-track"><i className={index === 0 ? 'primary' : ''} style={{ width: `${(value / perLayanan[0][1]) * 100}%` }} /></div><strong>{value}</strong>
            </div>
          ))}</div>
          <p className="staff-chart-caption">{totalBulanIni} pengajuan bulan ini</p>
        </section>
      </div>
    </>
  )
}
