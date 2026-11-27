import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'

// PDF yang ditampilkan langsung di halaman (bukan pop-up). PDF diambil lewat request yang membawa token,
// lalu ditampilkan dari blob lokal; tidak ada URL file yang bisa dibuka tanpa login.
// muat = fungsi stabil (useCallback) yang mengembalikan fetch PDF, misalnya () => pdfDrafRequest(id).
// Gaya: .pimpinan-pdf, .pimpinan-pdf-link, .pimpinan-pdf-pesan di pages/pimpinan/pimpinan.css.
export function PdfSematan({ muat, judul }) {
  const [state, setState] = useState({ status: 'memuat', url: '', pesan: '' })

  useEffect(() => {
    let aktif = true
    let url = ''
    muat()
      .then(async (response) => {
        if (!response.ok) throw new Error((await response.json().catch(() => null))?.message || 'PDF surat gagal dibuka.')
        url = URL.createObjectURL(await response.blob())
        if (aktif) setState({ status: 'siap', url, pesan: '' })
      })
      .catch((galat) => { if (aktif) setState({ status: 'galat', url: '', pesan: galat.message }) })
    return () => {
      aktif = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [muat])

  if (state.status === 'memuat') return <p className="pimpinan-pdf-pesan" role="status">Memuat pratinjau surat...</p>
  if (state.status === 'galat') return <p className="pimpinan-pdf-pesan galat" role="alert"><AlertCircle size={15} /> {state.pesan}</p>
  return (
    <>
      <iframe className="pimpinan-pdf" src={state.url} title={judul} />
      <a className="pimpinan-pdf-link" href={state.url} target="_blank" rel="noreferrer">Buka PDF di tab baru</a>
    </>
  )
}
