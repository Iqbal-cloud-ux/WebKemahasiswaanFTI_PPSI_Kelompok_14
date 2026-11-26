import { useState } from 'react'
import { AlertCircle, CheckCircle2, ClipboardCheck, Clock3, Eye, Search, X } from 'lucide-react'
import { useDataServer } from '../../hooks/useDataServer.js'
import { usePesanOtomatis } from '../../hooks/usePesanOtomatis.js'
import { antreanDekanRequest } from '../../services/api.js'
import { formatWaktu, hariSejak } from '../../utils/statusPengajuan.js'

const BATAS_TUNGGU_HARI = 2

export function AntreanKeputusanPage({ onTinjau, pesan }) {
  const [antrean] = useDataServer(antreanDekanRequest)
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState(pesan || '')
  usePesanOtomatis(notice, () => setNotice(''))

  const rows = antrean.data.filter((item) => `${item.no_referensi} ${item.mahasiswa.nama} ${item.mahasiswa.nim} ${item.nama_layanan}`.toLowerCase().includes(search.trim().toLowerCase()))
  const lewat = antrean.data.filter((item) => hariSejak(item.masuk_tahap_at) > BATAS_TUNGGU_HARI).length

  return (
    <>
      <div className="staff-breadcrumb">Layanan Kemahasiswaan FTI <span>/</span> Menunggu Keputusan</div>
      <div className="staff-dashboard-heading"><h1>Menunggu Keputusan</h1><p>Tinjau surat yang telah diparaf Kepala Kantor dan Wakil Dekan 1, lalu setujui, kembalikan, atau tolak.</p></div>

      {notice && <div className="staff-notice success" role="status"><CheckCircle2 size={16} /><span>{notice}</span><button type="button" className="pimpinan-tutup" onClick={() => setNotice('')} aria-label="Tutup pesan"><X size={15} /></button></div>}
      {antrean.status === 'galat' && <div className="staff-notice error" role="alert"><AlertCircle size={16} /><span>{antrean.pesan}</span></div>}

      <section className="staff-stats-grid pimpinan-stats" aria-label="Ringkasan keputusan Dekan">
        <article className="staff-stat-card featured"><span>Menunggu Keputusan Anda</span><ClipboardCheck size={17} /><strong>{antrean.status === 'siap' ? antrean.data.length : '-'}</strong><b>Antrean Dekan</b><small>Surat yang siap ditinjau</small></article>
        <article className="staff-stat-card"><span>Menunggu &gt; {BATAS_TUNGGU_HARI} Hari</span><Clock3 size={17} /><strong>{antrean.status === 'siap' ? lewat : '-'}</strong><b>Perlu didahulukan</b><small>Sejak masuk tahap Dekan</small></article>
      </section>

      <section className="staff-panel staff-queue-panel">
        <div className="staff-panel-heading"><div><h2>Antrean Surat · {rows.length}</h2><p>Surat yang paling lama menunggu ditampilkan lebih dulu.</p></div></div>
        <label className="pimpinan-search" htmlFor="dekan-antrean-search">
          <span className="staff-visually-hidden">Cari pengajuan</span>
          <span className="staff-search-control"><input id="dekan-antrean-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nomor pengajuan, nama, atau NIM" /><Search size={16} /></span>
        </label>
        <div className="staff-table-wrap">
          <table className="staff-submission-table">
            <thead><tr><th>Nomor Pengajuan</th><th>Mahasiswa / NIM</th><th>Jenis Surat</th><th>Masuk Tahap Dekan</th><th>Lama Menunggu</th><th>Aksi</th></tr></thead>
            <tbody>
              {rows.map((item) => {
                const hari = hariSejak(item.masuk_tahap_at)
                return (
                  <tr key={item.pengajuan_id}>
                    <td>{item.no_referensi}</td>
                    <td><strong>{item.mahasiswa.nama}</strong><span>{item.mahasiswa.nim}</span></td>
                    <td>{item.nama_layanan}</td>
                    <td>{formatWaktu(item.masuk_tahap_at)}</td>
                    <td className={hari > BATAS_TUNGGU_HARI ? 'staff-waiting overdue' : 'staff-waiting'}>{hari > BATAS_TUNGGU_HARI && <span>△ </span>}{hari === 0 ? 'Hari ini' : `${hari} hari`}</td>
                    <td><button type="button" className="staff-review-button" onClick={() => onTinjau(item.pengajuan_id)}><Eye size={13} /> Tinjau</button></td>
                  </tr>
                )
              })}
              {antrean.status === 'memuat' && <tr><td className="staff-empty-results" colSpan="6">Memuat antrean...</td></tr>}
              {antrean.status === 'siap' && rows.length === 0 && <tr><td className="staff-empty-results" colSpan="6">{antrean.data.length === 0 ? 'Tidak ada surat yang menunggu keputusan Anda.' : 'Tidak ada surat yang cocok dengan pencarian.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
