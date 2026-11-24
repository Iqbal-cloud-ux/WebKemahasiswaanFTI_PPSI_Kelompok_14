import { Check, ChevronRight } from 'lucide-react'
import { formatWaktu, toneDariLabel } from '../../utils/statusPengajuan.js'
import { StatusMuat } from './BerandaMahasiswaPage.jsx'

// Judul notifikasi dari server berbentuk "Pengajuan PGJ-2026-00001: <label status>".
const labelDariJudul = (judul) => judul.split(': ').slice(1).join(': ') || 'Informasi'

// Daftar pemberitahuan milik mahasiswa (GET /api/notifikasi). "Lihat Detail" menandai dibaca
// lalu membuka pengajuan terkait di halaman Riwayat.
export function NotifikasiPage({ notifikasi, onBaca, onBacaSemua, onOpenSubmission }) {
  const daftar = notifikasi.data.notifikasi
  return (
    <>
      <div className="breadcrumb">Layanan Kemahasiswaan FTI / Mahasiswa</div>
      <div className="notifications-heading"><h1>Notifikasi</h1><p>Perkembangan layanan dan informasi pengajuan milik Anda.</p></div>
      <div className="notifications-toolbar"><button type="button" className="outline-button" disabled={notifikasi.data.belum_dibaca === 0} onClick={onBacaSemua}><Check size={15} /> Tandai semua dibaca</button></div>
      <section className="notifications-list" aria-label="Semua notifikasi">
        <h2>Semua Notifikasi</h2>
        <StatusMuat state={{ ...notifikasi, data: daftar }} kosong="Belum ada notifikasi." />
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
