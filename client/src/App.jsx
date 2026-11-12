import { useState } from 'react'
import { Eye, EyeOff, GraduationCap, LogOut, ShieldAlert } from 'lucide-react'
import './App.css'

function App() {
  const roleRoutes = { mahasiswa: '/mahasiswa', staf: '/staf', admin: '/admin' }
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
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
    const roleName = user.role === 'staf' ? 'Staf Akademik' : user.role
    const roleDescription = user.role === 'staf'
      ? 'Kelola dan verifikasi layanan akademik mahasiswa dari dashboard staf.'
      : 'Akses layanan kemahasiswaan sesuai hak akses akun Anda.'

    return (
      <main className="dashboard-page">
        <section className="dashboard-shell">
          <div className="brand-row">
            <div className="brand-mark"><GraduationCap size={19} /></div>
            <div>
              <strong>Layanan Kemahasiswaan FTI</strong>
              <span>Universitas Andalas - Padang</span>
            </div>
          </div>
          <div className="dashboard-content">
            <span className="eyebrow">Dashboard {roleName}</span>
            <h1>Selamat datang, {user.nama || user.identifier}</h1>
            <p>{roleDescription}</p>
            <button type="button" className="logout-button" onClick={handleLogout}>
              <LogOut size={16} /> Keluar
            </button>
          </div>
        </section>
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

export default App
