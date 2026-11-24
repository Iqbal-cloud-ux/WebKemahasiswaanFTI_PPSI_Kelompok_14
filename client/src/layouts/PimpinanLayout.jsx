import { useState } from 'react'
import { ChevronDown, GraduationCap, LogOut, Menu, UserRound, X } from 'lucide-react'

// Kerangka halaman pimpinan (Kepala Kantor, Wakil Dekan 1): sidebar kiri + bar atas.
// Memakai gaya yang sama dengan portal staf (layouts/portal.css, pages/staf/staf.css).
// navigasi = [{ kunci, label, icon }], activePage = kunci menu yang aktif.
export function PimpinanLayout({ nama, peranLabel, navigasi, activePage, sidebarOpen, setSidebarOpen, onOpenPage, onLogout, children }) {
  const [profileOpen, setProfileOpen] = useState(false)
  const initials = (nama || peranLabel).split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase()

  return (
    <main className="staff-dashboard-page">
      <aside className={`staff-sidebar${sidebarOpen ? ' is-open' : ''}`} aria-label={`Navigasi ${peranLabel}`}>
        <div className="staff-sidebar-brand">
          <div className="staff-brand-mark"><GraduationCap size={20} /></div>
          <strong>Layanan<br />Kemahasiswaan FTI</strong>
          <button type="button" className="staff-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Tutup menu"><X size={18} /></button>
        </div>
        <div className="staff-workspace-label">RUANG KERJA</div>
        <div className="staff-workspace-name">{peranLabel}</div>
        <nav className="staff-side-nav">
          {navigasi.map(({ kunci, label, icon: Icon }) => (
            <button type="button" className={`staff-side-link${kunci === activePage ? ' active' : ''}`} key={kunci} onClick={() => onOpenPage(kunci)}>
              <Icon size={16} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="staff-side-divider" />
        <button type="button" className={`staff-side-link${activePage === 'profil' ? ' active' : ''}`} onClick={() => onOpenPage('profil')}><UserRound size={16} /><span>Profil</span></button>
        <div className="staff-sidebar-footer">Fakultas Teknologi Informasi<br />Universitas Andalas</div>
      </aside>
      {sidebarOpen && <button type="button" className="staff-sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-label="Tutup menu navigasi" />}

      <div className="staff-workspace">
        <header className="staff-topbar">
          <button type="button" className="staff-menu-toggle" onClick={() => setSidebarOpen(true)} aria-label="Buka menu"><Menu size={19} /></button>
          <div className="staff-topbar-title"><strong>{nama}</strong><span>{peranLabel}</span></div>
          <div className="staff-topbar-actions">
            <div className="staff-popover-anchor">
              <button type="button" className="staff-profile-button" onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen}>
                <span className="staff-avatar">{initials}</span><ChevronDown size={14} />
              </button>
              {profileOpen && <div className="staff-popover staff-profile-popover"><strong>{nama}</strong><span>{peranLabel}</span><button type="button" onClick={() => { setProfileOpen(false); onOpenPage('profil') }}><UserRound size={14} /> Lihat Profil</button><button type="button" className="staff-profile-logout" onClick={onLogout}><LogOut size={14} /> Keluar</button></div>}
            </div>
          </div>
        </header>

        <section className="staff-dashboard-content">{children}</section>
        <footer className="staff-dashboard-footer">Fakultas Teknologi Informasi, Universitas Andalas. © 2026</footer>
      </div>
    </main>
  )
}
