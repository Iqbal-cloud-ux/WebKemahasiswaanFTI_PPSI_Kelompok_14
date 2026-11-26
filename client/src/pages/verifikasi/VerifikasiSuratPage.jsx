import { useState } from 'react'
import { BadgeCheck, GraduationCap, ShieldAlert } from 'lucide-react'
import { bacaHasil, verifikasiSuratRequest } from '../../services/api.js'

const formatTanggal = (nilai) => {
  const tanggal = new Date(nilai)
  return Number.isNaN(tanggal.getTime())
    ? '-'
    : tanggal.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function VerifikasiSuratPage() {
  const [payload, setPayload] = useState('')
  const [hasil, setHasil] = useState(null)
  const [pesanGalat, setPesanGalat] = useState('')
  const [memeriksa, setMemeriksa] = useState(false)

  const periksa = async (event) => {
    event.preventDefault()
    setHasil(null)
    setPesanGalat('')

    let kode
    try {
      kode = JSON.parse(payload.trim())
    } catch {
      setPesanGalat('Data QR tidak terbaca. Tempelkan teks JSON yang dihasilkan pemindai QR.')
      return
    }
    if (!kode || typeof kode !== 'object' || Array.isArray(kode) || typeof kode.nomor !== 'string' || typeof kode.hash !== 'string') {
      setPesanGalat('Data QR harus memuat nomor dan hash surat.')
      return
    }

    setMemeriksa(true)
    try {
      setHasil(await bacaHasil(await verifikasiSuratRequest({ nomor: kode.nomor, hash: kode.hash })))
    } catch (error) {
      setPesanGalat(error.message)
    } finally {
      setMemeriksa(false)
    }
  }

  const bersihkan = () => {
    setPayload('')
    setHasil(null)
    setPesanGalat('')
  }

  return (
    <main className="login-page verifikasi-page">
      <section className="login-card verifikasi-card">
        <div className="brand-row">
          <div className="brand-mark"><GraduationCap size={19} /></div>
          <div><strong>Layanan Kemahasiswaan FTI</strong><span>Universitas Andalas - Padang</span></div>
        </div>
        <div className="divider" />
        <header className="login-heading verifikasi-heading">
          <h1>Verifikasi Keaslian Surat</h1>
          <p>Gunakan data yang terbaca saat memindai QR pada surat. Pemeriksaan ini tidak meminta login.</p>
        </header>

        <form className="verifikasi-form" onSubmit={periksa}>
          <label htmlFor="payload-qr">Data QR</label>
          <textarea
            id="payload-qr"
            value={payload}
            onChange={(event) => setPayload(event.target.value)}
            placeholder={'{"nomor":"B/1/2026","hash":"..."}'}
            required
            maxLength={1000}
            aria-describedby="petunjuk-qr"
          />
          <small id="petunjuk-qr">Tempelkan seluruh teks JSON dari hasil pemindaian QR.</small>
          {pesanGalat && <div className="notice error" role="alert"><ShieldAlert size={16} /><span>{pesanGalat}</span></div>}
          <button type="submit" className="login-button" disabled={memeriksa}>{memeriksa ? 'Memeriksa...' : 'Periksa Keaslian Surat'}</button>
        </form>

        {hasil && (
          <section className={`verifikasi-hasil ${hasil.valid ? 'valid' : 'invalid'}`} aria-live="polite">
            {hasil.valid ? <BadgeCheck size={24} /> : <ShieldAlert size={24} />}
            <h2>{hasil.valid ? 'Surat Terverifikasi' : 'Surat Tidak Terverifikasi'}</h2>
            <p>{hasil.valid ? 'Nomor dan hash cocok dengan catatan penerbitan surat.' : 'Data QR tidak cocok dengan catatan surat terbit.'}</p>
            {hasil.valid && (
              <dl>
                <div><dt>Nomor</dt><dd>{hasil.surat.nomor}</dd></div>
                <div><dt>Jenis Surat</dt><dd>{hasil.surat.jenis}</dd></div>
                <div><dt>Tanggal Terbit</dt><dd>{formatTanggal(hasil.surat.tanggal_terbit)}</dd></div>
                <div><dt>Status</dt><dd>{hasil.surat.status}</dd></div>
              </dl>
            )}
            <button type="button" className="verifikasi-ulangi" onClick={bersihkan}>Periksa Surat Lain</button>
          </section>
        )}
      </section>
      <p className="help-text">Halaman publik verifikasi dokumen resmi FTI.</p>
      <footer>Fakultas Teknologi Informasi, Universitas Andalas<br /><span>© 2026</span></footer>
    </main>
  )
}
