import { useState } from 'react'
import { Check, Eye, EyeOff, GraduationCap, KeyRound, ShieldAlert, X } from 'lucide-react'
import { bacaHasil, simpanTokenBaru, ubahKataSandiRequest } from '../../services/api.js'

// Aturan sama dengan server (controllers/profilController.js, masalahKataSandi).
const SYARAT = [
  { label: '8 sampai 72 karakter', cek: (sandi) => sandi.length >= 8 && sandi.length <= 72 },
  { label: 'Huruf besar', cek: (sandi) => /[A-Z]/.test(sandi) },
  { label: 'Huruf kecil', cek: (sandi) => /[a-z]/.test(sandi) },
  { label: 'Angka', cek: (sandi) => /[0-9]/.test(sandi) },
  { label: 'Simbol', cek: (sandi) => /[^A-Za-z0-9]/.test(sandi) },
]

// Ditampilkan App.jsx menggantikan semua halaman selama akun wajib mengganti kata sandi sementara
// (setelah direset Staf Akademik, migrasi 008). Server juga menolak permintaan lain sampai sandi diganti.
export function GantiSandiAwalPage({ user, onSelesai, onLogout }) {
  const [lama, setLama] = useState('')
  const [baru, setBaru] = useState('')
  const [ulang, setUlang] = useState('')
  const [tampil, setTampil] = useState(false)
  const [pesan, setPesan] = useState('')
  const [menyimpan, setMenyimpan] = useState(false)

  const simpan = async (event) => {
    event.preventDefault()
    setPesan('')
    if (!SYARAT.every(({ cek }) => cek(baru))) {
      setPesan('Kata sandi baru belum memenuhi semua syarat di bawah.')
      return
    }
    if (baru !== ulang) {
      setPesan('Ulangi kata sandi baru tidak cocok.')
      return
    }
    setMenyimpan(true)
    try {
      simpanTokenBaru(await bacaHasil(await ubahKataSandiRequest({ kata_sandi_lama: lama, kata_sandi_baru: baru })))
      onSelesai()
    } catch (galat) {
      setPesan(galat.message)
      setMenyimpan(false)
    }
  }

  const kolom = (id, label, nilai, ubah, autoComplete) => (
    <div className="password-field">
      <label htmlFor={id}>{label}</label>
      <div className="password-input">
        <input id={id} type={tampil ? 'text' : 'password'} required value={nilai} onChange={(event) => ubah(event.target.value)} autoComplete={autoComplete} />
        {id === 'sandi-lama' && (
          <button type="button" className="icon-button" onClick={() => setTampil((sekarang) => !sekarang)} aria-label={tampil ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}>
            {tampil ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  )

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand-row">
          <div className="brand-mark"><GraduationCap size={19} /></div>
          <div><strong>Layanan Kemahasiswaan FTI</strong><span>Universitas Andalas - Padang</span></div>
        </div>
        <div className="divider" />
        <header className="login-heading">
          <h1><KeyRound size={22} /> Ganti Kata Sandi</h1>
          <p>Halo {user.nama}. Kata sandi Anda adalah kata sandi sementara dari Staf Akademik. Buat kata sandi baru sebelum melanjutkan.</p>
        </header>

        {pesan && <div className="notice error" role="alert"><ShieldAlert size={16} /><span>{pesan}</span></div>}

        <form onSubmit={simpan}>
          {kolom('sandi-lama', 'Kata sandi sementara', lama, setLama, 'current-password')}
          {kolom('sandi-baru', 'Kata sandi baru', baru, setBaru, 'new-password')}
          {kolom('sandi-ulang', 'Ulangi kata sandi baru', ulang, setUlang, 'new-password')}
          <ul className="sandi-syarat" aria-label="Syarat kata sandi baru">
            {SYARAT.map(({ label, cek }) => (
              <li key={label} className={cek(baru) ? 'terpenuhi' : ''}>{cek(baru) ? <Check size={13} /> : <X size={13} />} {label}</li>
            ))}
          </ul>
          <button type="submit" className="login-button" disabled={menyimpan}>{menyimpan ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}</button>
        </form>
        <button type="button" className="forgot-button" onClick={onLogout}>Keluar</button>
      </section>
      <footer>Fakultas Teknologi Informasi, Universitas Andalas</footer>
    </main>
  )
}
