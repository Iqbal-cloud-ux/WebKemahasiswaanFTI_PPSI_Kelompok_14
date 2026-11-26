import { useState } from 'react'
import { Check, ChevronRight } from 'lucide-react'
import { formatWaktu, toneDariLabel } from '../../utils/statusPengajuan.js'
import { StatusMuat } from './BerandaMahasiswaPage.jsx'

// Tab penyaring daftar: label tab -> syarat notifikasi yang ditampilkan.
const TABS = {
  'Semua Notifikasi': () => true,
  'Belum Dibaca': (item) => !item.is_read,
  'Sudah Dibaca': (item) => Boolean(item.is_read),
}
const KOSONG = {
  'Semua Notifikasi': 'Belum ada notifikasi.',
  'Belum Dibaca': 'Tidak ada notifikasi yang belum dibaca.',
  'Sudah Dibaca': 'Belum ada notifikasi yang sudah dibaca.',
}

// Judul notifikasi dari server berbentuk "Pengajuan PGJ-2026-00001: <label status>".
const labelDariJudul = (judul) => judul.split(': ').slice(1).join(': ') || 'Informasi'

// Daftar pemberitahuan milik mahasiswa (GET /api/notifikasi). "Lihat Detail" menandai dibaca
// lalu membuka halaman detail pengajuan terkait. Tab memisahkan notifikasi yang belum dan sudah dibaca.
export function NotifikasiPage({ notifikasi, onBaca, onBacaSemua, onOpenSubmission }) {
  const [tabAktif, setTabAktif] = useState('Semua Notifikasi')
  const semua = notifikasi.data.notifikasi
  const daftar = semua.filter(TABS[tabAktif])
  return (
    <>
      <div className="breadcrumb">Layanan Kemahasiswaan FTI / Mahasiswa</div>
      <div className="notifications-heading"><h1>Notifikasi</h1><p>Perkembangan layanan dan informasi pengajuan milik Anda.</p></div>
      <div className="notifications-toolbar"><button type="button" className="outline-button" disabled={notifikasi.data.belum_dibaca === 0} onClick={onBacaSemua}><Check size={15} /> Tandai semua dibaca</button></div>
      <div className="notification-tabs" role="tablist" aria-label="Saring notifikasi">
        {Object.keys(TABS).map((tab) => (
          <button type="button" role="tab" aria-selected={tabAktif === tab} className={tabAktif === tab ? 'active' : ''} key={tab} onClick={() => setTabAktif(tab)}>
            {tab}<span className="notification-tab-count">{semua.filter(TABS[tab]).length}</span>
          </button>
        ))}
      </div>
      <section className="notifications-list" aria-label={tabAktif}>
        <StatusMuat state={{ ...notifikasi, data: daftar }} kosong={KOSONG[tabAktif]} />
        {daftar.map((item) => {
          const label = labelDariJudul(item.judul)
          return (
            <article className={`notification-item${item.is_read ? ' is-read' : ''}`} key={item.id}>
              <div className="notification-meta"><span className={`status-pill ${toneDariLabel(label)}`}><span />{label}</span>{!item.is_read && <span className="unread-dot" aria-label="Belum dibaca" />}</div>
              <div className="notification-card">
                <p className="notification-time">{formatWaktu(item.created_at)} · {item.is_read ? 'Sudah dibaca' : 'Belum dibaca'}</p>
                <h3>{item.no_referensi ? `Pengajuan ${item.no_referensi}` : item.judul}</h3>
                <p className="notification-message">{item.pesan}</p>
                <div className="notification-card-footer">
                  <button type="button" className="small-button" onClick={() => { if (!item.is_read) onBaca(item.id); if (item.no_referensi) onOpenSubmission(item.no_referensi) }}>{item.no_referensi ? 'Lihat Detail' : 'Tandai dibaca'} <ChevronRight size={14} /></button>
                </div>
              </div>
            </article>
          )
        })}
      </section>
    </>
  )
}
