import { useState } from 'react'
import { Eye, EyeOff, LockKeyhole } from 'lucide-react'

// Profil mahasiswa: data akademik hanya baca, ubah kontak, ganti kata sandi (belum tersambung ke server).
export function ProfilMahasiswaPage({ user, onUpdateUser }) {
  const [notice, setNotice] = useState(null)
  const [profileEmail, setProfileEmail] = useState(user.email || '')
  const [profilePhone, setProfilePhone] = useState(user.no_hp || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [visiblePasswords, setVisiblePasswords] = useState({ current: false, new: false, confirm: false })

  const passwordCriteria = [newPassword.length >= 8, /[A-Z]/.test(newPassword), /[a-z]/.test(newPassword), /[0-9]/.test(newPassword), /[^A-Za-z0-9]/.test(newPassword)]
  const passwordStrength = passwordCriteria.filter(Boolean).length

  const saveProfile = (event) => {
    event.preventDefault()
    onUpdateUser({ ...user, email: profileEmail.trim(), no_hp: profilePhone.trim() })
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

  return (
    <>
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
    </>
  )
}
