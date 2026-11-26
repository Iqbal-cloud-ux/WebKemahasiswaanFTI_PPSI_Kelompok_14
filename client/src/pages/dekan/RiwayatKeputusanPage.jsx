import { useState } from 'react'
import { AlertCircle, ClipboardCheck, Eye, PenLine, Search, Undo2, X } from 'lucide-react'
import { useDataServer } from '../../hooks/useDataServer.js'
import { riwayatDekanRequest } from '../../services/api.js'
import { formatWaktu, statusStaf } from '../../utils/statusPengajuan.js'

const KEPUTUSAN = {
  approved: { label: 'Disetujui', kelas: 'selesai' },
  returned: { label: 'Dikembalikan', kelas: 'perlu-perbaikan' },
  rejected: { label: 'Ditolak', kelas: 'ditolak' },
}

export function RiwayatKeputusanPage({ onTinjau }) {
  const [riwayat] = useDataServer(riwayatDekanRequest, { statistik: { total: 0, disetujui: 0, ditolak: 0, dikembalikan: 0 }, riwayat: [] })
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const { statistik } = riwayat.data
  const rows = riwayat.data.riwayat
    .filter((item) => !filter || item.keputusan === filter)
    .filter((item) => `${item.no_referensi} ${item.mahasiswa.nama} ${item.mahasiswa.nim} ${item.nama_layanan}`.toLowerCase().includes(search.trim().toLowerCase()))
  const angka = (nilai) => (riwayat.status === 'siap' ? nilai : '-')

  return (
    <>
      <div className="staff-breadcrumb">Layanan Kemahasiswaan FTI <span>/</span> Riwayat Keputusan</div>
      <div className="staff-dashboard-heading"><h1>Riwayat Keputusan</h1><p>Daftar surat yang pernah Anda setujui, kembalikan, atau tolak.</p></div>
      {riwayat.status === 'galat' && <div className="staff-notice error" role="alert"><AlertCircle size={16} /><span>{riwayat.pesan}</span></div>}

      <section className="staff-stats-grid pimpinan-stats" aria-label="Statistik keputusan Dekan">
        <article className="staff-stat-card featured"><span>Total Keputusan</span><ClipboardCheck size={17} /><strong>{angka(statistik.total)}</strong><b>Semua keputusan</b><small>Sejak awal</small></article>
        <article className="staff-stat-card"><span>Disetujui</span><PenLine size={17} /><strong>{angka(statistik.disetujui)}</strong><b>Surat diterbitkan</b><small>Dengan kode verifikasi</small></article>
        <article className="staff-stat-card"><span>Dikembalikan</span><Undo2 size={17} /><strong>{angka(statistik.dikembalikan)}</strong><b>Untuk direvisi</b><small>Ke Staf Akademik</small></article>
        <article className="staff-stat-card"><span>Ditolak</span><X size={17} /><strong>{angka(statistik.ditolak)}</strong><b>Pengajuan ditolak</b><small>Keputusan akhir</small></article>
      </section>

      <section className="staff-panel staff-queue-panel">
        <div className="staff-panel-heading"><div><h2>Daftar Keputusan · {rows.length}</h2><p>Status sekarang menunjukkan posisi terakhir pengajuan.</p></div></div>
        <div className="pimpinan-filter">
          <span className="staff-search-control"><input type="search" aria-label="Cari riwayat keputusan" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nomor pengajuan, nama, atau NIM" /><Search size={16} /></span>
          <select aria-label="Filter keputusan" value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="">Semua keputusan</option>
            <option value="approved">Disetujui</option>
            <option value="returned">Dikembalikan</option>
            <option value="rejected">Ditolak</option>
          </select>
        </div>
        <div className="staff-table-wrap">
          <table className="staff-submission-table">
            <thead><tr><th>Waktu Keputusan</th><th>Mahasiswa / NIM</th><th>Pengajuan</th><th>Keputusan</th><th>Status Sekarang</th><th>Aksi</th></tr></thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td>{formatWaktu(item.created_at)}</td>
                  <td><strong>{item.mahasiswa.nama}</strong><span>{item.mahasiswa.nim}</span></td>
                  <td>{item.no_referensi}<small className="pimpinan-sub">{item.nama_layanan}</small></td>
                  <td><span className={`staff-submission-status status-${KEPUTUSAN[item.keputusan]?.kelas}`}>{KEPUTUSAN[item.keputusan]?.label || item.keputusan}</span>{item.catatan && <small className="pimpinan-sub">{item.catatan}</small>}</td>
                  <td>{statusStaf(item.status_pengajuan).label}</td>
                  <td><button type="button" className="staff-review-button" onClick={() => onTinjau(item.pengajuan_id)}><Eye size={13} /> Lihat</button></td>
                </tr>
              ))}
              {riwayat.status === 'memuat' && <tr><td className="staff-empty-results" colSpan="6">Memuat riwayat...</td></tr>}
              {riwayat.status === 'siap' && rows.length === 0 && <tr><td className="staff-empty-results" colSpan="6">Belum ada riwayat keputusan.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
