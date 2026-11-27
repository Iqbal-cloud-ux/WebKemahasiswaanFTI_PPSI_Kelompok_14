import { useState } from 'react'
import { ClipboardCheck, History } from 'lucide-react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { ErrorBoundary } from '../../components/ErrorBoundary.jsx'
import { PimpinanLayout } from '../../layouts/PimpinanLayout.jsx'
import { TidakDitemukanPage } from '../galat/TidakDitemukanPage.jsx'
import { ProfilStafPage } from '../staf/ProfilStafPage.jsx'
import { ROLE_ROUTES, normalizeRole } from '../../utils/roles.js'
import { AntreanKeputusanPage } from './AntreanKeputusanPage.jsx'
import { DetailKeputusanPage } from './DetailKeputusanPage.jsx'
import { RiwayatKeputusanPage } from './RiwayatKeputusanPage.jsx'

const NAVIGASI = [
  { kunci: 'antrean', label: 'Menunggu Keputusan', icon: ClipboardCheck, path: '' },
  { kunci: 'riwayat', label: 'Riwayat Keputusan', icon: History, path: '/riwayat' },
]

export function DekanPortal({ user, onUpdateUser, onLogout }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const base = ROLE_ROUTES[normalizeRole(user.role)]
  const nama = user.nama || 'Dekan'
  const sisa = location.pathname.replace(base, '').replace(/\/+$/, '')
  const activePage = sisa === '/profil' ? 'profil' : sisa.startsWith('/riwayat') ? 'riwayat' : 'antrean'
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
          <Route index element={<AntreanKeputusanPage onTinjau={(id) => navigate(`${base}/tinjau/${id}`)} pesan={location.state?.pesan} />} />
          <Route path="tinjau/:id" element={<DetailKeputusanPage onKembali={(pesan) => navigate(base, { state: pesan ? { pesan } : undefined })} />} />
          <Route path="riwayat" element={<RiwayatKeputusanPage onTinjau={(id) => navigate(`${base}/tinjau/${id}`)} />} />
          <Route path="profil" element={<ProfilStafPage user={user} staffName={nama} initials={initials} onUpdateUser={onUpdateUser} roleLabel="Dekan" unitKerja="Pimpinan Fakultas Teknologi Informasi" />} />
          <Route path="*" element={<TidakDitemukanPage dalamPortal beranda={base} />} />
        </Routes>
      </ErrorBoundary>
    </PimpinanLayout>
  )
}
