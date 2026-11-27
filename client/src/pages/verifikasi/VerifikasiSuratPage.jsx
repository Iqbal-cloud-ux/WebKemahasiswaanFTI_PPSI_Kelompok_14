import { useEffect, useRef, useState } from 'react'
import { BadgeCheck, GraduationCap, ShieldAlert } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { bacaHasil, verifikasiSuratRequest } from '../../services/api.js'

const formatTanggal = (nilai) => {
  const tanggal = new Date(nilai)
  return Number.isNaN(tanggal.getTime())
    ? '-'
    : tanggal.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Ambil { nomor, hash } dari parameter alamat (?nomor=...&hash=...); null bila tidak lengkap.
const kodeDariParameter = (parameter) => {
  const nomor = parameter.get('nomor')
  const hash = parameter.get('hash')
  return nomor && hash ? { nomor, hash } : null
}

// Isi QR bisa berupa tautan verifikasi (surat baru) atau teks JSON (surat lama).
const bacaIsiQr = (teks) => {
  const isi = teks.trim()
  try {
    const kode = JSON.parse(isi)
    if (kode && typeof kode === 'object' && !Array.isArray(kode) && typeof kode.nomor === 'string' && typeof kode.hash === 'string') {
      return { nomor: kode.nomor, hash: kode.hash }
    }
    return null
  } catch {
    try {
      return kodeDariParameter(new URL(isi).searchParams)
    } catch {
      return null
    }
  }
}

export function VerifikasiSuratPage() {
  const [parameter, setParameter] = useSearchParams()
  const [kodeAwal] = useState(() => kodeDariParameter(parameter))
  const sudahDiperiksa = useRef(false)
  const [payload, setPayload] = useState('')
  const [hasil, setHasil] = useState(null)
  const [pesanGalat, setPesanGalat] = useState('')
  const [memeriksa, setMemeriksa] = useState(Boolean(kodeAwal))

  // Dibuka dari QR: periksa langsung, cukup sekali (StrictMode menjalankan efek dua kali saat
  // pengembangan, dan setiap pemeriksaan dicatat server di public_verification).
  useEffect(() => {
    if (!kodeAwal || sudahDiperiksa.current) return
    sudahDiperiksa.current = true
    verifikasiSuratRequest(kodeAwal)
      .then(bacaHasil)
      .then(setHasil)
      .catch((error) => setPesanGalat(error.message))
      .finally(() => setMemeriksa(false))
  }, [kodeAwal])

  const periksa = async (event) => {
    event.preventDefault()
    setHasil(null)
    setPesanGalat('')

    const kode = bacaIsiQr(payload)
    if (!kode) {
      setPesanGalat('Data QR tidak terbaca. Tempelkan tautan atau teks hasil pemindaian QR yang memuat nomor dan hash surat.')
      return
    }

    setMemeriksa(true)
    try {
      setHasil(await bacaHasil(await verifikasiSuratRequest(kode)))
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
    if (parameter.size > 0) setParameter({}, { replace: true })
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
          <p>Pindai QR pada surat dengan kamera HP; halaman ini akan terbuka dan memeriksa surat secara otomatis. Pemeriksaan ini tidak meminta login.</p>
        </header>

        <form className="verifikasi-form" onSubmit={periksa}>
          <label htmlFor="payload-qr">Data QR</label>
          <textarea
            id="payload-qr"
            value={payload}
            onChange={(event) => setPayload(event.target.value)}
            placeholder="https://.../verifikasi?nomor=...&hash=..."
            required
            maxLength={1000}
            aria-describedby="petunjuk-qr"
          />
          <small id="petunjuk-qr">Atau tempelkan tautan hasil pemindaian QR. Teks JSON dari surat lama juga diterima.</small>
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
