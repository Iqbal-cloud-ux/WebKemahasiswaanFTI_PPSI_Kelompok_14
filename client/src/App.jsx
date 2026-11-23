import { useState } from 'react'
import { AlertCircle, Bell, CheckCircle2, ChevronDown, ChevronRight, Clock3, Eye, EyeOff, FilePlus2, FileText, GraduationCap, LogOut, Menu, ShieldAlert, Upload, X } from 'lucide-react'
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
  const [page, setPage] = useState('dashboard')
  const [submissionStep, setSubmissionStep] = useState(1)
  const [selectedService, setSelectedService] = useState('')
  const [submissionData, setSubmissionData] = useState({ purpose: '', phone: '', files: {}, confirmation: false })
  const [submissionResult, setSubmissionResult] = useState(null)
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'))
    } catch {
      return null
    }
  })

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

  const services = [
    { title: 'Surat Keterangan Aktif Kuliah', description: 'Keterangan status aktif untuk keperluan administrasi.', documents: ['KRS Semester Berjalan', 'Surat Permohonan'] },
    { title: 'Beasiswa', description: 'Dokumen pendukung pengajuan bantuan pendidikan.', documents: ['KRS Semester Berjalan', 'Surat Permohonan'] },
    { title: 'Penurunan UKT', description: 'Permohonan penyesuaian biaya kuliah Anda.', documents: ['KRS Semester Berjalan', 'Surat Permohonan'] },
    { title: 'Pengembalian UKT', description: 'Permohonan pengembalian pembayaran UKT.', documents: ['Bukti Pembayaran UKT', 'Surat Permohonan'] },
    { title: 'Pengunduran Diri', description: 'Pengajuan pengunduran diri dari perkuliahan.', documents: ['KRS Semester Berjalan', 'Surat Permohonan'] },
  ]

  const startSubmission = (service = '') => {
    setPage('submission')
    setSubmissionStep(1)
    setSelectedService(service)
    setSubmissionResult(null)
    setSubmissionData({ purpose: '', phone: '', files: {}, confirmation: false })
  }

  const selectedServiceData = services.find((service) => service.title === selectedService)
  const updateSubmission = (field, value) => setSubmissionData((current) => ({ ...current, [field]: value }))
  const uploadDocument = (documentName, file) => {
    if (file) updateSubmission('files', { ...submissionData.files, [documentName]: file.name })
  }

  const submitApplication = () => {
    if (!submissionData.confirmation) {
      setSubmissionResult({ type: 'error', title: 'Pengajuan gagal dikirim', message: 'Centang pernyataan bahwa data dan dokumen yang diunggah sudah benar.' })
      return
    }

    const missingDocuments = (selectedServiceData?.documents || []).filter((document) => !submissionData.files[document])
    if (missingDocuments.length > 0) {
      setSubmissionResult({ type: 'error', title: 'Pengajuan gagal dikirim', message: `Dokumen wajib belum lengkap: ${missingDocuments.join(', ')}.` })
      return
    }

    setSubmissionResult({ type: 'success', title: 'Pengajuan berhasil dikirim', message: 'Pengajuan Anda telah diterima dan akan diperiksa oleh Staf Akademik.', reference: `PGJ-2026-${String(Date.now()).slice(-5)}` })
  }

  if (user) {
    const submissions = [
      { id: 'PGJ-2026-00123', title: 'Surat Keterangan Aktif Kuliah', date: '22 Oktober 2026', status: 'Diproses', tone: 'purple' },
      { id: 'PGJ-2026-00119', title: 'Beasiswa', date: '21 Oktober 2026', status: 'Perlu Perbaikan', tone: 'orange' },
      { id: 'PGJ-2026-00110', title: 'Surat Keterangan Aktif Kuliah', date: '19 Oktober 2026', status: 'Selesai', tone: 'green' },
    ]

    if (page === 'submission') {
      return <SubmissionFlow
        user={user}
        services={services}
        selectedService={selectedService}
        selectedServiceData={selectedServiceData}
        submissionStep={submissionStep}
        submissionData={submissionData}
        submissionResult={submissionResult}
        setSubmissionStep={setSubmissionStep}
        setSelectedService={setSelectedService}
        updateSubmission={updateSubmission}
        uploadDocument={uploadDocument}
        submitApplication={submitApplication}
        onCancel={() => setPage('dashboard')}
      />
    }

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
              <a className="active" href="#beranda">Beranda</a>
              <a href="#layanan">Ajukan Layanan</a>
              <a href="#pengajuan">Riwayat</a>
              <a href="#profil">Profil</a>
            </nav>
            <div className="account-actions">
              <button type="button" className="header-icon" aria-label="Notifikasi"><Bell size={16} /></button>
              <button type="button" className="account-button" id="profil"><span className="avatar">{(user.nama || 'A').charAt(0)}</span><span className="account-name">{user.nama || 'Mahasiswa'}</span><ChevronDown size={14} /></button>
              <button type="button" className="header-logout" onClick={handleLogout}><LogOut size={15} /> Keluar</button>
            </div>
          </div>
        </header>
        <div className="dashboard-main" id="beranda">
          <div className="breadcrumb">Layanan Kemahasiswaan FTI / Mahasiswa</div>
          <div className="welcome-row"><div><h1>Halo, {user.nama || 'Mahasiswa'}!</h1><p>Pantau pengajuan surat akademik Anda · Ganjil 2026/2027</p></div>          <button type="button" className="primary-button" onClick={() => startSubmission()}><FilePlus2 size={16} /> Ajukan Layanan Baru</button></div>
          <section className="stats-grid" aria-label="Ringkasan pengajuan">
            <StatCard label="Sedang Diproses" value="3" icon={<Clock3 size={15} />} />
            <StatCard label="Perlu Perbaikan" value="1" icon={<Clock3 size={15} />} warning />
            <StatCard label="Selesai" value="1" icon={<Clock3 size={15} />} />
            <StatCard label="Total Pengajuan" value="5" icon={<Clock3 size={15} />} />
          </section>
          <section className="notice-panel"><span className="section-kicker">Perlu Perbaikan</span><div className="repair-alert"><span className="alert-mark">!</span><div><strong>Perlu Perbaikan</strong><p>Pengajuan Anda memerlukan perbaikan dokumen.</p></div></div><button type="button" className="outline-button">Perbaiki Sekarang</button></section>
          <section className="dashboard-section" id="pengajuan"><div className="section-heading"><h2>Pengajuan Terbaru</h2></div><div className="submission-list">{submissions.map((submission) => <article className="submission-item" key={submission.id}><span className={`status-pill ${submission.tone}`}><span />{submission.status}</span><small>{submission.id}</small><h3>{submission.title}</h3><p>{submission.date} · {user.nama || 'Mahasiswa'}</p><div className="item-footer"><button type="button" className="small-button">{submission.status === 'Selesai' ? 'Unduh Surat' : 'Lihat Detail'} <ChevronRight size={14} /></button></div></article>)}</div></section>
          <section className="dashboard-section" id="layanan"><div className="section-heading"><h2>Layanan Tersedia</h2></div><div className="service-list">{services.map((service) => <article className="service-item" key={service.title}><div className="service-icon"><FileText size={17} /></div><div className="service-copy"><h3>{service.title}</h3><p>{service.description}</p></div><span className="audience">Mahasiswa</span><button type="button" className="service-button" onClick={() => startSubmission(service.title)}>Ajukan</button></article>)}</div></section>
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

function SubmissionFlow({ user, services, selectedService, selectedServiceData, submissionStep, submissionData, submissionResult, setSubmissionStep, setSelectedService, updateSubmission, uploadDocument, submitApplication, onCancel }) {
  const canContinue = submissionStep === 1 ? Boolean(selectedService) : Boolean(submissionData.purpose.trim() && submissionData.phone.trim())
  const goToNextStep = () => {
    if (canContinue) setSubmissionStep((step) => Math.min(step + 1, 3))
  }

  return (
    <main className="submission-page">
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <div className="brand-row"><div className="brand-mark"><GraduationCap size={18} /></div><div><strong>Layanan Kemahasiswaan FTI</strong><span>Universitas Andalas</span></div></div>
          <div className="account-actions"><span className="avatar">{(user.nama || 'A').charAt(0)}</span><span className="account-name">{user.nama || 'Mahasiswa'}</span></div>
        </div>
      </header>
      <div className="submission-main">
        <div className="breadcrumb">Layanan Kemahasiswaan FTI / Mahasiswa</div>
        <div className="submission-heading"><div><h1>{submissionResult ? 'Status Pengajuan' : submissionStep === 1 ? 'Ajukan Layanan' : submissionStep === 2 ? 'Isi Formulir & Unggah Dokumen' : 'Tinjau & Kirim'}</h1><p>{submissionResult ? 'Berikut hasil pengiriman pengajuan Anda.' : 'Lengkapi data dan dokumen untuk mengajukan layanan.'}</p></div></div>
        {!submissionResult && <div className="stepper">{['Pilih Layanan', 'Isi Formulir & Unggah Dokumen', 'Tinjau & Kirim'].map((label, index) => <div className={`step${submissionStep > index + 1 ? ' done' : ''}${submissionStep === index + 1 ? ' current' : ''}`} key={label}><span>{submissionStep > index + 1 ? <CheckCircle2 size={13} /> : index + 1}</span>{label}</div>)}</div>}

        {submissionResult ? (
          <section className={`result-card ${submissionResult.type}`}>
            {submissionResult.type === 'success' ? <CheckCircle2 size={48} /> : <AlertCircle size={48} />}
            <h2>{submissionResult.title}</h2><p>{submissionResult.message}</p>
            {submissionResult.type === 'success' && <small>Nomor pengajuan: {submissionResult.reference}</small>}
            <button type="button" className="primary-button" onClick={onCancel}>Kembali ke Dashboard</button>
          </section>
        ) : (
          <>
            {submissionStep === 1 && <section className="flow-card"><div className="flow-card-heading"><h2>Pilih layanan yang ingin diajukan</h2><p>Pilih salah satu layanan untuk melanjutkan pengajuan.</p></div><div className="service-choice-list">{services.map((service) => <button type="button" className={`service-choice${selectedService === service.title ? ' selected' : ''}`} key={service.title} onClick={() => setSelectedService(service.title)}><span className="service-icon"><FileText size={17} /></span><span><strong>{service.title}</strong><small>{service.description}</small></span><span className="choice-radio" /></button>)}</div></section>}
            {submissionStep === 2 && <section className="form-flow-grid"><div className="flow-card"><h2>Data pengajuan</h2><label htmlFor="purpose">Keperluan Surat *</label><textarea id="purpose" value={submissionData.purpose} onChange={(event) => updateSubmission('purpose', event.target.value)} placeholder="Contoh: Administrasi beasiswa" /><label htmlFor="phone">Nomor Telepon/WhatsApp *</label><input id="phone" value={submissionData.phone} onChange={(event) => updateSubmission('phone', event.target.value)} placeholder="08xxxxxxxxxx" /></div><div className="flow-card"><h2>Dokumen wajib</h2><p className="muted-copy">Format PDF/JPG/PNG, maksimal 5 MB.</p>{selectedServiceData.documents.map((document) => <div className={`document-upload${submissionData.files[document] ? ' uploaded' : ''}`} key={document}><div><strong>{document} *</strong>{submissionData.files[document] ? <small>{submissionData.files[document]}</small> : <small>Belum diunggah</small>}</div><label className="upload-button"><Upload size={14} /> {submissionData.files[document] ? 'Ganti berkas' : 'Pilih berkas'}<input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => uploadDocument(document, event.target.files[0])} /></label></div>)}</div></section>}
            {submissionStep === 3 && <section className="flow-card review-card"><h2>Periksa kembali pengajuan Anda</h2><div className="review-row"><span>Layanan</span><strong>{selectedService}</strong></div><div className="review-row"><span>Nama</span><strong>{user.nama || 'Mahasiswa'}</strong></div><div className="review-row"><span>NIM</span><strong>{user.nim || '9900000001'}</strong></div><div className="review-row"><span>Keperluan</span><strong>{submissionData.purpose}</strong></div><h3>Dokumen terunggah</h3>{selectedServiceData.documents.map((document) => <div className="review-document" key={document}><CheckCircle2 size={15} />{document}<span>{submissionData.files[document] || 'Belum diunggah'}</span></div>)}<label className="confirmation"><input type="checkbox" checked={submissionData.confirmation} onChange={(event) => updateSubmission('confirmation', event.target.checked)} /> Saya menyatakan data dan dokumen yang diunggah sudah benar.</label>{submissionResult && <div className="flow-error"><AlertCircle size={15} />{submissionResult.message}</div>}</section>}
            {submissionResult && <div className="flow-error"><AlertCircle size={15} />{submissionResult.message}</div>}
            <div className="flow-actions"><button type="button" className="outline-button" onClick={submissionStep === 1 ? onCancel : () => setSubmissionStep((step) => step - 1)}>{submissionStep === 1 ? 'Batal' : 'Kembali'}</button>{submissionStep < 3 ? <button type="button" className="primary-button" disabled={!canContinue} onClick={goToNextStep}>Lanjut <ChevronRight size={15} /></button> : <button type="button" className="primary-button" onClick={submitApplication}>Kirim Pengajuan <ChevronRight size={15} /></button>}</div>
          </>
        )}
      </div>
      <footer className="dashboard-footer">Fakultas Teknologi Informasi, Universitas Andalas<br /><span>© 2026 · Seluruh hak cipta dilindungi.</span></footer>
    </main>
  )
}

export default App
