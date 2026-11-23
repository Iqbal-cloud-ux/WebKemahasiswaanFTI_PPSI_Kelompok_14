import { useState } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { ErrorBoundary } from '../../components/ErrorBoundary.jsx'
import { TidakDitemukanPage } from '../galat/TidakDitemukanPage.jsx'
import { StudentLayout } from '../../layouts/StudentLayout.jsx'
import { buatPengajuanContoh, notifications, notifikasiAwalDibaca } from '../../data/contohMahasiswa.js'
import { BerandaMahasiswaPage } from './BerandaMahasiswaPage.jsx'
import { NotifikasiPage } from './NotifikasiPage.jsx'
import { PengajuanPage } from './PengajuanPage.jsx'
import { ProfilMahasiswaPage } from './ProfilMahasiswaPage.jsx'
import { RiwayatPage } from './RiwayatPage.jsx'

// Alamat tiap menu mahasiswa (nama rute [BELUM FINAL], mengikuti pola /mahasiswa/...).
const VIEW_PATHS = {
  home: '/mahasiswa',
  apply: '/mahasiswa/pengajuan',
  history: '/mahasiswa/riwayat',
  notifications: '/mahasiswa/notifikasi',
  profile: '/mahasiswa/profil',
}

const viewFromPath = (pathname) => {
  const path = pathname.replace(/\/+$/, '')
  return Object.keys(VIEW_PATHS).find((view) => VIEW_PATHS[view] === path) || null
}

// Portal mahasiswa: rute halaman mahasiswa dan state yang dipakai lintas halaman.
// Untuk menambah halaman mahasiswa: buat file di folder ini, tambahkan di VIEW_PATHS,
// NAVIGATION (layouts/StudentLayout.jsx), dan <Route> di bawah.
export function MahasiswaPortal({ user, onUpdateUser, onLogout }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [readNotifications, setReadNotifications] = useState(notifikasiAwalDibaca)
  const [selectedSubmissionId, setSelectedSubmissionId] = useState('')

  const activeView = viewFromPath(location.pathname)
  const submissions = buatPengajuanContoh(user)
  const unreadCount = notifications.filter((notification) => !readNotifications.includes(notification.id)).length

  const openView = (view, state) => {
    setMenuOpen(false)
    navigate(VIEW_PATHS[view], { state })
  }

  // Layanan yang dipilih di Beranda dibawa lewat state navigasi.
  const openApplication = (serviceTitle = '') => openView('apply', { service: serviceTitle })

  const openSubmission = (submissionId) => {
    setSelectedSubmissionId(submissionId)
    openView('history')
  }

  return (
    <StudentLayout
      user={user}
      activeView={activeView}
      unreadCount={unreadCount}
      sidebarOpen={menuOpen}
      setSidebarOpen={setMenuOpen}
      onNavigate={(view) => (view === 'apply' ? openApplication() : openView(view))}
      onLogout={onLogout}
    >
      <ErrorBoundary resetKey={location.key}>
        <Routes>
          <Route index element={<BerandaMahasiswaPage user={user} submissions={submissions} onApply={openApplication} />} />
          {/* key = location.key: setiap membuka menu ini, formulir dimulai dari awal. */}
          <Route path="pengajuan" element={<PengajuanPage key={location.key} user={user} initialService={location.state?.service || ''} onCancel={() => openView('home')} />} />
          <Route path="riwayat" element={<RiwayatPage submissions={submissions} selectedSubmissionId={selectedSubmissionId} setSelectedSubmissionId={setSelectedSubmissionId} />} />
          <Route path="notifikasi" element={<NotifikasiPage readNotifications={readNotifications} setReadNotifications={setReadNotifications} onOpenSubmission={openSubmission} />} />
          <Route path="profil" element={<ProfilMahasiswaPage user={user} onUpdateUser={onUpdateUser} />} />
          <Route path="*" element={<TidakDitemukanPage dalamPortal beranda={VIEW_PATHS.home} />} />
        </Routes>
      </ErrorBoundary>
    </StudentLayout>
  )
}
