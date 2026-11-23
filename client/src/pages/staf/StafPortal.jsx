import { useEffect, useState } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { ErrorBoundary } from '../../components/ErrorBoundary.jsx'
import { TidakDitemukanPage } from '../galat/TidakDitemukanPage.jsx'
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

// Alamat tiap menu staf; kuncinya = label menu di layouts/StaffLayout.jsx.
// Nama rute [BELUM FINAL], mengikuti pola /staf/...
const PAGE_PATHS = {
  Beranda: '/staf',
  'Daftar Pengajuan': '/staf/pengajuan',
  'Draf Surat': '/staf/draf-surat',
  'Arsip Surat': '/staf/arsip-surat',
  'Jenis Layanan & Template': '/staf/layanan-template',
  'Rekapitulasi & Laporan': '/staf/rekap',
  Profil: '/staf/profil',
}

const pageFromPath = (pathname) => {
  const path = pathname.replace(/\/+$/, '')
  return Object.keys(PAGE_PATHS).find((label) => PAGE_PATHS[label] === path) || null
}

// Portal staf: memeriksa hak akses ke server, lalu menampilkan halaman sesuai alamat.
// Untuk menambah halaman staf: buat file di folder ini, tambahkan di PAGE_PATHS,
// NAVIGATION (layouts/StaffLayout.jsx), dan <Route> di bawah.
export function StafPortal({ user, onLogout }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [access, setAccess] = useState({ status: 'checking', message: '' })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState(null)

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

  const activePage = pageFromPath(location.pathname)
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
    setSelectedSubmission(null)
    if (location.pathname !== PAGE_PATHS[label]) navigate(PAGE_PATHS[label])
  }
  const closeReview = () => setSelectedSubmission(null)

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
        <ErrorBoundary resetKey={`${location.key}:${selectedSubmission?.id || ''}`}>
          {activePage === 'Beranda' && <div className="staff-breadcrumb">Layanan Kemahasiswaan FTI <span>/</span> Beranda</div>}
          {activePage === 'Beranda' && <div className="staff-dashboard-heading"><h1>Beranda</h1><p>{today} · Ringkasan layanan dan pekerjaan yang perlu Anda tindak lanjuti.</p></div>}

          {/* Periksa pengajuan tampil menimpa halaman aktif (dari Beranda atau Daftar Pengajuan). */}
          {selectedSubmission ? (
            <PeriksaPengajuanPage submission={selectedSubmission} onClose={closeReview} />
          ) : (
            <Routes>
              <Route index element={<BerandaStafPage onReview={setSelectedSubmission} />} />
              <Route path="pengajuan" element={<DaftarPengajuanPage onReview={setSelectedSubmission} selectedSubmission={selectedSubmission} onCloseReview={closeReview} />} />
              <Route path="draf-surat" element={<DrafSuratPage />} />
              <Route path="arsip-surat" element={<ArsipSuratPage />} />
              <Route path="layanan-template" element={<LayananTemplatePage />} />
              <Route path="rekap" element={<RekapPage />} />
              <Route path="profil" element={<ProfilStafPage user={user} staffName={staffName} initials={initials} />} />
              <Route path="*" element={<TidakDitemukanPage dalamPortal beranda={PAGE_PATHS.Beranda} />} />
            </Routes>
          )}
        </ErrorBoundary>
      )}
    </StaffLayout>
  )
}
