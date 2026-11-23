import { useState } from 'react'
import { Bell, ChevronDown, FilePlus2, GraduationCap, History, Home, LogOut, Menu, UserRound, X } from 'lucide-react'

// Kerangka halaman mahasiswa: sidebar kiri + topbar, sama dengan halaman staf
// (memakai kelas CSS staff-* di layouts/portal.css agar tampilan dan perilaku HP identik).
const NAVIGATION = [
  { view: 'home', label: 'Beranda', icon: Home },
  { view: 'apply', label: 'Pengajuan Layanan', icon: FilePlus2 },
  { view: 'history', label: 'Riwayat Pengajuan', icon: History },
  { view: 'notifications', label: 'Notifikasi', icon: Bell },
]

export function StudentLayout({ user, activeView, unreadCount, sidebarOpen, setSidebarOpen, onNavigate, onLogout, children }) {
  const [profileOpen, setProfileOpen] = useState(false)
  const name = user.nama || 'Mahasiswa'
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase()

  const navigate = (view) => {
    setProfileOpen(false)
    setSidebarOpen(false)
    onNavigate(view)
  }

  return (
    <main className="staff-dashboard-page student-dashboard-page">
      <aside className={`staff-sidebar${sidebarOpen ? ' is-open' : ''}`} aria-label="Navigasi mahasiswa">
        <div className="staff-sidebar-brand">
          <div className="staff-brand-mark"><GraduationCap size={20} /></div>
          <strong>Layanan<br />Kemahasiswaan FTI</strong>
          <button type="button" className="staff-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Tutup menu"><X size={18} /></button>
        </div>
        <div className="staff-workspace-label">PORTAL</div>
        <div className="staff-workspace-name">Mahasiswa</div>
        <nav className="staff-side-nav">
          {NAVIGATION.map(({ view, label, icon: Icon }) => (
            <button type="button" className={`staff-side-link${activeView === view ? ' active' : ''}`} key={view} onClick={() => navigate(view)} aria-current={activeView === view ? 'page' : undefined}>
              <Icon size={16} /><span>{label}</span>
              {view === 'notifications' && unreadCount > 0 && <span className="student-nav-badge" aria-label={`${unreadCount} belum dibaca`}>{unreadCount}</span>}
            </button>
          ))}
        </nav>
        <div className="staff-side-divider" />
        <button type="button" className={`staff-side-link${activeView === 'profile' ? ' active' : ''}`} onClick={() => navigate('profile')}><UserRound size={16} /><span>Profil</span></button>
        <button type="button" className="staff-side-link student-side-logout" onClick={onLogout}><LogOut size={16} /><span>Keluar</span></button>
        <div className="staff-sidebar-footer">Fakultas Teknologi Informasi<br />Universitas Andalas</div>
      </aside>
      {sidebarOpen && <button type="button" className="staff-sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-label="Tutup menu navigasi" />}

      <div className="staff-workspace">
        <header className="staff-topbar">
          <button type="button" className="staff-menu-toggle" onClick={() => setSidebarOpen(true)} aria-label="Buka menu"><Menu size={19} /></button>
          <div className="staff-topbar-title"><strong>{name}</strong><span>Mahasiswa{user.identifier ? ` · ${user.identifier}` : ''}</span></div>
          <div className="staff-topbar-actions">
            <button type="button" className={`staff-icon-button student-bell${activeView === 'notifications' ? ' active' : ''}`} onClick={() => navigate('notifications')} aria-label={unreadCount ? `Notifikasi, ${unreadCount} belum dibaca` : 'Notifikasi'}>
              <Bell size={17} />{unreadCount > 0 && <i />}
            </button>
            <div className="staff-popover-anchor">
              <button type="button" className="staff-profile-button" onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen} aria-label="Menu akun">
                <span className="staff-avatar">{initials || 'M'}</span><ChevronDown size={14} />
              </button>
              {profileOpen && (
                <div className="staff-popover staff-profile-popover">
                  <strong>{name}</strong><span>Mahasiswa</span>
                  <button type="button" onClick={() => navigate('profile')}><UserRound size={14} /> Lihat Profil</button>
                  <button type="button" className="staff-profile-logout" onClick={onLogout}><LogOut size={14} /> Keluar</button>
                </div>
              )}
            </div>
          </div>
        </header>

        <section className="staff-dashboard-content student-dashboard-content">{children}</section>
        <footer className="staff-dashboard-footer">Fakultas Teknologi Informasi, Universitas Andalas. © 2026</footer>
      </div>
    </main>
  )
}
