import { useState } from 'react'
import { AlertCircle, ClipboardCheck, Eye, PenLine, Search, Undo2 } from 'lucide-react'
import { useDataServer } from '../../hooks/useDataServer.js'
import { riwayatParafRequest } from '../../services/api.js'
import { formatWaktu, statusStaf } from '../../utils/statusPengajuan.js'

const KEPUTUSAN = {
  approved: { label: 'Diparaf', kelas: 'selesai' },
  returned: { label: 'Dikembalikan', kelas: 'perlu-perbaikan' },
  rejected: { label: 'Ditolak', kelas: 'ditolak' },
}

// Riwayat Pengesahan (#89): statistik dan daftar draf yang sudah diperiksa pimpinan yang login.
export function RiwayatPengesahanPage({ onPeriksa }) {
  const [riwayat] = useDataServer(riwayatParafRequest, { statistik: { total: 0, diparaf: 0, dikembalikan: 0 }, riwayat: [] })
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')
  const { statistik } = riwayat.data
  const rows = riwayat.data.riwayat
    .filter((r) => !filter || r.keputusan === filter)
    .filter((r) => `${r.no_referensi} ${r.mahasiswa.nama} ${r.mahasiswa.nim} ${r.nama_layanan}`.toLowerCase().includes(search.trim().toLowerCase()))
  const angka = (nilai) => (riwayat.status === 'siap' ? nilai : '-')

  return (
    <>
      <div className="staff-breadcrumb">Layanan Kemahasiswaan FTI <span>/</span> Riwayat Pengesahan</div>
      <div className="staff-dashboard-heading"><h1>Riwayat Pengesahan</h1><p>Draf yang sudah Anda periksa, paraf, atau kembalikan.</p></div>
      {riwayat.status === 'galat' && <div className="staff-notice error" role="alert"><AlertCircle size={16} /><span>{riwayat.pesan}</span></div>}

      <section className="staff-stats-grid pimpinan-stats" aria-label="Statistik pengesahan">
        <article className="staff-stat-card featured"><span>Total Diperiksa</span><ClipboardCheck size={17} /><strong>{angka(statistik.total)}</strong><b>Semua keputusan</b><small>Sejak awal</small></article>
        <article className="staff-stat-card"><span>Diparaf</span><PenLine size={17} /><strong>{angka(statistik.diparaf)}</strong><b>Diteruskan</b><small>Ke tahap berikutnya</small></article>
        <article className="staff-stat-card"><span>Dikembalikan</span><Undo2 size={17} /><strong>{angka(statistik.dikembalikan)}</strong><b>Untuk direvisi</b><small>Ke Staf Akademik</small></article>
      </section>

      <section className="staff-panel staff-queue-panel">
        <div className="staff-panel-heading"><div><h2>Daftar Keputusan · {rows.length}</h2><p>Status sekarang menunjukkan posisi pengajuan saat ini.</p></div></div>
        <div className="pimpinan-filter">
          <span className="staff-search-control"><input type="search" aria-label="Cari riwayat" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nomor pengajuan, nama, atau NIM" /><Search size={16} /></span>
          <select aria-label="Filter keputusan" value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="">Semua keputusan</option>
            <option value="approved">Diparaf</option>
            <option value="returned">Dikembalikan</option>
          </select>
        </div>
        <div className="staff-table-wrap">
          <table className="staff-submission-table">
            <thead><tr><th>Waktu Keputusan</th><th>Mahasiswa / NIM</th><th>Pengajuan</th><th>Keputusan</th><th>Status Sekarang</th><th>Aksi</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{formatWaktu(r.created_at)}</td>
                  <td><strong>{r.mahasiswa.nama}</strong><span>{r.mahasiswa.nim}</span></td>
                  <td>{r.no_referensi}<small className="pimpinan-sub">{r.nama_layanan}</small></td>
                  <td><span className={`staff-submission-status status-${KEPUTUSAN[r.keputusan]?.kelas}`}>{KEPUTUSAN[r.keputusan]?.label || r.keputusan}</span>{r.catatan && <small className="pimpinan-sub">{r.catatan}</small>}</td>
                  <td>{statusStaf(r.status_pengajuan).label}</td>
                  <td><button type="button" className="staff-review-button" onClick={() => onPeriksa(r.pengajuan_id)}><Eye size={13} /> Lihat</button></td>
                </tr>
              ))}
              {riwayat.status === 'memuat' && <tr><td className="staff-empty-results" colSpan="6">Memuat riwayat...</td></tr>}
              {riwayat.status === 'siap' && rows.length === 0 && <tr><td className="staff-empty-results" colSpan="6">Belum ada riwayat pengesahan.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
