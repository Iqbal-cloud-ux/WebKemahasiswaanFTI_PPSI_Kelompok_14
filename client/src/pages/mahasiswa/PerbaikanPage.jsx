import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AlertCircle, CheckCircle2, ChevronRight, Upload } from 'lucide-react'
import { ajukanUlangRequest, bacaHasil, detailPengajuanRequest } from '../../services/api.js'
import { ACCEPT_BERKAS, periksaBerkas, ukuranTampil } from '../../utils/berkas.js'
import { tandaiSalah } from '../../utils/validasiForm.js'

// Perbaiki dan ajukan ulang (#77): mahasiswa membaca catatan staf, mengganti berkas yang Tidak Sesuai
// (berkas lain boleh ikut diganti), lalu mengajukan ulang. Status kembali ke Diajukan.
export function PerbaikanPage({ onSelesai, onOpenHistory }) {
  const { id } = useParams()
  const [detail, setDetail] = useState({ status: 'memuat', data: null, pesan: '' })
  const [keperluan, setKeperluan] = useState('')
  const [files, setFiles] = useState({}) // id syarat -> File
  const [fileErrors, setFileErrors] = useState({})
  const [dragOver, setDragOver] = useState(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    let aktif = true
    detailPengajuanRequest(id)
      .then(bacaHasil)
      .then((data) => {
        if (!aktif) return
        setDetail({ status: 'siap', data, pesan: '' })
        setKeperluan(data.keperluan)
      })
      .catch((galat) => { if (aktif) setDetail({ status: 'galat', data: null, pesan: galat.message }) })
    return () => { aktif = false }
  }, [id])

  const heading = <><div className="breadcrumb">Layanan Kemahasiswaan FTI / Mahasiswa</div><div className="submission-heading"><div><h1>Perbaiki Pengajuan</h1><p>Ganti berkas yang ditandai tidak sesuai, lalu ajukan ulang.</p></div></div></>

  if (result) {
    return (
      <div className="submission-content">
        {heading}
        <section className="result-card success" role="status">
          <CheckCircle2 size={48} />
          <h2>Perbaikan berhasil dikirim</h2>
          <p>Pengajuan {result.no_referensi} kembali berstatus Diajukan dan akan diperiksa ulang oleh Staf Akademik.</p>
          <div className="flow-actions"><button type="button" className="primary-button" onClick={onOpenHistory}>Lihat Riwayat Pengajuan <ChevronRight size={15} /></button></div>
        </section>
      </div>
    )
  }

  if (detail.status !== 'siap') {
    return (
      <div className="submission-content">
        {heading}
        {detail.status === 'memuat'
          ? <p className="muted-copy" role="status">Memuat pengajuan...</p>
          : <div className="flow-error" role="alert"><AlertCircle size={15} />{detail.pesan}</div>}
      </div>
    )
  }

  const data = detail.data
  if (data.status !== 'perlu_perbaikan') {
    return (
      <div className="submission-content">
        {heading}
        <div className="flow-error" role="alert"><AlertCircle size={15} />Pengajuan {data.no_referensi} tidak sedang menunggu perbaikan, jadi tidak bisa diajukan ulang.</div>
        <div className="flow-actions"><button type="button" className="outline-button" onClick={onOpenHistory}>Kembali ke Riwayat</button></div>
      </div>
    )
  }

  const wajibDiganti = data.berkas.filter((b) => b.status_verifikasi === 'tidak_sesuai')
  const chooseFile = (berkas, file) => {
    if (!file) return
    const problem = periksaBerkas(file)
    setFileErrors((current) => ({ ...current, [berkas.syarat_layanan_id]: problem }))
    if (!problem) setFiles((current) => ({ ...current, [berkas.syarat_layanan_id]: file }))
  }

  const submit = async () => {
    const belum = wajibDiganti.filter((b) => !files[b.syarat_layanan_id])
    if (!keperluan.trim()) { setError(''); return tandaiSalah(document.getElementById('perbaikan-keperluan')) }
    if (belum.length > 0) {
      document.getElementById(`berkas-${belum[0].id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return setError(`Unggah berkas pengganti untuk: ${belum.map((b) => b.nama_syarat).join(', ')}.`)
    }
    const formData = new FormData()
    if (keperluan.trim() !== data.keperluan) formData.append('keperluan', keperluan.trim())
    Object.entries(files).forEach(([syaratId, file]) => formData.append(`berkas_${syaratId}`, file))

    setSending(true)
    setError('')
    try {
      const hasil = await bacaHasil(await ajukanUlangRequest(data.id, formData))
      setResult(hasil)
      onSelesai(hasil)
    } catch (galat) {
      setError(galat.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="submission-content">
      {heading}
      <section className="flow-card">
        <h2>{data.layanan.nama_layanan}</h2>
        <p className="muted-copy">{data.no_referensi}</p>
        {data.catatan_revisi && <div className="history-detail-catatan"><AlertCircle size={15} /><div><strong>Catatan Staf Akademik</strong><p>{data.catatan_revisi}</p></div></div>}
        <label htmlFor="perbaikan-keperluan">Keperluan Surat *</label>
        <textarea id="perbaikan-keperluan" maxLength={500} value={keperluan} onChange={(event) => setKeperluan(event.target.value)} />
      </section>

      <section className="flow-card">
        <h2>Berkas pendukung</h2>
        <p className="muted-copy">Berkas bertanda Tidak sesuai wajib diganti. Berkas lain boleh diganti bila perlu. Format PDF/JPG/PNG, maksimal 5 MB.</p>
        {data.berkas.map((berkas) => {
          const wajib = berkas.status_verifikasi === 'tidak_sesuai'
          const baru = files[berkas.syarat_layanan_id]
          const galat = fileErrors[berkas.syarat_layanan_id]
          return (
            <div
              key={berkas.id}
              id={`berkas-${berkas.id}`}
              className={`document-upload${baru ? ' uploaded' : ''}${dragOver === berkas.id ? ' dragging' : ''}${galat || (wajib && !baru) ? ' invalid' : ''}`}
              onDragOver={(event) => { event.preventDefault(); setDragOver(berkas.id) }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(event) => { event.preventDefault(); setDragOver(null); chooseFile(berkas, event.dataTransfer.files[0]) }}
            >
              <div>
                <strong>{berkas.nama_syarat} {wajib ? '* (tidak sesuai, wajib diganti)' : berkas.status_verifikasi === 'sesuai' ? '(sesuai)' : ''}</strong>
                {berkas.catatan_verifikasi && <small className="document-upload-error">Catatan: {berkas.catatan_verifikasi}</small>}
                {galat
                  ? <small className="document-upload-error">{galat}</small>
                  : <small>{baru ? `Pengganti: ${baru.name} · ${ukuranTampil(baru.size)}` : `Berkas saat ini: ${berkas.original_name}`}</small>}
              </div>
              <label className="upload-button"><Upload size={14} /> {baru ? 'Ganti lagi' : 'Unggah pengganti'}<input type="file" accept={ACCEPT_BERKAS} onChange={(event) => { chooseFile(berkas, event.target.files[0]); event.target.value = '' }} /></label>
            </div>
          )
        })}
      </section>

      {error && <div className="flow-error" role="alert"><AlertCircle size={15} />{error}</div>}
      <div className="flow-actions">
        <button type="button" className="outline-button" disabled={sending} onClick={onOpenHistory}>Batal</button>
        <button type="button" className="primary-button" disabled={sending} onClick={submit}>{sending ? 'Mengirim...' : 'Ajukan Ulang'} {!sending && <ChevronRight size={15} />}</button>
      </div>
    </div>
  )
}
