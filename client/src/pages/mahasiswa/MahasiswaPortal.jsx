import { useEffect, useState } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { ErrorBoundary } from '../../components/ErrorBoundary.jsx'
import { TidakDitemukanPage } from '../galat/TidakDitemukanPage.jsx'
import { StudentLayout } from '../../layouts/StudentLayout.jsx'
import { useDataServer } from '../../hooks/useDataServer.js'
import { bacaHasil, bacaNotifikasiRequest, bacaSemuaNotifikasiRequest, daftarLayananRequest, notifikasiRequest, pengajuanSayaRequest } from '../../services/api.js'
import { formatTanggal, statusMahasiswa, tanggalIso } from '../../utils/statusPengajuan.js'
import { BerandaMahasiswaPage } from './BerandaMahasiswaPage.jsx'
import { NotifikasiPage } from './NotifikasiPage.jsx'
import { PengajuanPage } from './PengajuanPage.jsx'
import { PerbaikanPage } from './PerbaikanPage.jsx'
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
const PERBAIKAN_PATH = '/mahasiswa/perbaikan'
// Notifikasi dan status diperbarui berkala selama portal terbuka.
const INTERVAL_PERBARUI_MS = 60 * 1000

const viewFromPath = (pathname) => {
  const path = pathname.replace(/\/+$/, '')
  if (path.startsWith(PERBAIKAN_PATH)) return 'history'
  return Object.keys(VIEW_PATHS).find((view) => VIEW_PATHS[view] === path) || null
}

// Bentuk data pengajuan dari server (GET /api/pengajuan/saya) menjadi bentuk yang dipakai halaman.
const keTampilan = (pengajuan, user) => {
  const { label, tone } = statusMahasiswa(pengajuan.status)
  return {
    id: pengajuan.no_referensi,
    pengajuanId: pengajuan.id,
    statusKode: pengajuan.status,
    title: pengajuan.layanan.nama_layanan,
    date: formatTanggal(pengajuan.created_at),
    dateValue: tanggalIso(pengajuan.created_at),
    status: label,
    tone,
    applicant: user.nama || 'Mahasiswa',
    keperluan: pengajuan.keperluan,
    catatan: pengajuan.catatan_revisi,
  }
}

// Portal mahasiswa: rute halaman mahasiswa dan state yang dipakai lintas halaman.
// Untuk menambah halaman mahasiswa: buat file di folder ini, tambahkan di VIEW_PATHS,
// NAVIGATION (layouts/StudentLayout.jsx), dan <Route> di bawah.
export function MahasiswaPortal({ user, onUpdateUser, onLogout }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedSubmissionId, setSelectedSubmissionId] = useState('')
  const [layanan, muatLayanan] = useDataServer(daftarLayananRequest)
  const [pengajuan, muatPengajuan] = useDataServer(pengajuanSayaRequest)
  const [notifikasi, muatNotifikasi] = useDataServer(notifikasiRequest, { notifikasi: [], belum_dibaca: 0 })

  useEffect(() => {
    const timer = window.setInterval(() => { muatNotifikasi(); muatPengajuan() }, INTERVAL_PERBARUI_MS)
    return () => window.clearInterval(timer)
  }, [muatNotifikasi, muatPengajuan])

  const activeView = viewFromPath(location.pathname)
  const dataPengajuan = { ...pengajuan, data: pengajuan.data.map((item) => keTampilan(item, user)) }

  const openView = (view, state) => {
    setMenuOpen(false)
    navigate(VIEW_PATHS[view], { state })
  }

  // Layanan yang dipilih di Beranda (id jenis layanan) dibawa lewat state navigasi.
  const openApplication = (layananId = null) => openView('apply', { layananId })

  // submissionId = nomor referensi (PGJ-...), dipakai untuk memilih baris di Riwayat.
  const openSubmission = (submissionId) => {
    setSelectedSubmissionId(submissionId)
    openView('history')
  }

  const openPerbaikan = (pengajuanId) => {
    setMenuOpen(false)
    navigate(`${PERBAIKAN_PATH}/${pengajuanId}`)
  }

  // Setelah pengajuan terkirim: muat ulang daftar pengajuan, kelayakan layanan, dan notifikasi.
  const afterSubmit = (hasil, noHp) => {
    muatPengajuan()
    muatLayanan()
    muatNotifikasi()
    if (noHp && noHp !== user.no_hp) onUpdateUser({ ...user, no_hp: noHp })
    setSelectedSubmissionId(hasil.no_referensi)
  }

  const bacaNotifikasi = async (id) => {
    await bacaHasil(await bacaNotifikasiRequest(id)).catch(() => {})
    muatNotifikasi()
  }
  const bacaSemuaNotifikasi = async () => {
    await bacaHasil(await bacaSemuaNotifikasiRequest()).catch(() => {})
    muatNotifikasi()
  }

  return (
    <StudentLayout
      user={user}
      activeView={activeView}
      unreadCount={notifikasi.data.belum_dibaca}
      sidebarOpen={menuOpen}
      setSidebarOpen={setMenuOpen}
      onNavigate={(view) => (view === 'apply' ? openApplication() : openView(view))}
      onLogout={onLogout}
    >
      <ErrorBoundary resetKey={location.key}>
        <Routes>
          <Route index element={<BerandaMahasiswaPage user={user} pengajuan={dataPengajuan} layanan={layanan} onApply={openApplication} onOpenSubmission={openSubmission} onPerbaiki={openPerbaikan} />} />
          {/* key = location.key: setiap membuka menu ini, formulir dimulai dari awal. */}
          <Route path="pengajuan" element={<PengajuanPage key={location.key} user={user} layanan={layanan} initialLayananId={location.state?.layananId ?? null} onCancel={() => openView('home')} onSubmitted={afterSubmit} onOpenHistory={() => openView('history')} />} />
          <Route path="riwayat" element={<RiwayatPage pengajuan={dataPengajuan} layanan={layanan.data} selectedSubmissionId={selectedSubmissionId} setSelectedSubmissionId={setSelectedSubmissionId} onPerbaiki={openPerbaikan} />} />
          <Route path="perbaikan/:id" element={<PerbaikanPage key={location.key} onSelesai={(hasil) => { muatPengajuan(); muatNotifikasi(); setSelectedSubmissionId(hasil.no_referensi) }} onOpenHistory={() => openView('history')} />} />
          <Route path="notifikasi" element={<NotifikasiPage notifikasi={notifikasi} onBaca={bacaNotifikasi} onBacaSemua={bacaSemuaNotifikasi} onOpenSubmission={openSubmission} />} />
          <Route path="profil" element={<ProfilMahasiswaPage user={user} onUpdateUser={onUpdateUser} />} />
          <Route path="*" element={<TidakDitemukanPage dalamPortal beranda={VIEW_PATHS.home} />} />
        </Routes>
      </ErrorBoundary>
    </StudentLayout>
  )
}
