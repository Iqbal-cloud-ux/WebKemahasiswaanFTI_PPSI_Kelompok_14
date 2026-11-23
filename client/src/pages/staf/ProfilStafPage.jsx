import { useState } from 'react'
import { CheckCircle2, Eye, EyeOff, LockKeyhole, X } from 'lucide-react'

export function ProfilStafPage({ user, staffName, initials }) {
  const [email, setEmail] = useState(user?.email || 'staff.akademik@fti.unand.ac.id')
  const [phone, setPhone] = useState(user?.no_hp || '0812 0000 0000')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [visiblePasswords, setVisiblePasswords] = useState({ current: false, new: false, confirm: false })
  const [feedback, setFeedback] = useState(null)

  const saveContactProfile = (event) => {
    event.preventDefault()
    if (!email.trim() || !phone.trim()) {
      setFeedback({ type: 'error', message: 'Email dan nomor telepon wajib diisi.' })
      return
    }
    const updatedUser = { ...user, email: email.trim(), no_hp: phone.trim() }
    localStorage.setItem('user', JSON.stringify(updatedUser))
    setFeedback({ type: 'success', message: 'Informasi kontak berhasil disimpan.' })
  }

  const changePassword = (event) => {
    event.preventDefault()
    if (!currentPassword || !newPassword || !confirmPassword) {
      setFeedback({ type: 'error', message: 'Lengkapi semua kolom kata sandi terlebih dahulu.' })
      return
    }
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      setFeedback({ type: 'error', message: 'Kata sandi baru harus memenuhi seluruh persyaratan keamanan.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', message: 'Konfirmasi kata sandi baru tidak cocok.' })
      return
    }
    setFeedback({ type: 'success', message: 'Validasi berhasil. Fitur ubah kata sandi akan terhubung ke server.' })
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const passwordFields = [
    { key: 'current', label: 'Kata Sandi Saat Ini', placeholder: 'Masukkan kata sandi lama', value: currentPassword, setValue: setCurrentPassword, autoComplete: 'current-password' },
    { key: 'new', label: 'Kata Sandi Baru', placeholder: 'Masukkan kata sandi baru', value: newPassword, setValue: setNewPassword, autoComplete: 'new-password' },
    { key: 'confirm', label: 'Konfirmasi Kata Sandi Baru', placeholder: 'Masukkan kata sandi baru', value: confirmPassword, setValue: setConfirmPassword, autoComplete: 'new-password' },
  ]

  return (
    <>
      <div className="staff-profile-heading">
        <div className="staff-breadcrumb">Layanan Kemahasiswaan FTI <span>/</span> Profil</div>
      </div>
      <div className="staff-profile-title">
        <h1>Profil</h1>
        <p>Kelola identitas akun, informasi kontak, dan keamanan akun kerja Anda.</p>
      </div>
      {feedback && <div className={`staff-notice ${feedback.type === 'success' ? 'success' : 'error'} staff-profile-feedback`} role="status"><CheckCircle2 size={16} /><span>{feedback.message}</span><button type="button" onClick={() => setFeedback(null)} aria-label="Tutup pesan"><X size={15} /></button></div>}

      <section className="staff-profile-summary">
        <span className="staff-profile-avatar">{initials || 'SA'}</span>
        <div className="staff-profile-summary-main">
          <h2>{staffName}</h2>
          <p>Staf Akademik</p>
        </div>
        <div className="staff-profile-summary-meta">
          <span>Terakhir masuk: 23 Oktober 2026, 08.00 WIB</span>
          <small>Akun aktif · Akses staf akademik</small>
        </div>
      </section>

      <div className="staff-profile-layout">
        <section className="staff-panel staff-profile-card">
          <h2>Informasi Kontak</h2>
          <p>Informasi kontak digunakan untuk koordinasi layanan internal fakultas.</p>
          <form onSubmit={saveContactProfile}>
            <label className="staff-profile-readonly" htmlFor="staff-profile-name">
              <span>Nama</span>
              <span><input id="staff-profile-name" value={staffName} readOnly /><LockKeyhole size={15} /></span>
              <small>Identitas akun dikelola oleh administrator sistem.</small>
            </label>
            <label className="staff-profile-input" htmlFor="staff-profile-email">
              <span>Alamat Surel</span>
              <input id="staff-profile-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label className="staff-profile-input" htmlFor="staff-profile-phone">
              <span>Nomor Telepon</span>
              <input id="staff-profile-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </label>
            <label className="staff-profile-readonly" htmlFor="staff-profile-unit">
              <span>Unit Kerja</span>
              <span><input id="staff-profile-unit" value="Akademik - Fakultas Teknologi Informasi" readOnly /></span>
              <small>&nbsp;</small>
            </label>
            <button type="submit" className="staff-profile-save">Simpan Perubahan</button>
          </form>
        </section>

        <section className="staff-panel staff-profile-card staff-profile-password-card">
          <h2>Ubah Kata Sandi</h2>
          <p>Gunakan minimal 8 karakter dengan kombinasi huruf, angka, dan simbol.</p>
          <form onSubmit={changePassword}>
            {passwordFields.map((field) => (
              <label className="staff-profile-password-field" htmlFor={`staff-password-${field.key}`} key={field.key}>
                <span>{field.label} <b>*</b></span>
                <span>
                  <input id={`staff-password-${field.key}`} type={visiblePasswords[field.key] ? 'text' : 'password'} autoComplete={field.autoComplete} placeholder={field.placeholder} value={field.value} onChange={(event) => field.setValue(event.target.value)} />
                  <button type="button" aria-label={visiblePasswords[field.key] ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} onClick={() => setVisiblePasswords((current) => ({ ...current, [field.key]: !current[field.key] }))}>
                    {visiblePasswords[field.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </span>
              </label>
            ))}
            <button type="submit" className="staff-profile-password-save">Ubah Kata Sandi</button>
          </form>
        </section>
      </div>
    </>
  )
}
