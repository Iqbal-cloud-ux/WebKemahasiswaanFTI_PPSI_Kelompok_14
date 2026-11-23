import { Check, ChevronRight } from 'lucide-react'
import { notifications } from '../../data/contohMahasiswa.js'

// Daftar pemberitahuan. "Lihat Detail" membuka pengajuan terkait di halaman Riwayat.
export function NotifikasiPage({ readNotifications, setReadNotifications, onOpenSubmission }) {
  return (
    <>
            <div className="breadcrumb">Layanan Kemahasiswaan FTI / Mahasiswa</div>
            <div className="notifications-heading"><h1>Notifikasi</h1><p>Perkembangan layanan dan informasi pengajuan milik Anda.</p></div>
            <div className="notifications-toolbar"><button type="button" className="outline-button" disabled={!notifications.some((notification) => !readNotifications.includes(notification.id))} onClick={() => setReadNotifications(notifications.map((notification) => notification.id))}><Check size={15} /> Tandai semua dibaca</button></div>
            <section className="notifications-list" aria-label="Semua notifikasi">
              <h2>Semua Notifikasi</h2>
              {notifications.map((notification) => {
                const isRead = readNotifications.includes(notification.id)
                return <article className={`notification-item${isRead ? ' is-read' : ''}`} key={notification.id}>
                  <div className="notification-meta"><span className={`status-pill ${notification.tone}`}><span />{notification.status}</span>{!isRead && <span className="unread-dot" aria-label="Belum dibaca" />}</div>
                  <div className="notification-card">
                    <p className="notification-time">{notification.time} · {isRead ? 'Sudah dibaca' : 'Belum dibaca'}</p>
                    <h3>Pengajuan {notification.submissionId}</h3>
                    <p className="notification-message">Pengajuan {notification.submissionId} {notification.message}</p>
                    <div className="notification-card-footer"><button type="button" className="small-button" onClick={() => { setReadNotifications((current) => current.includes(notification.id) ? current : [...current, notification.id]); onOpenSubmission(notification.submissionId) }}>Lihat Detail <ChevronRight size={14} /></button></div>
                  </div>
                </article>
              })}
            </section>
    </>
  )
}
