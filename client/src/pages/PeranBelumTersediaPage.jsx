import { GraduationCap } from 'lucide-react'

// Peran yang halamannya belum dibuat (Kepala Kantor, Wakil Dekan, Dekan) atau peran tidak dikenali.
// Ganti dengan portal masing-masing (misalnya pages/pimpinan/) setelah halamannya dibuat.
export function PeranBelumTersediaPage({ user, roleLabel, onLogout }) {
  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand-row">
          <div className="brand-mark"><GraduationCap size={19} /></div>
          <div><strong>Layanan Kemahasiswaan FTI</strong><span>Universitas Andalas - Padang</span></div>
        </div>
        <div className="divider" />
        <header className="login-heading">
          <h1>{roleLabel ? `Halaman ${roleLabel} belum tersedia` : 'Peran akun tidak dikenali'}</h1>
          <p>{roleLabel
            ? `Anda masuk sebagai ${user.nama || roleLabel}. Halaman untuk peran ini masih dalam pengembangan.`
            : 'Akun Anda belum memiliki peran yang valid. Hubungi Staf Akademik untuk memperbaiki data akun.'}</p>
        </header>
        <button type="button" className="login-button" onClick={onLogout}>Keluar</button>
      </section>
    </main>
  )
}
