import { useState } from 'react'
import { Archive, BarChart3, Bell, ChevronDown, FilePlus2, FileText, GraduationCap, Home, Inbox, LogOut, Menu, UserRound, Users, X } from 'lucide-react'

// Kerangka halaman staf: sidebar kiri + bar atas. Gaya ada di layouts/portal.css.
const NAVIGATION = [
  { label: 'Beranda', icon: Home },
  { label: 'Daftar Pengajuan', icon: Inbox },
  { label: 'Draf Surat', icon: FileText },
  { label: 'Arsip Surat', icon: Archive },
  { label: 'Jenis Layanan & Template', icon: FilePlus2 },
  { label: 'Manajemen Akun', icon: Users },
]

export function StaffLayout({ staffName, initials, photoUrl, activePage, sidebarOpen, setSidebarOpen, onOpenPage, onLogout, children }) {
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  return (
    <main className={`staff-dashboard-page${activePage === 'Rekapitulasi & Laporan' ? ' staff-report-print-page' : ''}`}>
      <aside className={`staff-sidebar${sidebarOpen ? ' is-open' : ''}`} aria-label="Navigasi staff akademik">
        <div className="staff-sidebar-brand">
          <div className="staff-brand-mark"><GraduationCap size={20} /></div>
          <strong>Layanan<br />Kemahasiswaan FTI</strong>
          <button type="button" className="staff-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Tutup menu"><X size={18} /></button>
        </div>
        <div className="staff-workspace-label">RUANG KERJA</div>
        <div className="staff-workspace-name">Staf Akademik</div>
        <nav className="staff-side-nav">
          {NAVIGATION.map(({ label, icon: Icon }) => (
            <button type="button" className={`staff-side-link${label === activePage ? ' active' : ''}`} key={label} onClick={() => onOpenPage(label)}>
              <Icon size={16} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="staff-side-divider" />
        <button type="button" className={`staff-side-link${activePage === 'Rekapitulasi & Laporan' ? ' active' : ''}`} onClick={() => onOpenPage('Rekapitulasi & Laporan')}><BarChart3 size={16} /><span>Rekapitulasi &amp; Laporan</span></button>
        <button type="button" className="staff-side-link" onClick={() => onOpenPage('Profil')}><UserRound size={16} /><span>Profil</span></button>
        <div className="staff-sidebar-footer">Fakultas Teknologi Informasi<br />Universitas Andalas</div>
      </aside>
      {sidebarOpen && <button type="button" className="staff-sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-label="Tutup menu navigasi" />}

      <div className="staff-workspace">
        <header className="staff-topbar">
          <button type="button" className="staff-menu-toggle" onClick={() => setSidebarOpen(true)} aria-label="Buka menu"><Menu size={19} /></button>
          <div className="staff-topbar-title"><strong>{staffName}</strong><span>Staf Akademik</span></div>
          <div className="staff-topbar-actions">
            <div className="staff-popover-anchor">
              <button type="button" className={`staff-icon-button${notificationsOpen ? ' active' : ''}`} onClick={() => { setNotificationsOpen((open) => !open); setProfileOpen(false) }} aria-label="Notifikasi"><Bell size={17} /><i /></button>
              {notificationsOpen && <div className="staff-popover staff-notification-popover"><strong>Notifikasi terbaru</strong><p>3 pengajuan baru menunggu pemeriksaan.</p><span>Terakhir diperbarui beberapa menit lalu</span></div>}
            </div>
            <div className="staff-popover-anchor">
              <button type="button" className="staff-profile-button" onClick={() => { setProfileOpen((open) => !open); setNotificationsOpen(false) }} aria-expanded={profileOpen}>
                {photoUrl
                  ? <img className="staff-avatar" src={photoUrl} alt="" />
                  : <span className="staff-avatar">{initials || 'SA'}</span>}<ChevronDown size={14} />
              </button>
              {profileOpen && <div className="staff-popover staff-profile-popover"><strong>{staffName}</strong><span>Staf Akademik</span><button type="button" aria-label="Lihat profil" onClick={(event) => { event.preventDefault(); event.stopPropagation(); setProfileOpen(false); onOpenPage('Profil') }}><UserRound size={14} /> Lihat Profil</button><button type="button" className="staff-profile-logout" onClick={onLogout}><LogOut size={14} /> Keluar</button></div>}
            </div>
          </div>
        </header>

        <section className="staff-dashboard-content">{children}</section>
        <footer className="staff-dashboard-footer">Fakultas Teknologi Informasi, Universitas Andalas. © 2026</footer>
      </div>
    </main>
  )
}
