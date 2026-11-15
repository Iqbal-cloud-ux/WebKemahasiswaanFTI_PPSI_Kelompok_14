import { ArrowLeft, ArrowRight, Bell, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, Download, Eye, EyeOff, FilePlus2, FileText, GraduationCap, Info, LockKeyhole, LogOut, Menu, MoreHorizontal, Search, ShieldAlert, Upload, X } from 'lucide-react'
import { useState } from 'react'
import './App.css'

function App() {
  const roleRoutes = { mahasiswa: '/mahasiswa', staf: '/staf', admin: '/admin' }
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeView, setActiveView] = useState('home')
  const [selectedService, setSelectedService] = useState('')
  const [applicationStep, setApplicationStep] = useState(1)
  const [historySearch, setHistorySearch] = useState('')
  const [historyService, setHistoryService] = useState('')
  const [historyStatus, setHistoryStatus] = useState('')
  const [historyFrom, setHistoryFrom] = useState('')
  const [historyTo, setHistoryTo] = useState('')
  const [historySort, setHistorySort] = useState('newest')
  const [historyPage, setHistoryPage] = useState(1)
  const [selectedSubmissionId, setSelectedSubmissionId] = useState('')
  const [readNotifications, setReadNotifications] = useState(['n-complete', 'n-submitted'])
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'))
    } catch {
      return null
    }
  })
  const [profileEmail, setProfileEmail] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user'))?.email || '' } catch { return '' }
  })
  const [profilePhone, setProfilePhone] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user'))?.no_hp || '' } catch { return '' }
  })
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [visiblePasswords, setVisiblePasswords] = useState({ current: false, new: false, confirm: false })

  const validate = () => {
    const nextErrors = {}
    if (!identifier.trim()) nextErrors.identifier = 'NIM/NIP atau email wajib diisi.'
    if (!password) nextErrors.password = 'Kata sandi wajib diisi.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setNotice(null)
    if (!validate()) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'NIM/NIP/email atau kata sandi salah.')
      }

      localStorage.setItem('token', result.data.token)
      localStorage.setItem('user', JSON.stringify(result.data))
      window.history.pushState({}, '', roleRoutes[result.data.role] || '/dashboard')
      setUser(result.data)
      setErrors({})
    } catch (error) {
      setNotice({ type: 'error', message: error.message || 'Server tidak dapat dihubungi.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setPassword('')
  }

  const openApplication = (serviceTitle = '') => {
    setSelectedService(serviceTitle)
    setApplicationStep(1)
    setActiveView('apply')
    setMenuOpen(false)
    window.history.pushState({}, '', '/mahasiswa#pengajuan')
  }

  const showDashboard = () => {
    setActiveView('home')
    setMenuOpen(false)
    window.history.pushState({}, '', '/mahasiswa')
  }

  const openHistory = () => {
    setActiveView('history')
    setHistoryPage(1)
    setMenuOpen(false)
    window.history.pushState({}, '', '/mahasiswa#riwayat')
  }

  const openNotifications = () => {
    setActiveView('notifications')
    setMenuOpen(false)
    window.history.pushState({}, '', '/mahasiswa#notifikasi')
  }

  const openProfile = () => {
    setActiveView('profile')
    setMenuOpen(false)
    setNotice(null)
    window.history.pushState({}, '', '/mahasiswa#profil')
  }

  const saveProfile = (event) => {
    event.preventDefault()
    const updatedUser = { ...user, email: profileEmail.trim(), no_hp: profilePhone.trim() }
    localStorage.setItem('user', JSON.stringify(updatedUser))
    setUser(updatedUser)
    setNotice({ type: 'info', message: 'Perubahan tersimpan di browser ini. Sinkronisasi ke server belum tersedia.' })
  }

  const changePassword = (event) => {
    event.preventDefault()
    if (!currentPassword || !newPassword || !confirmPassword) {
      setNotice({ type: 'error', message: 'Lengkapi semua kolom kata sandi terlebih dahulu.' })
      return
    }
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      setNotice({ type: 'error', message: 'Kata sandi baru harus memenuhi seluruh persyaratan keamanan.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setNotice({ type: 'error', message: 'Konfirmasi kata sandi baru tidak cocok.' })
      return
    }
    setNotice({ type: 'info', message: 'Validasi berhasil, tetapi fitur ubah kata sandi belum terhubung ke server.' })
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  if (user) {
    const services = [
      { title: 'Surat Keterangan Aktif Kuliah', description: 'Keterangan status aktif untuk keperluan administrasi.', documents: 'KRS Semester Berjalan, Surat Permohonan. Contoh sementara: menunggu konfirmasi Staf Akademik.' },
      { title: 'Beasiswa', description: 'Dokumen pendukung pengajuan bantuan pendidikan.', documents: 'SK Beasiswa, KRS, Surat Permohonan. Contoh sementara: menunggu konfirmasi Staf Akademik.' },
      { title: 'Penurunan UKT', description: 'Permohonan penyesuaian biaya kuliah Anda.', documents: 'SK Penurunan UKT, KRS, Surat Permohonan. Contoh sementara: menunggu konfirmasi Staf Akademik.' },
      { title: 'Pengembalian UKT', description: 'Permohonan pengembalian pembayaran UKT.', documents: 'Bukti pembayaran, KRS, Surat Permohonan. Contoh sementara: menunggu konfirmasi Staf Akademik.' },
      { title: 'Pengunduran Diri', description: 'Pengajuan pengunduran diri dari perkuliahan.', documents: 'KRS, Surat Permohonan. Contoh sementara: menunggu konfirmasi Staf Akademik.' },
    ]
    const submissions = [
      { id: 'PGJ-2026-00123', title: 'Surat Keterangan Aktif Kuliah', date: '22 Oktober 2026', dateValue: '2026-10-22', status: 'Diproses', tone: 'purple', applicant: user.nama || 'Mahasiswa', detail: 'Surat terbit tersedia dalam format PDF untuk keperluan ini.' },
      { id: 'PGJ-2026-00119', title: 'Beasiswa', date: '21 Oktober 2026', dateValue: '2026-10-21', status: 'Perlu Perbaikan', tone: 'orange', applicant: user.nama || 'Mahasiswa', detail: 'Mohon unggah kembali dokumen pendukung yang lebih jelas.' },
      { id: 'PGJ-2026-00118', title: 'Penurunan UKT', date: '21 Oktober 2026', dateValue: '2026-10-21', status: 'Menunggu Persetujuan', tone: 'amber', applicant: user.nama || 'Mahasiswa', detail: 'Dokumen telah diperiksa dan menunggu persetujuan.' },
      { id: 'PGJ-2026-00115', title: 'Pengembalian UKT', date: '20 Oktober 2026', dateValue: '2026-10-20', status: 'Ditolak', tone: 'red', applicant: user.nama || 'Mahasiswa', detail: 'Pengajuan belum dapat diproses. Silakan hubungi Staf Akademik untuk informasi lebih lanjut.' },
      { id: 'PGJ-2026-00110', title: 'Surat Keterangan Aktif Kuliah', date: '19 Oktober 2026', dateValue: '2026-10-19', status: 'Selesai', tone: 'green', applicant: user.nama || 'Mahasiswa', detail: 'Surat terbit tersedia dalam format PDF untuk keperluan ini.' },
    ]
    const notifications = [
      { id: 'n-processing', submissionId: 'PGJ-2026-00123', status: 'Diproses', tone: 'purple', time: '1 jam lalu', message: 'berubah status menjadi Diproses.' },
      { id: 'n-revision', submissionId: 'PGJ-2026-00119', status: 'Perlu Perbaikan', tone: 'orange', time: '2 jam lalu', message: 'berubah status menjadi Perlu Perbaikan.' },
      { id: 'n-verified', submissionId: 'PGJ-2026-00123', status: 'Diverifikasi', tone: 'teal', time: '3 jam lalu', message: 'telah diverifikasi oleh Staf Akademik.' },
      { id: 'n-complete', submissionId: 'PGJ-2026-00110', status: 'Selesai', tone: 'green', time: '3 hari lalu', message: 'berubah status menjadi Selesai.' },
      { id: 'n-submitted', submissionId: 'PGJ-2026-00123', status: 'Diajukan', tone: 'blue', time: '4 hari lalu', message: 'berhasil dikirim dan sedang menunggu pemeriksaan.' },
    ]
    const filteredSubmissions = submissions
      .filter((submission) => !historyService || submission.title === historyService)
      .filter((submission) => !historyStatus || submission.status === historyStatus)
      .filter((submission) => `${submission.id} ${submission.title} ${submission.applicant}`.toLowerCase().includes(historySearch.toLowerCase()))
      .filter((submission) => !historyFrom || submission.dateValue >= historyFrom)
      .filter((submission) => !historyTo || submission.dateValue <= historyTo)
      .sort((first, second) => historySort === 'oldest' ? first.dateValue.localeCompare(second.dateValue) : second.dateValue.localeCompare(first.dateValue))
    const historyPageSize = 5
    const historyPageCount = Math.max(1, Math.ceil(filteredSubmissions.length / historyPageSize))
    const visibleSubmissions = filteredSubmissions.slice((historyPage - 1) * historyPageSize, historyPage * historyPageSize)
    const selectedSubmission = filteredSubmissions.find((submission) => submission.id === selectedSubmissionId) || filteredSubmissions[0]
    const passwordCriteria = [newPassword.length >= 8, /[A-Z]/.test(newPassword), /[a-z]/.test(newPassword), /[0-9]/.test(newPassword), /[^A-Za-z0-9]/.test(newPassword)]
    const passwordStrength = passwordCriteria.filter(Boolean).length

    return (
      <main className="dashboard-page">
        <header className="dashboard-header">
          <div className="dashboard-header-inner">
            <div className="brand-row">
              <div className="brand-mark"><GraduationCap size={18} /></div>
              <div><strong>Layanan Kemahasiswaan FTI</strong><span>Universitas Andalas</span></div>
            </div>
            <button type="button" className="mobile-menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label="Buka menu">
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <nav className={menuOpen ? 'dashboard-nav is-open' : 'dashboard-nav'}>
              <a className={activeView === 'home' ? 'active' : ''} href="#beranda" onClick={(event) => { event.preventDefault(); showDashboard() }}>Beranda</a>
              <a className={activeView === 'apply' ? 'active' : ''} href="#pengajuan" onClick={(event) => { event.preventDefault(); openApplication() }}>Ajukan Layanan</a>
              <a className={activeView === 'history' ? 'active' : ''} href="#riwayat" onClick={(event) => { event.preventDefault(); openHistory() }}>Riwayat</a>
              <a className={activeView === 'profile' ? 'active' : ''} href="#profil" onClick={(event) => { event.preventDefault(); openProfile() }}>Profil</a>
            </nav>
            <div className="account-actions">
              <button type="button" className={`header-icon${activeView === 'notifications' ? ' active' : ''}`} onClick={openNotifications} aria-label={`Notifikasi${notifications.filter((notification) => !readNotifications.includes(notification.id)).length ? `, ${notifications.filter((notification) => !readNotifications.includes(notification.id)).length} belum dibaca` : ''}`}><Bell size={16} />{notifications.some((notification) => !readNotifications.includes(notification.id)) && <span className="notification-indicator" />}</button>
              <button type="button" className="account-button" id="profil"><span className="avatar">{(user.nama || 'A').charAt(0)}</span><span className="account-name">{user.nama || 'Mahasiswa'}</span><ChevronDown size={14} /></button>
              <button type="button" className="header-logout" onClick={handleLogout}><LogOut size={15} /> Keluar</button>
            </div>
          </div>
        </header>
        <div className="dashboard-main" id="beranda">
          {activeView === 'apply' ? <>
            <div className="breadcrumb">Layanan Kemahasiswaan FTI / Mahasiswa</div>
            <div className="application-heading"><h1>Ajukan Layanan</h1><p>Pilih jenis surat yang sesuai dengan kebutuhan Anda.</p></div>
            <div className="application-steps" aria-label="Tahapan pengajuan">
              <div className="application-step active"><span>{applicationStep > 1 ? <Check size={14} /> : '1'}</span><strong>Pilih Layanan</strong></div>
              <i />
              <div className={`application-step${applicationStep > 1 ? ' active' : ''}`}><span>2</span><strong>Isi Formulir &amp; Unggah Dokumen</strong></div>
              <i />
              <div className="application-step"><span>3</span><strong>Tinjau &amp; Kirim</strong></div>
            </div>
            {applicationStep === 1 ? <>
              <section className="temporary-note"><strong><Info size={15} /> Persyaratan sementara</strong><p>Daftar dokumen berikut adalah contoh dan masih menunggu konfirmasi Staf Akademik, bukan ketentuan resmi.</p></section>
              <div className="application-options" role="radiogroup" aria-label="Pilih jenis layanan">
                {services.map((service) => <div className="application-choice" key={service.title}>
                  <label className={`application-option${selectedService === service.title ? ' selected' : ''}`}>
                    <input type="radio" name="service" value={service.title} checked={selectedService === service.title} onChange={() => setSelectedService(service.title)} />
                    <span className="option-file-icon"><FileText size={17} /></span>
                    <span className="option-description"><strong>{service.title}</strong><span>{service.description}</span></span>
                    <span className="option-audience">Layanan surat</span>
                    <span className="option-radio" aria-hidden="true" />
                  </label>
                  <small className="option-documents">Dokumen yang dibutuhkan: {service.documents}</small>
                </div>)}
              </div>
              <div className="application-actions"><button type="button" className="primary-button" disabled={!selectedService} onClick={() => setApplicationStep(2)}>Lanjut <ArrowRight size={15} /></button></div>
            </> : <>
              <section className="application-form-panel">
                <h2>{selectedService}</h2>
                <p>{services.find((service) => service.title === selectedService)?.description}</p>
                <label htmlFor="application-note">Catatan pengajuan</label>
                <textarea id="application-note" rows="4" placeholder="Tuliskan keterangan tambahan (opsional)" />
                <label className="upload-field" htmlFor="application-files"><Upload size={19} /><strong>Unggah dokumen</strong><span>{services.find((service) => service.title === selectedService)?.documents}</span><input id="application-files" type="file" multiple /></label>
              </section>
              <div className="application-actions split"><button type="button" className="outline-button" onClick={() => setApplicationStep(1)}><ArrowLeft size={15} /> Kembali</button><button type="button" className="primary-button" onClick={() => setNotice({ type: 'info', message: 'Formulir pengajuan belum terhubung ke server.' })}>Lanjut <ArrowRight size={15} /></button></div>
            </>}
          </> : activeView === 'history' ? <>
            <div className="breadcrumb">Layanan Kemahasiswaan FTI / Mahasiswa</div>
            <div className="history-heading"><h1>Riwayat Pengajuan</h1><p>Cari dan pantau seluruh pengajuan milik Anda.</p></div>
            <section className="history-search-section" aria-label="Cari dan saring pengajuan">
              <h2>Cari &amp; Saring Pengajuan</h2>
              <label className="history-search-field"><span>Cari Pengajuan</span><span className="history-input-wrap"><input value={historySearch} onChange={(event) => { setHistorySearch(event.target.value); setHistoryPage(1) }} placeholder="Cari nomor pengajuan atau jenis surat" /><Search size={16} /></span></label>
              <div className="history-filters">
                <label><span>Jenis Surat</span><select value={historyService} onChange={(event) => { setHistoryService(event.target.value); setHistoryPage(1) }}><option value="">Semua jenis surat</option>{services.map((service) => <option key={service.title}>{service.title}</option>)}</select></label>
                <label><span>Status</span><select value={historyStatus} onChange={(event) => { setHistoryStatus(event.target.value); setHistoryPage(1) }}><option value="">Semua status</option>{[...new Set(submissions.map((submission) => submission.status))].map((status) => <option key={status}>{status}</option>)}</select></label>
                <label><span>Rentang Tanggal</span><span className="date-filter"><input aria-label="Tanggal mulai" type="date" value={historyFrom} onChange={(event) => { setHistoryFrom(event.target.value); setHistoryPage(1) }} /><span>sampai</span><input aria-label="Tanggal akhir" type="date" value={historyTo} onChange={(event) => { setHistoryTo(event.target.value); setHistoryPage(1) }} /><CalendarDays size={15} /></span></label>
                <label><span>Urutkan Tanggal</span><select value={historySort} onChange={(event) => { setHistorySort(event.target.value); setHistoryPage(1) }}><option value="newest">Terbaru terlebih dahulu</option><option value="oldest">Terlama terlebih dahulu</option></select></label>
              </div>
            </section>
            <section className="history-results">
              <div className="section-heading"><h2>Daftar Pengajuan</h2><p>{filteredSubmissions.length} pengajuan. Hanya data pengajuan milik Anda.</p></div>
              <div className="history-table-wrap"><table className="history-table"><thead><tr><th>Nomor Pengajuan</th><th>Jenis Surat</th><th>Tanggal Diajukan <button type="button" className="sort-indicator" onClick={() => setHistorySort((sort) => sort === 'newest' ? 'oldest' : 'newest')} aria-label="Urutkan tanggal"><ArrowRight size={12} /></button></th><th>Status</th><th>Aksi</th></tr></thead><tbody>
                {visibleSubmissions.map((submission) => <tr key={submission.id} className={selectedSubmission?.id === submission.id ? 'selected' : ''} onClick={() => setSelectedSubmissionId(submission.id)}><td><strong>{submission.id}</strong><small>{submission.applicant}</small></td><td>{submission.title}</td><td>{submission.date}</td><td><span className={`status-pill ${submission.tone}`}><span />{submission.status}</span></td><td><div className="history-row-actions"><button type="button" title="Lihat detail" aria-label={`Lihat detail ${submission.id}`} onClick={(event) => { event.stopPropagation(); setSelectedSubmissionId(submission.id) }}><Eye size={15} /></button><button type="button" title="Aksi lainnya" aria-label={`Aksi lainnya ${submission.id}`} onClick={(event) => { event.stopPropagation(); setSelectedSubmissionId(submission.id) }}><MoreHorizontal size={16} /></button></div></td></tr>)}
                {visibleSubmissions.length === 0 && <tr><td className="history-empty" colSpan="5">Tidak ada pengajuan yang sesuai dengan filter.</td></tr>}
              </tbody></table></div>
              <div className="history-pagination"><span>Menampilkan {filteredSubmissions.length ? (historyPage - 1) * historyPageSize + 1 : 0}–{Math.min(historyPage * historyPageSize, filteredSubmissions.length)} dari {filteredSubmissions.length} pengajuan</span><div><button type="button" aria-label="Halaman sebelumnya" disabled={historyPage === 1} onClick={() => setHistoryPage((page) => page - 1)}><ChevronLeft size={15} /></button><button type="button" className="current-page" aria-current="page">{historyPage}</button><button type="button" aria-label="Halaman selanjutnya" disabled={historyPage >= historyPageCount} onClick={() => setHistoryPage((page) => page + 1)}><ChevronRight size={15} /></button></div></div>
              {selectedSubmission && <article className="history-detail"><div><small>{selectedSubmission.id} · {selectedSubmission.status}</small><h3>{selectedSubmission.title}</h3><p>{selectedSubmission.detail}</p></div><button type="button" className="small-button" onClick={() => setNotice({ type: 'info', message: selectedSubmission.status === 'Selesai' ? 'Fitur unduh surat belum terhubung ke server.' : `Status pengajuan: ${selectedSubmission.status}.` })}>{selectedSubmission.status === 'Selesai' ? 'Unduh' : 'Lihat Detail'} {selectedSubmission.status === 'Selesai' ? <Download size={14} /> : <ChevronRight size={14} />}</button></article>}
            </section>
          </> : activeView === 'notifications' ? <>
            <div className="breadcrumb">Layanan Kemahasiswaan FTI / Mahasiswa</div>
            <div className="notifications-heading"><h1>Notifikasi</h1><p>Perkembangan layanan dan informasi pengajuan milik Anda.</p></div>
            <div className="notifications-toolbar"><button type="button" className="outline-button" disabled={!notifications.some((notification) => !readNotifications.includes(notification.id))} onClick={() => setReadNotifications(notifications.map((notification) => notification.id))}><Check size={15} /> Tandai semua dibaca</button></div>
            <section className="notifications-list" aria-label="Semua notifikasi">
              <h2>Semua Notifikasi</h2>
              {notifications.map((notification) => {
                const isRead = readNotifications.includes(notification.id)
                return <article className={`notification-item${isRead ? ' is-read' : ''}`} key={notification.id}>
                  <div className="notification-meta"><span className={`status-pill ${notification.tone}`}><span />{notification.status}</span>{!isRead && <span className="unread-dot" aria-label="Belum dibaca" />}</div>
                  <div className="notification-card">
                    <p className="notification-time">{notification.time} · {isRead ? 'Sudah dibaca' : 'Belum dibaca'}</p>
                    <h3>Pengajuan {notification.submissionId}</h3>
                    <p className="notification-message">Pengajuan {notification.submissionId} {notification.message}</p>
                    <div className="notification-card-footer"><button type="button" className="small-button" onClick={() => { setReadNotifications((current) => current.includes(notification.id) ? current : [...current, notification.id]); setSelectedSubmissionId(notification.submissionId); openHistory() }}>Lihat Detail <ChevronRight size={14} /></button></div>
                  </div>
                </article>
              })}
            </section>
          </> : activeView === 'profile' ? <>
            <div className="breadcrumb">Layanan Kemahasiswaan FTI / Mahasiswa</div>
            <div className="profile-heading"><h1>Profil</h1><p>Kelola kontak pribadi dan keamanan akun Anda.</p></div>
            {notice && <div className={`profile-feedback ${notice.type}`} role="status">{notice.message}</div>}
            <div className="profile-layout">
              <section className="profile-section">
                <h2>Data Diri</h2>
                <p className="profile-section-note">Data akademik hanya dapat dibaca. Hubungi Staf Akademik jika terdapat ketidaksesuaian.</p>
                <form className="profile-contact-form" onSubmit={saveProfile}>
                  <div className="profile-readonly-field"><label htmlFor="profile-name">Nama</label><div><input id="profile-name" value={user.nama || ''} readOnly /><LockKeyhole size={15} /></div><small>Data akademik · hanya baca</small></div>
                  <div className="profile-readonly-field"><label htmlFor="profile-identifier">NIM</label><div><input id="profile-identifier" value={user.identifier || ''} readOnly /><LockKeyhole size={15} /></div><small>Data akademik · hanya baca</small></div>
                  <div className="profile-readonly-field"><label htmlFor="profile-program">Program Studi</label><div><input id="profile-program" value={user.prodi || 'Belum diatur'} readOnly /><LockKeyhole size={15} /></div><small>Data akademik · hanya baca</small></div>
                  <div className="profile-readonly-field"><label htmlFor="profile-semester">Semester</label><div><input id="profile-semester" value="Ganjil 2026/2027" readOnly /><LockKeyhole size={15} /></div><small>Data akademik · hanya baca</small></div>
                  <label className="profile-contact-card" htmlFor="profile-email"><span>Email <b>*</b></span><input id="profile-email" type="email" autoComplete="email" required value={profileEmail} onChange={(event) => setProfileEmail(event.target.value)} /></label>
                  <label className="profile-contact-card" htmlFor="profile-phone"><span>Nomor Telepon/WhatsApp <b>*</b></span><input id="profile-phone" type="tel" autoComplete="tel" required value={profilePhone} onChange={(event) => setProfilePhone(event.target.value)} /></label>
                  <button type="submit" className="primary-button">Simpan Perubahan</button>
                </form>
              </section>
              <section className="profile-section profile-security">
                <h2>Keamanan</h2>
                <h3>Ubah Kata Sandi</h3>
                <p className="profile-section-note">Gunakan minimal 8 karakter dengan kombinasi huruf besar, huruf kecil, angka, dan simbol.</p>
                <form onSubmit={changePassword}>
                  {[
                    { key: 'current', label: 'Kata Sandi Lama', placeholder: 'Masukkan kata sandi lama', value: currentPassword, update: setCurrentPassword, autoComplete: 'current-password' },
                    { key: 'new', label: 'Kata Sandi Baru', placeholder: 'Masukkan kata sandi baru', value: newPassword, update: setNewPassword, autoComplete: 'new-password' },
                    { key: 'confirm', label: 'Konfirmasi Kata Sandi Baru', placeholder: 'Ulangi kata sandi baru', value: confirmPassword, update: setConfirmPassword, autoComplete: 'new-password' },
                  ].map((field) => <label className="profile-password-card" htmlFor={`password-${field.key}`} key={field.key}><span>{field.label} <b>*</b></span><span className="profile-password-input"><input id={`password-${field.key}`} type={visiblePasswords[field.key] ? 'text' : 'password'} autoComplete={field.autoComplete} placeholder={field.placeholder} value={field.value} onChange={(event) => field.update(event.target.value)} /><button type="button" aria-label={visiblePasswords[field.key] ? `Sembunyikan ${field.label.toLowerCase()}` : `Tampilkan ${field.label.toLowerCase()}`} onClick={() => setVisiblePasswords((current) => ({ ...current, [field.key]: !current[field.key] }))}>{visiblePasswords[field.key] ? <Eye size={16} /> : <EyeOff size={16} />}</button></span></label>)}
                  <div className="password-strength" aria-label={`Kekuatan kata sandi: ${passwordStrength} dari 5`}><div>{passwordCriteria.map((passed, index) => <span className={passed ? 'passed' : ''} key={index} />)}</div><p>Kekuatan kata sandi: {passwordStrength === 0 ? 'Belum diisi' : passwordStrength < 3 ? 'Lemah' : passwordStrength < 5 ? 'Cukup' : 'Kuat'}</p></div>
                  <button type="submit" className="outline-button profile-password-submit">Ubah Kata Sandi</button>
                </form>
              </section>
            </div>
          </> : <>
          <div className="breadcrumb">Layanan Kemahasiswaan FTI / Mahasiswa</div>
          <div className="welcome-row"><div><h1>Halo, {user.nama || 'Mahasiswa'}!</h1><p>Pantau pengajuan surat akademik Anda · Ganjil 2026/2027</p></div><button type="button" className="primary-button" onClick={() => openApplication()}><FilePlus2 size={16} /> Ajukan Layanan Baru</button></div>
          <section className="stats-grid" aria-label="Ringkasan pengajuan">
            <StatCard label="Sedang Diproses" value="3" icon={<Clock3 size={15} />} />
            <StatCard label="Perlu Perbaikan" value="1" icon={<Clock3 size={15} />} warning />
            <StatCard label="Selesai" value="1" icon={<Clock3 size={15} />} />
            <StatCard label="Total Pengajuan" value="5" icon={<Clock3 size={15} />} />
          </section>
          <section className="notice-panel"><span className="section-kicker">Perlu Perbaikan</span><div className="repair-alert"><span className="alert-mark">!</span><div><strong>Perlu Perbaikan</strong><p>Pengajuan Anda memerlukan perbaikan dokumen.</p></div></div><button type="button" className="outline-button">Perbaiki Sekarang</button></section>
          <section className="dashboard-section" id="pengajuan"><div className="section-heading"><h2>Pengajuan Terbaru</h2></div><div className="submission-list">{submissions.map((submission) => <article className="submission-item" key={submission.id}><span className={`status-pill ${submission.tone}`}><span />{submission.status}</span><small>{submission.id}</small><h3>{submission.title}</h3><p>{submission.date} · {user.nama || 'Mahasiswa'}</p><div className="item-footer"><button type="button" className="small-button">{submission.status === 'Selesai' ? 'Unduh Surat' : 'Lihat Detail'} <ChevronRight size={14} /></button></div></article>)}</div></section>
          <section className="dashboard-section" id="layanan"><div className="section-heading"><h2>Layanan Tersedia</h2></div><div className="service-list">{services.map((service) => <article className="service-item" key={service.title}><div className="service-icon"><FileText size={17} /></div><div className="service-copy"><h3>{service.title}</h3><p>{service.description}</p></div><span className="audience">Mahasiswa</span><button type="button" className="service-button" onClick={() => openApplication(service.title)}>Ajukan</button></article>)}</div></section>
          </>}
        </div>
        <footer className="dashboard-footer">Fakultas Teknologi Informasi, Universitas Andalas<br /><span>© 2026 · Seluruh hak cipta dilindungi.</span></footer>
      </main>
    )
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand-row">
          <div className="brand-mark"><GraduationCap size={19} /></div>
          <div>
            <strong>Layanan Kemahasiswaan FTI</strong>
            <span>Universitas Andalas - Padang</span>
          </div>
        </div>
        <div className="divider" />
        <header className="login-heading">
          <h1>Masuk ke Layanan<br />Kemahasiswaan FTI</h1>
          <p>Gunakan akun Anda untuk mengajukan dan memantau surat akademik.</p>
        </header>

        {notice && <div className="notice error"><ShieldAlert size={16} /><span>{notice.message}</span></div>}

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="identifier">NIM / NIP / Email</label>
          <input
            id="identifier"
            type="text"
            value={identifier}
            onChange={(event) => { setIdentifier(event.target.value); setErrors((current) => ({ ...current, identifier: '' })) }}
            placeholder="Masukkan NIM, NIP, atau email"
            aria-invalid={Boolean(errors.identifier)}
            autoComplete="username"
          />
          {errors.identifier && <small className="field-error">{errors.identifier}</small>}

          <div className="password-field">
            <label htmlFor="password">Kata Sandi</label>
            <div className="password-input">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => { setPassword(event.target.value); setErrors((current) => ({ ...current, password: '' })) }}
                placeholder="Masukkan kata sandi"
                aria-invalid={Boolean(errors.password)}
                autoComplete="current-password"
              />
              <button type="button" className="icon-button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <small className="field-error">{errors.password}</small>}
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
        <button type="button" className="forgot-button" onClick={() => setNotice({ type: 'info', message: 'Silakan hubungi Staf Akademik untuk mereset kata sandi.' })}>Lupa kata sandi?</button>
      </section>
      <p className="help-text">Logo fakultas masih mengganti - Hubungi Staf Akademik untuk bantuan.</p>
      <footer>Fakultas Teknologi Informasi, Universitas Andalas<br /><span>© 2026 - Seluruh hak cipta dilindungi.</span></footer>
    </main>
  )
}

function StatCard({ label, value, icon, warning = false }) {
  return <article className={`stat-card${warning ? ' warning' : ''}`}><span>{label}</span><div className="stat-icon">{icon}</div><strong>{value}</strong><h3>{label}</h3><p>{label === 'Total Pengajuan' ? 'Semua pengajuan Anda.' : `${label} pengajuan Anda.`}</p></article>
}

export default App
