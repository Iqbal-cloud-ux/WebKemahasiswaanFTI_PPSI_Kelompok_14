import { useState } from 'react'
import { Camera, CheckCircle2, Eye, EyeOff, LockKeyhole, X } from 'lucide-react'
import { bacaHasil, hapusFotoProfilRequest, ubahFotoProfilRequest, ubahKataSandiRequest, ubahKontakRequest } from '../../services/api.js'
import { teksSemester } from '../../utils/semester.js'
import { usePesanOtomatis } from '../../hooks/usePesanOtomatis.js'
import { tandaiSalah } from '../../utils/validasiForm.js'
import { perkecilFotoProfil } from '../../utils/fotoProfil.js'

// Profil mahasiswa: data akademik hanya baca, ubah kontak, ganti kata sandi.
export function ProfilMahasiswaPage({ user, onUpdateUser }) {
  const [notice, setNotice] = useState(null)
  const [saving, setSaving] = useState(false)
  const [profileEmail, setProfileEmail] = useState(user.email || '')
  const [profilePhone, setProfilePhone] = useState(user.no_hp || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [visiblePasswords, setVisiblePasswords] = useState({ current: false, new: false, confirm: false })
  usePesanOtomatis(notice, () => setNotice(null), notice?.type === 'success')

  const pilihFoto = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setSaving(true)
    try {
      const fotoDiperkecil = await perkecilFotoProfil(file)
      const profil = await bacaHasil(await ubahFotoProfilRequest(fotoDiperkecil))
      onUpdateUser({ ...user, foto_profil: profil.foto_profil })
      setNotice({ type: 'success', message: 'Foto profil berhasil diperbarui.' })
    } catch (galat) {
      setNotice({ type: 'error', message: galat.message })
    } finally {
      setSaving(false)
      event.target.value = ''
    }
  }

  const hapusFoto = async () => {
    setSaving(true)
    try {
      const profil = await bacaHasil(await hapusFotoProfilRequest())
      onUpdateUser({ ...user, foto_profil: profil.foto_profil })
      setNotice({ type: 'success', message: 'Foto profil berhasil dihapus.' })
    } catch (galat) {
      setNotice({ type: 'error', message: galat.message })
    } finally {
      setSaving(false)
    }
  }

  const passwordRequirements = [
    { label: 'Minimal 8 karakter', passed: newPassword.length >= 8 },
    { label: 'Memuat huruf besar (A-Z)', passed: /[A-Z]/.test(newPassword) },
    { label: 'Memuat huruf kecil (a-z)', passed: /[a-z]/.test(newPassword) },
    { label: 'Memuat angka (0-9)', passed: /[0-9]/.test(newPassword) },
    { label: 'Memuat simbol (contoh: !, @, #)', passed: /[^A-Za-z0-9]/.test(newPassword) },
  ]
  const passwordStrength = passwordRequirements.filter((item) => item.passed).length
  const passwordCriteria = passwordRequirements.map((item) => item.passed)

  const saveProfile = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const profil = await bacaHasil(await ubahKontakRequest({ email: profileEmail.trim(), no_hp: profilePhone.trim() }))
      onUpdateUser({ ...user, email: profil.email, no_hp: profil.no_hp })
      setNotice({ type: 'success', message: 'Informasi kontak berhasil disimpan.' })
    } catch (galat) {
      setNotice({ type: 'error', message: galat.message })
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async (event) => {
    event.preventDefault()
    // Kolom kosong sudah ditangani atribut required (ditandai merah tanpa pesan).
    if (passwordStrength < passwordCriteria.length) {
      tandaiSalah(document.getElementById('password-new'))
      setNotice({ type: 'error', message: 'Kata sandi baru harus memenuhi seluruh persyaratan keamanan.' })
      return
    }
    if (newPassword !== confirmPassword) {
      tandaiSalah(document.getElementById('password-confirm'))
      setNotice({ type: 'error', message: 'Konfirmasi kata sandi baru tidak cocok.' })
      return
    }
    setSaving(true)
    try {
      await bacaHasil(await ubahKataSandiRequest({ kata_sandi_lama: currentPassword, kata_sandi_baru: newPassword }))
      setNotice({ type: 'success', message: 'Kata sandi berhasil diubah. Gunakan kata sandi baru saat masuk berikutnya.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (galat) {
      setNotice({ type: 'error', message: galat.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
            <div className="breadcrumb">Layanan Kemahasiswaan FTI / Mahasiswa</div>
            <div className="profile-heading"><h1>Profil</h1><p>Kelola kontak pribadi dan keamanan akun Anda.</p></div>
            {notice && <div className={`profile-feedback ${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}><span>{notice.message}</span><button type="button" className="profile-feedback-tutup" onClick={() => setNotice(null)} aria-label="Tutup pesan"><X size={15} /></button></div>}
            <div className="profile-photo-card">
              {user.foto_profil
                ? <img src={user.foto_profil} alt={`Foto ${user.nama || 'Mahasiswa'}`} />
                : <span>{(user.nama || 'M').split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase()}</span>}
              <div>
                <strong>{user.nama || 'Mahasiswa'}</strong>
                <p>Foto profil JPG atau PNG, maksimal 2 MB.</p>
                <div className="profile-photo-actions">
                  <label><Camera size={14} /> Ganti Foto<input type="file" accept="image/jpeg,image/png" onChange={pilihFoto} disabled={saving} /></label>
                  {user.foto_profil && <button type="button" onClick={hapusFoto} disabled={saving}>Hapus Foto</button>}
                </div>
              </div>
            </div>
            <div className="profile-layout">
              <section className="profile-section">
                <h2>Data Diri</h2>
                <p className="profile-section-note">Data akademik hanya dapat dibaca. Hubungi Staf Akademik jika terdapat ketidaksesuaian.</p>
                <form className="profile-contact-form" onSubmit={saveProfile}>
                  <div className="profile-readonly-field"><label htmlFor="profile-name">Nama</label><div><input id="profile-name" value={user.nama || ''} readOnly /><LockKeyhole size={15} /></div><small>Data akademik · hanya baca</small></div>
                  <div className="profile-readonly-field"><label htmlFor="profile-identifier">NIM</label><div><input id="profile-identifier" value={user.identifier || ''} readOnly /><LockKeyhole size={15} /></div><small>Data akademik · hanya baca</small></div>
                  <div className="profile-readonly-field"><label htmlFor="profile-program">Program Studi</label><div><input id="profile-program" value={user.prodi || 'Belum diatur'} readOnly /><LockKeyhole size={15} /></div><small>Data akademik · hanya baca</small></div>
                  <div className="profile-readonly-field"><label htmlFor="profile-semester">Semester</label><div><input id="profile-semester" value={teksSemester(user.angkatan)} readOnly /><LockKeyhole size={15} /></div><small>Data akademik · hanya baca</small></div>
                  <label className="profile-contact-card" htmlFor="profile-email"><span>Email <b>*</b></span><input id="profile-email" type="email" autoComplete="email" required value={profileEmail} onChange={(event) => setProfileEmail(event.target.value)} /></label>
                  <label className="profile-contact-card" htmlFor="profile-phone"><span>Nomor Telepon/WhatsApp <b>*</b></span><input id="profile-phone" type="tel" autoComplete="tel" required value={profilePhone} onChange={(event) => setProfilePhone(event.target.value)} /></label>
                  <button type="submit" className="primary-button" disabled={saving}>Simpan Perubahan</button>
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
                  ].map((field) => <label className="profile-password-card" htmlFor={`password-${field.key}`} key={field.key}><span>{field.label} <b>*</b></span><span className="profile-password-input"><input id={`password-${field.key}`} type={visiblePasswords[field.key] ? 'text' : 'password'} autoComplete={field.autoComplete} required placeholder={field.placeholder} value={field.value} onChange={(event) => field.update(event.target.value)} /><button type="button" aria-label={visiblePasswords[field.key] ? `Sembunyikan ${field.label.toLowerCase()}` : `Tampilkan ${field.label.toLowerCase()}`} onClick={() => setVisiblePasswords((current) => ({ ...current, [field.key]: !current[field.key] }))}>{visiblePasswords[field.key] ? <Eye size={16} /> : <EyeOff size={16} />}</button></span></label>)}
                  <div className="password-strength" aria-label={`Kekuatan kata sandi: ${passwordStrength} dari 5`}><div>{passwordCriteria.map((passed, index) => <span className={passed ? 'passed' : ''} key={index} />)}</div><p>Kekuatan kata sandi: {passwordStrength === 0 ? 'Belum diisi' : passwordStrength < 3 ? 'Lemah' : passwordStrength < 5 ? 'Cukup' : 'Kuat'}</p></div>
                  <div className="password-requirements" aria-label="Syarat kata sandi baru">
                    <strong>Syarat kata sandi baru:</strong>
                    <ul>
                      {passwordRequirements.map((item) => (
                        <li className={item.passed ? 'passed' : ''} key={item.label}>
                          <CheckCircle2 size={13} aria-hidden="true" />
                          <span>{item.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button type="submit" className="outline-button profile-password-submit" disabled={saving}>Ubah Kata Sandi</button>
                </form>
              </section>
            </div>
    </>
  )
}
