import { useState } from 'react'
import { Bell, ChevronDown, ChevronRight, Clock3, Eye, EyeOff, FilePlus2, FileText, GraduationCap, LogOut, Menu, Upload, UserRound, X } from 'lucide-react'
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

  if (user) {
    const services = [
      { title: 'Surat Keterangan Aktif Kuliah', description: 'Keterangan status aktif untuk keperluan administrasi.' },
      { title: 'Beasiswa', description: 'Dokumen pendukung pengajuan bantuan pendidikan.' },
      { title: 'Penurunan UKT', description: 'Permohonan penyesuaian biaya kuliah Anda.' },
      { title: 'Pengembalian UKT', description: 'Permohonan pengembalian pembayaran UKT.' },
      { title: 'Pengunduran Diri', description: 'Pengajuan pengunduran diri dari perkuliahan.' },
    ]
    const submissions = [
      { id: 'PGJ-2026-00123', title: 'Surat Keterangan Aktif Kuliah', date: '22 Oktober 2026', status: 'Diproses', tone: 'purple' },
      { id: 'PGJ-2026-00119', title: 'Beasiswa', date: '21 Oktober 2026', status: 'Perlu Perbaikan', tone: 'orange' },
      { id: 'PGJ-2026-00110', title: 'Surat Keterangan Aktif Kuliah', date: '19 Oktober 2026', status: 'Selesai', tone: 'green' },
    ]

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
              <button type="button" className="account-button" id="profil"><span className="avatar">{(user.nama || 'A').charAt(0)}</span><span className="account-name">{user.nama || 'Ahmad Iqbal'}</span><ChevronDown size={14} /></button>
              <button type="button" className="header-logout" onClick={handleLogout}><LogOut size={15} /> Keluar</button>
            </div>
          </div>
        </header>
        <div className="dashboard-main" id="beranda">
          <div className="breadcrumb">Layanan Kemahasiswaan FTI / Mahasiswa</div>
          <div className="welcome-row"><div><h1>Halo, {user.nama || 'Ahmad Iqbal'}!</h1><p>Pantau pengajuan surat akademik Anda · Ganjil 2026/2027</p></div><button type="button" className="primary-button"><FilePlus2 size={16} /> Ajukan Layanan Baru</button></div>
          <section className="stats-grid" aria-label="Ringkasan pengajuan">
            <StatCard label="Sedang Diproses" value="3" icon={<Clock3 size={15} />} />
            <StatCard label="Perlu Perbaikan" value="1" icon={<Clock3 size={15} />} warning />
            <StatCard label="Selesai" value="1" icon={<Clock3 size={15} />} />
            <StatCard label="Total Pengajuan" value="5" icon={<Clock3 size={15} />} />
          </section>
          <section className="notice-panel"><span className="section-kicker">Perlu Perbaikan</span><div className="repair-alert"><span className="alert-mark">!</span><div><strong>Perlu Perbaikan</strong><p>Pengajuan Anda memerlukan perbaikan dokumen.</p></div></div><button type="button" className="outline-button">Perbaiki Sekarang</button></section>
          <section className="dashboard-section" id="pengajuan"><div className="section-heading"><h2>Pengajuan Terbaru</h2></div><div className="submission-list">{submissions.map((submission) => <article className="submission-item" key={submission.id}><span className={`status-pill ${submission.tone}`}><span />{submission.status}</span><small>{submission.id}</small><h3>{submission.title}</h3><p>{submission.date} · {user.nama || 'Ahmad Iqbal'}</p><div className="item-footer"><button type="button" className="small-button">{submission.status === 'Selesai' ? 'Unduh Surat' : 'Lihat Detail'} <ChevronRight size={14} /></button></div></article>)}</div></section>
          <section className="dashboard-section" id="layanan"><div className="section-heading"><h2>Layanan Tersedia</h2></div><div className="service-list">{services.map((service) => <article className="service-item" key={service.title}><div className="service-icon"><FileText size={17} /></div><div className="service-copy"><h3>{service.title}</h3><p>{service.description}</p></div><span className="audience">Mahasiswa</span><button type="button" className="service-button">Ajukan</button></article>)}</div></section>
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
