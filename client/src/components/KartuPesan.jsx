import { GraduationCap } from 'lucide-react'

// Kartu pesan satu layar penuh (gaya halaman Login), untuk halaman di luar portal:
// 403, 404, dan galat yang membuat seluruh aplikasi gagal.
export function KartuPesanPenuh({ judul, pesan, tombol, onTombol, alert = false }) {
  return (
    <main className="login-page">
      <section className="login-card" role={alert ? 'alert' : undefined}>
        <div className="brand-row">
          <div className="brand-mark"><GraduationCap size={19} /></div>
          <div><strong>Layanan Kemahasiswaan FTI</strong><span>Universitas Andalas - Padang</span></div>
        </div>
        <div className="divider" />
        <header className="login-heading"><h1>{judul}</h1><p>{pesan}</p></header>
        <button type="button" className="login-button" onClick={onTombol}>{tombol}</button>
      </section>
    </main>
  )
}

// Kartu pesan di dalam kerangka portal (sidebar tetap tampil), misalnya 404 atau galat satu halaman.
export function KartuPesanPortal({ ikon: Ikon, pesan, tombol, onTombol }) {
  return (
    <div className="staff-access-card" role="alert">
      <div className="staff-notice error"><Ikon size={17} /><span>{pesan}</span></div>
      <button type="button" className="staff-login-button staff-access-link" onClick={onTombol}>{tombol}</button>
    </div>
  )
}
