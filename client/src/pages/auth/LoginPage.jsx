import { useState } from 'react'
import { Eye, EyeOff, GraduationCap, ShieldAlert } from 'lucide-react'
import { loginRequest, loginUjiRequest } from '../../services/api.js'

// Tombol login pintasan hanya ada saat client dijalankan dengan "npm run dev" (tidak ikut di hasil build).
// Server juga harus menyalakan LOGIN_UJI=aktif di server/.env.
const LOGIN_PINTASAN = import.meta.env.DEV
const PERAN_UJI = [
  { role: 'mahasiswa', label: 'Mahasiswa' },
  { role: 'staf', label: 'Staf Akademik' },
  { role: 'kakor', label: 'Kepala Kantor' },
  { role: 'wadek1', label: 'Wakil Dekan 1' },
  { role: 'dekan', label: 'Dekan' },
]

// Halaman Login untuk semua peran. sessionMessage berisi alasan bila sesi sebelumnya berakhir.
export function LoginPage({ sessionMessage, onLogin }) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState(sessionMessage ? { type: 'error', message: sessionMessage } : null)
  const [isLoading, setIsLoading] = useState(false)

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

    await masuk(() => loginRequest(identifier.trim(), password))
  }

  // request = fungsi yang mengembalikan fetch login (biasa atau pintasan uji).
  const masuk = async (request) => {
    setNotice(null)
    setIsLoading(true)
    try {
      const response = await request()
      const result = await response.json().catch(() => null)
      if (LOGIN_PINTASAN && response.status === 404 && !result) {
        throw new Error('Login pintasan belum aktif. Isi LOGIN_UJI=aktif di server/.env, lalu jalankan ulang server.')
      }

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || 'Server tidak dapat dihubungi. Coba lagi beberapa saat lagi.')
      }

      const { token, ...profile } = result.data
      setErrors({})
      onLogin(token, profile)
    } catch (error) {
      const message = error instanceof TypeError ? 'Server tidak dapat dihubungi. Coba lagi beberapa saat lagi.' : error.message
      setNotice({ type: 'error', message })
      setIsLoading(false)
    }
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
          <p>Masuk dengan akun terdaftar. Anda akan diarahkan sesuai peran akun.</p>
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
        {LOGIN_PINTASAN && (
          <div className="login-uji" aria-label="Login pintasan untuk pengujian">
            <p>Login pintasan (khusus pengujian lokal)</p>
            <div>
              {PERAN_UJI.map((item) => (
                <button type="button" key={item.role} disabled={isLoading} onClick={() => masuk(() => loginUjiRequest(item.role))}>{item.label}</button>
              ))}
            </div>
          </div>
        )}
        <button type="button" className="forgot-button" onClick={() => setNotice({ type: 'info', message: 'Hubungi Staf Akademik untuk mereset kata sandi. Anda akan menerima kata sandi sementara yang wajib diganti saat masuk.' })}>Lupa kata sandi?</button>
      </section>
      <p className="help-text">Gunakan NIM/NIP atau email akun Anda. Dashboard akan ditentukan oleh peran yang terdaftar.</p>
      <footer>Fakultas Teknologi Informasi, Universitas Andalas<br /><span>© 2026 - Seluruh hak cipta dilindungi.</span></footer>
    </main>
  )
}
