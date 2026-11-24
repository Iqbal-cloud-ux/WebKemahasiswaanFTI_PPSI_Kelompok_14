import { useEffect, useState } from 'react'
import { AlertCircle, X } from 'lucide-react'
import { ambilBerkasRequest } from '../services/api.js'

// Pratinjau berkas di dalam halaman (#74, #82). Berkas diambil lewat request yang membawa token,
// lalu ditampilkan dari blob lokal; tidak ada URL file yang bisa dibuka tanpa login.
// Pemakaian:
// - berkas persyaratan: <PratinjauBerkas berkas={{ id, nama_syarat, original_name }} onClose={...} />
// - PDF lain (misalnya draf surat): <PratinjauBerkas judul="..." subjudul="..." muat={fungsiRequestStabil} onClose={...} />
//   muat harus stabil (useCallback) karena perubahan muat memicu pengambilan ulang.
export function PratinjauBerkas({ berkas, muat, judul, subjudul, onClose }) {
  const [state, setState] = useState({ status: 'memuat', url: '', tipe: '', pesan: '' })
  const berkasId = berkas?.id

  useEffect(() => {
    let aktif = true
    let url = ''
    const request = muat ? muat() : ambilBerkasRequest(berkasId)
    request
      .then(async (response) => {
        if (!response.ok) {
          const hasil = await response.json().catch(() => null)
          throw new Error(hasil?.message || 'Berkas gagal dibuka.')
        }
        const blob = await response.blob()
        url = URL.createObjectURL(blob)
        if (aktif) setState({ status: 'siap', url, tipe: blob.type, pesan: '' })
      })
      .catch((galat) => { if (aktif) setState({ status: 'galat', url: '', tipe: '', pesan: galat.message }) })
    return () => {
      aktif = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [berkasId, muat])

  useEffect(() => {
    const tutupDenganEsc = (event) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', tutupDenganEsc)
    return () => window.removeEventListener('keydown', tutupDenganEsc)
  }, [onClose])

  const judulTampil = judul || berkas?.nama_syarat || 'Pratinjau'
  return (
    <div className="pratinjau-overlay" role="dialog" aria-modal="true" aria-labelledby="pratinjau-judul" onClick={onClose}>
      <section className="pratinjau-kotak" onClick={(event) => event.stopPropagation()}>
        <header>
          <div><h2 id="pratinjau-judul">{judulTampil}</h2><small>{subjudul || berkas?.original_name}</small></div>
          <div className="pratinjau-aksi">
            {state.status === 'siap' && <a href={state.url} target="_blank" rel="noreferrer">Buka di tab baru</a>}
            <button type="button" onClick={onClose} aria-label="Tutup pratinjau"><X size={18} /></button>
          </div>
        </header>
        <div className="pratinjau-isi">
          {state.status === 'memuat' && <p role="status">Memuat berkas...</p>}
          {state.status === 'galat' && <p className="pratinjau-galat" role="alert"><AlertCircle size={16} /> {state.pesan}</p>}
          {state.status === 'siap' && (state.tipe.startsWith('image/')
            ? <img src={state.url} alt={judulTampil} />
            : <iframe src={state.url} title={judulTampil} />)}
        </div>
      </section>
    </div>
  )
}
