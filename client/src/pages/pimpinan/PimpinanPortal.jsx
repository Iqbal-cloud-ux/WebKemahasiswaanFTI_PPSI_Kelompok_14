import { useState } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { ClipboardCheck, History } from 'lucide-react'
import { ErrorBoundary } from '../../components/ErrorBoundary.jsx'
import { PimpinanLayout } from '../../layouts/PimpinanLayout.jsx'
import { TidakDitemukanPage } from '../galat/TidakDitemukanPage.jsx'
import { ProfilStafPage } from '../staf/ProfilStafPage.jsx'
import { ROLE_LABELS, ROLE_ROUTES, normalizeRole } from '../../utils/roles.js'
import { AntreanParafPage } from './AntreanParafPage.jsx'
import { DetailPemeriksaanPage } from './DetailPemeriksaanPage.jsx'
import { RiwayatPengesahanPage } from './RiwayatPengesahanPage.jsx'

// Menu pimpinan (docs/alur-layar.md): Draft Menunggu Pemeriksaan, Riwayat Pengesahan.
const NAVIGASI = [
  { kunci: 'antrean', label: 'Draft Menunggu Pemeriksaan', icon: ClipboardCheck, path: '' },
  { kunci: 'riwayat', label: 'Riwayat Pengesahan', icon: History, path: '/riwayat' },
]

// Portal Kepala Kantor (/kepala-kantor) dan Wakil Dekan 1 (/wakil-dekan) (#89).
// Kedua peran memakai halaman yang sama; server yang menentukan tahap paraf masing-masing.
export function PimpinanPortal({ user, onUpdateUser, onLogout }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const peran = normalizeRole(user.role)
  const base = ROLE_ROUTES[peran]
  const peranLabel = peran === 'wakil-dekan' ? 'Wakil Dekan 1' : ROLE_LABELS[peran]
  const nama = user.nama || peranLabel

  const sisa = location.pathname.replace(base, '').replace(/\/+$/, '')
  const activePage = sisa === '/profil' ? 'profil' : sisa.startsWith('/riwayat') ? 'riwayat' : 'antrean'

  const openPage = (kunci) => {
    setSidebarOpen(false)
    navigate(kunci === 'profil' ? `${base}/profil` : `${base}${NAVIGASI.find((n) => n.kunci === kunci).path}`)
  }
  const initials = nama.split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase()

  return (
    <PimpinanLayout
      nama={nama}
      peranLabel={peranLabel}
      navigasi={NAVIGASI}
      activePage={activePage}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      onOpenPage={openPage}
      onLogout={onLogout}
    >
      <ErrorBoundary resetKey={location.key}>
        <Routes>
          <Route index element={<AntreanParafPage peranLabel={peranLabel} onPeriksa={(id) => navigate(`${base}/periksa/${id}`)} pesan={location.state?.pesan} />} />
          <Route path="periksa/:id" element={<DetailPemeriksaanPage peranLabel={peranLabel} onKembali={(pesan) => navigate(base, { state: pesan ? { pesan } : undefined })} />} />
          <Route path="riwayat" element={<RiwayatPengesahanPage onPeriksa={(id) => navigate(`${base}/periksa/${id}`)} />} />
          <Route path="profil" element={<ProfilStafPage user={user} staffName={nama} initials={initials} onUpdateUser={onUpdateUser} />} />
          <Route path="*" element={<TidakDitemukanPage dalamPortal beranda={base} />} />
        </Routes>
      </ErrorBoundary>
    </PimpinanLayout>
  )
}
