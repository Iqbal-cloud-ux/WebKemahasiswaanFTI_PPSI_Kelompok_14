import { useState } from 'react'
import { StudentLayout } from '../../layouts/StudentLayout.jsx'
import { buatPengajuanContoh, notifications, notifikasiAwalDibaca } from '../../data/contohMahasiswa.js'
import { BerandaMahasiswaPage } from './BerandaMahasiswaPage.jsx'
import { NotifikasiPage } from './NotifikasiPage.jsx'
import { PengajuanPage } from './PengajuanPage.jsx'
import { ProfilMahasiswaPage } from './ProfilMahasiswaPage.jsx'
import { RiwayatPage } from './RiwayatPage.jsx'

// Alamat (hash) tiap menu mahasiswa.
const VIEW_URLS = {
  home: '/mahasiswa',
  apply: '/mahasiswa#pengajuan',
  history: '/mahasiswa#riwayat',
  notifications: '/mahasiswa#notifikasi',
  profile: '/mahasiswa#profil',
}

// Portal mahasiswa: memilih halaman yang tampil dan menyimpan state yang dipakai lintas halaman.
// Untuk menambah halaman mahasiswa: buat file di folder ini, tambahkan di VIEW_URLS, NAVIGATION
// (layouts/StudentLayout.jsx), dan di bagian render di bawah.
export function MahasiswaPortal({ user, onUpdateUser, onLogout }) {
  const [activeView, setActiveView] = useState('home')
  const [menuOpen, setMenuOpen] = useState(false)
  const [readNotifications, setReadNotifications] = useState(notifikasiAwalDibaca)
  const [selectedSubmissionId, setSelectedSubmissionId] = useState('')
  const [application, setApplication] = useState({ service: '', key: 0 })

  const submissions = buatPengajuanContoh(user)
  const unreadCount = notifications.filter((notification) => !readNotifications.includes(notification.id)).length

  const openView = (view) => {
    setActiveView(view)
    setMenuOpen(false)
    window.history.pushState({}, '', VIEW_URLS[view])
  }

  // Selalu mulai formulir baru (key berubah = formulir dibuat ulang dari awal).
  const openApplication = (serviceTitle = '') => {
    setApplication((current) => ({ service: serviceTitle, key: current.key + 1 }))
    openView('apply')
  }

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
      {activeView === 'apply' && <PengajuanPage key={application.key} user={user} initialService={application.service} onCancel={() => openView('home')} />}
      {activeView === 'history' && <RiwayatPage submissions={submissions} selectedSubmissionId={selectedSubmissionId} setSelectedSubmissionId={setSelectedSubmissionId} />}
      {activeView === 'notifications' && <NotifikasiPage readNotifications={readNotifications} setReadNotifications={setReadNotifications} onOpenSubmission={openSubmission} />}
      {activeView === 'profile' && <ProfilMahasiswaPage user={user} onUpdateUser={onUpdateUser} />}
      {activeView === 'home' && <BerandaMahasiswaPage user={user} submissions={submissions} onApply={openApplication} />}
    </StudentLayout>
  )
}
