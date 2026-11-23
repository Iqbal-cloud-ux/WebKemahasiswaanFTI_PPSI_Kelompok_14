import { useEffect, useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import { StaffLayout } from '../../layouts/StaffLayout.jsx'
import { checkStaffAccess } from '../../services/api.js'
import { ArsipSuratPage } from './ArsipSuratPage.jsx'
import { BerandaStafPage } from './BerandaStafPage.jsx'
import { DaftarPengajuanPage } from './DaftarPengajuanPage.jsx'
import { DrafSuratPage } from './DrafSuratPage.jsx'
import { LayananTemplatePage } from './LayananTemplatePage.jsx'
import { PeriksaPengajuanPage } from './PeriksaPengajuanPage.jsx'
import { ProfilStafPage } from './ProfilStafPage.jsx'
import { RekapPage } from './RekapPage.jsx'

// Portal staf: memeriksa hak akses ke server, lalu menampilkan halaman sesuai menu.
// Untuk menambah halaman staf: buat file di folder ini, lalu daftarkan di PAGES.
const PAGES = {
  'Daftar Pengajuan': ({ openReview, selectedSubmission, closeReview }) => <DaftarPengajuanPage onReview={openReview} selectedSubmission={selectedSubmission} onCloseReview={closeReview} />,
  'Draf Surat': () => <DrafSuratPage />,
  'Arsip Surat': () => <ArsipSuratPage />,
  'Jenis Layanan & Template': () => <LayananTemplatePage />,
  'Rekapitulasi & Laporan': () => <RekapPage />,
  Profil: ({ user, staffName, initials }) => <ProfilStafPage user={user} staffName={staffName} initials={initials} />,
}

export function StafPortal({ user, onLogout }) {
  const [access, setAccess] = useState({ status: 'checking', message: '' })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [activePage, setActivePage] = useState('Beranda')

  useEffect(() => {
    let active = true
    checkStaffAccess()
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok || !result.success) {
          throw new Error(response.status === 403
            ? 'Akses ditolak. Halaman ini khusus Staff Akademik.'
            : result.message || 'Sesi tidak valid. Silakan masuk kembali.')
        }
        return result
      })
      .then((result) => {
        if (active) setAccess({ status: 'authorized', message: result.message })
      })
      .catch((error) => {
        if (active) setAccess({ status: 'denied', message: error.message || 'Server tidak dapat dihubungi.' })
      })
    return () => { active = false }
  }, [])

  const staffName = user?.nama || 'Staf Akademik Contoh'
  const initials = staffName.split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase()
  const today = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  const openPage = (label) => {
    setSidebarOpen(false)
    setActivePage(label)
    setSelectedSubmission(null)
  }
  const closeReview = () => setSelectedSubmission(null)
  const renderPage = PAGES[activePage]

  return (
    <StaffLayout
      staffName={staffName}
      initials={initials}
      activePage={activePage}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      onOpenPage={openPage}
      onLogout={onLogout}
    >
      {access.status === 'checking' && <div className="staff-access-message" role="status"><span className="staff-spinner" /> Memeriksa hak akses...</div>}
      {access.status === 'denied' && (
        <div className="staff-access-card">
          <div className="staff-notice error" role="alert"><ShieldAlert size={17} /><span>{access.message}</span></div>
          <button type="button" className="staff-login-button staff-access-link" onClick={onLogout}>Kembali ke Login</button>
        </div>
      )}
      {access.status === 'authorized' && (
        <>
          {activePage === 'Beranda' && <div className="staff-breadcrumb">Layanan Kemahasiswaan FTI <span>/</span> Beranda</div>}
          {activePage === 'Beranda' && <div className="staff-dashboard-heading"><h1>Beranda</h1><p>{today} · Ringkasan layanan dan pekerjaan yang perlu Anda tindak lanjuti.</p></div>}

          {selectedSubmission ? (
            <PeriksaPengajuanPage submission={selectedSubmission} onClose={closeReview} />
          ) : activePage === 'Beranda' ? (
            <BerandaStafPage onReview={setSelectedSubmission} />
          ) : renderPage({ user, staffName, initials, openReview: setSelectedSubmission, selectedSubmission, closeReview })}
        </>
      )}
    </StaffLayout>
  )
}
