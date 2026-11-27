import { useState } from 'react'
import { ClipboardCheck, History, Home, ScrollText } from 'lucide-react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { ErrorBoundary } from '../../components/ErrorBoundary.jsx'
import { PimpinanLayout } from '../../layouts/PimpinanLayout.jsx'
import { TidakDitemukanPage } from '../galat/TidakDitemukanPage.jsx'
import { LogAktivitasPage } from './LogAktivitasPage.jsx'
import { ProfilStafPage } from '../staf/ProfilStafPage.jsx'
import { ROLE_ROUTES, normalizeRole } from '../../utils/roles.js'
import { AntreanKeputusanPage } from './AntreanKeputusanPage.jsx'
import { BerandaDekanPage } from './BerandaDekanPage.jsx'
import { DetailKeputusanPage } from './DetailKeputusanPage.jsx'
import { RiwayatKeputusanPage } from './RiwayatKeputusanPage.jsx'

// Menu Dekan (docs/alur-layar.md). Pengaturan TTE (#92) menyusul.
const NAVIGASI = [
  { kunci: 'beranda', label: 'Beranda', icon: Home, path: '' },
  { kunci: 'antrean', label: 'Menunggu Keputusan', icon: ClipboardCheck, path: '/antrean' },
  { kunci: 'riwayat', label: 'Riwayat Keputusan', icon: History, path: '/riwayat' },
  { kunci: 'log', label: 'Log Aktivitas', icon: ScrollText, path: '/log' },
]

const halamanAktif = (sisa) => {
  if (sisa === '/profil') return 'profil'
  if (sisa.startsWith('/riwayat')) return 'riwayat'
  if (sisa.startsWith('/log')) return 'log'
  if (sisa.startsWith('/antrean') || sisa.startsWith('/tinjau')) return 'antrean'
  return 'beranda'
}

export function DekanPortal({ user, onUpdateUser, onLogout }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const base = ROLE_ROUTES[normalizeRole(user.role)]
  const nama = user.nama || 'Dekan'
  const sisa = location.pathname.replace(base, '').replace(/\/+$/, '')
  const activePage = halamanAktif(sisa)
  const initials = nama.split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase()

  const openPage = (kunci) => {
    setSidebarOpen(false)
    navigate(kunci === 'profil' ? `${base}/profil` : `${base}${NAVIGASI.find((item) => item.kunci === kunci).path}`)
  }

  return (
    <PimpinanLayout
      nama={nama}
      peranLabel="Dekan"
      photoUrl={user.foto_profil}
      navigasi={NAVIGASI}
      activePage={activePage}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      onOpenPage={openPage}
      onLogout={onLogout}
    >
      <ErrorBoundary resetKey={location.key}>
        <Routes>
          <Route index element={<BerandaDekanPage onTinjau={(id) => navigate(`${base}/tinjau/${id}`)} onBukaAntrean={() => openPage('antrean')} onBukaRiwayat={() => openPage('riwayat')} />} />
          <Route path="antrean" element={<AntreanKeputusanPage onTinjau={(id) => navigate(`${base}/tinjau/${id}`)} pesan={location.state?.pesan} />} />
          <Route path="tinjau/:id" element={<DetailKeputusanPage onKembali={(pesan) => navigate(`${base}/antrean`, { state: pesan ? { pesan } : undefined })} />} />
          <Route path="riwayat" element={<RiwayatKeputusanPage onTinjau={(id) => navigate(`${base}/tinjau/${id}`)} />} />
          <Route path="log" element={<LogAktivitasPage />} />
          <Route path="profil" element={<ProfilStafPage user={user} staffName={nama} initials={initials} onUpdateUser={onUpdateUser} roleLabel="Dekan" unitKerja="Pimpinan Fakultas Teknologi Informasi" />} />
          <Route path="*" element={<TidakDitemukanPage dalamPortal beranda={base} />} />
        </Routes>
      </ErrorBoundary>
    </PimpinanLayout>
  )
}
