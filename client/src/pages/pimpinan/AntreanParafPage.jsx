import { useState } from 'react'
import { AlertCircle, CheckCircle2, ClipboardCheck, Clock3, LogOut, Search, X } from 'lucide-react'
import { useDataServer } from '../../hooks/useDataServer.js'
import { antreanParafRequest } from '../../services/api.js'
import { formatWaktu, hariSejak } from '../../utils/statusPengajuan.js'
import { usePesanOtomatis } from '../../hooks/usePesanOtomatis.js'

const BATAS_TUNGGU_HARI = 2

// Draft Menunggu Pemeriksaan (#89): antrean draf di tahap paraf peran yang login (GET /api/paraf/antrean).
// pesan = hasil keputusan terakhir dari halaman Detail Pemeriksaan.
export function AntreanParafPage({ peranLabel, onPeriksa, pesan }) {
  const [antrean] = useDataServer(antreanParafRequest)
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState(pesan || '')
  usePesanOtomatis(notice, () => setNotice(''))

  const rows = antrean.data.filter((d) => `${d.no_referensi} ${d.mahasiswa.nama} ${d.mahasiswa.nim} ${d.nama_layanan}`.toLowerCase().includes(search.trim().toLowerCase()))
  const lewat = antrean.data.filter((d) => hariSejak(d.masuk_tahap_at) > BATAS_TUNGGU_HARI).length

  return (
    <>
      <div className="staff-breadcrumb">Layanan Kemahasiswaan FTI <span>/</span> Draft Menunggu Pemeriksaan</div>
      <div className="staff-dashboard-heading"><h1>Draft Menunggu Pemeriksaan</h1><p>Periksa draf surat dari Staf Akademik, lalu beri paraf atau kembalikan dengan catatan.</p></div>

      {notice && <div className="staff-notice success" role="status"><CheckCircle2 size={16} /><span>{notice}</span><button type="button" className="pimpinan-tutup" onClick={() => setNotice('')} aria-label="Tutup pesan"><X size={15} /></button></div>}
      {antrean.status === 'galat' && <div className="staff-notice error" role="alert"><AlertCircle size={16} /><span>{antrean.pesan}</span></div>}

      <section className="staff-stats-grid pimpinan-stats" aria-label="Ringkasan antrean">
        <article className="staff-stat-card featured"><span>Menunggu Paraf Anda</span><ClipboardCheck size={17} /><strong>{antrean.status === 'siap' ? antrean.data.length : '-'}</strong><b>{peranLabel}</b><small>Draf di tahap Anda</small></article>
        <article className="staff-stat-card"><span>Menunggu &gt; {BATAS_TUNGGU_HARI} Hari</span><Clock3 size={17} /><strong>{antrean.status === 'siap' ? lewat : '-'}</strong><b>Perlu didahulukan</b><small>Sejak masuk tahap Anda</small></article>
      </section>

      <section className="staff-panel staff-queue-panel">
        <div className="staff-panel-heading">
          <div><h2>Antrean Draf · {rows.length}</h2><p>Draf yang paling lama menunggu ditampilkan lebih dulu.</p></div>
        </div>
        <label className="pimpinan-search" htmlFor="pimpinan-search">
          <span className="staff-visually-hidden">Cari draf</span>
          <span className="staff-search-control"><input id="pimpinan-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nomor pengajuan, nama, atau NIM" /><Search size={16} /></span>
        </label>
        <div className="staff-table-wrap">
          <table className="staff-submission-table">
            <thead><tr><th>Nomor Pengajuan</th><th>Mahasiswa / NIM</th><th>Jenis Surat</th><th>Masuk Tahap Anda</th><th>Lama Menunggu</th><th>Aksi</th></tr></thead>
            <tbody>
              {rows.map((d) => {
                const hari = hariSejak(d.masuk_tahap_at)
                return (
                  <tr key={d.pengajuan_id}>
                    <td>{d.no_referensi}</td>
                    <td><strong>{d.mahasiswa.nama}</strong><span>{d.mahasiswa.nim}</span></td>
                    <td>{d.nama_layanan}</td>
                    <td>{formatWaktu(d.masuk_tahap_at)}</td>
                    <td className={hari > BATAS_TUNGGU_HARI ? 'staff-waiting overdue' : 'staff-waiting'}>{hari > BATAS_TUNGGU_HARI && <span>△ </span>}{hari === 0 ? 'Hari ini' : `${hari} hari`}</td>
                    <td><button type="button" className="staff-review-button" onClick={() => onPeriksa(d.pengajuan_id)}><LogOut size={13} /> Periksa</button></td>
                  </tr>
                )
              })}
              {antrean.status === 'memuat' && <tr><td className="staff-empty-results" colSpan="6">Memuat antrean...</td></tr>}
              {antrean.status === 'siap' && rows.length === 0 && <tr><td className="staff-empty-results" colSpan="6">{antrean.data.length === 0 ? 'Tidak ada draf yang menunggu pemeriksaan Anda.' : 'Tidak ada draf yang cocok dengan pencarian.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
