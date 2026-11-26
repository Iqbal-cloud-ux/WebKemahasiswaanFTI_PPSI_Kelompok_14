import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, Check, Download, Eye, Wrench } from 'lucide-react'
import { PratinjauBerkas } from '../../components/PratinjauBerkas.jsx'
import { bacaHasil, detailPengajuanRequest, pdfSuratTerbitRequest } from '../../services/api.js'
import { formatWaktu, statusMahasiswa } from '../../utils/statusPengajuan.js'
import { usePesanOtomatis } from '../../hooks/usePesanOtomatis.js'

const STATUS_BERKAS = {
  belum_diperiksa: { label: 'Belum diperiksa', tone: 'blue' },
  sesuai: { label: 'Sesuai', tone: 'green' },
  tidak_sesuai: { label: 'Tidak sesuai', tone: 'red' },
}

// Detail satu pengajuan di halaman Riwayat (#85): linimasa status, berkas beserta hasil pemeriksaan,
// catatan staf, dan tombol Perbaiki (status Perlu Perbaikan) atau Unduh (status Selesai).
// submission = baris Riwayat (pengajuanId, id = nomor referensi, title, status, tone).
export function DetailPengajuan({ submission, onPerbaiki }) {
  const [detail, setDetail] = useState({ status: 'memuat', data: null, pesan: '' })
  const [pratinjau, setPratinjau] = useState(null)
  const [notice, setNotice] = useState('')
  const [galatUnduh, setGalatUnduh] = useState('')
  const [mengunduh, setMengunduh] = useState(false)
  usePesanOtomatis(notice, () => setNotice(''))
  const tutupPratinjau = useCallback(() => setPratinjau(null), [])

  useEffect(() => {
    let aktif = true
    detailPengajuanRequest(submission.pengajuanId)
      .then(bacaHasil)
      .then((data) => { if (aktif) setDetail({ status: 'siap', data, pesan: '' }) })
      .catch((galat) => { if (aktif) setDetail({ status: 'galat', data: null, pesan: galat.message }) })
    return () => { aktif = false }
  }, [submission.pengajuanId, submission.statusKode])

  const unduhSurat = async () => {
    setMengunduh(true)
    setGalatUnduh('')
    setNotice('')
    try {
      const response = await pdfSuratTerbitRequest(submission.pengajuanId)
      if (!response.ok) {
        const hasil = await response.json().catch(() => null)
        throw new Error(hasil?.message || 'Surat gagal diunduh. Coba lagi beberapa saat lagi.')
      }

      const url = URL.createObjectURL(await response.blob())
      const link = document.createElement('a')
      link.href = url
      link.download = `Surat-${submission.id}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setNotice('Surat resmi berhasil diunduh. Kode QR verifikasi tercantum di dalam PDF.')
    } catch (galat) {
      setGalatUnduh(galat.message)
    } finally {
      setMengunduh(false)
    }
  }

  const data = detail.data
  return (
    <article className="history-detail history-detail-lengkap" aria-live="polite">
      <header>
        <div><small>{submission.id} · {submission.status}</small><h3>{submission.title}</h3><p>Diajukan {submission.date} · Keperluan: {submission.keperluan}</p></div>
        <div className="history-detail-actions">
          {submission.statusKode === 'perlu_perbaikan' && <button type="button" className="small-button" onClick={() => onPerbaiki(submission.pengajuanId)}><Wrench size={14} /> Perbaiki Berkas</button>}
          {submission.statusKode === 'disetujui' && <button type="button" className="small-button" disabled={mengunduh} onClick={unduhSurat}><Download size={14} /> {mengunduh ? 'Mengunduh...' : 'Unduh Surat'}</button>}
        </div>
      </header>
      {notice && <p className="history-detail-notice" role="status">{notice}</p>}
      {galatUnduh && <div className="flow-error" role="alert"><AlertCircle size={15} />{galatUnduh}</div>}
      {submission.catatan && <div className="history-detail-catatan"><AlertCircle size={15} /><div><strong>{submission.statusKode === 'ditolak' ? 'Alasan penolakan' : 'Catatan Staf Akademik'}</strong><p>{submission.catatan}</p></div></div>}

      {detail.status === 'memuat' && <p className="muted-copy" role="status">Memuat detail...</p>}
      {detail.status === 'galat' && <div className="flow-error" role="alert"><AlertCircle size={15} />{detail.pesan}</div>}
      {data && (
        <div className="history-detail-grid">
          <section>
            <h4>Linimasa Status</h4>
            <ol className="status-timeline">
              {data.riwayat.map((item) => (
                <li key={item.id}>
                  <span className="status-timeline-dot"><Check size={10} /></span>
                  <div>
                    <strong>{statusMahasiswa(item.status_baru).label}</strong>
                    {item.catatan && <p>{item.catatan}</p>}
                    <small>{formatWaktu(item.created_at)}</small>
                  </div>
                </li>
              ))}
            </ol>
          </section>
          <section>
            <h4>Berkas Pendukung</h4>
            {data.berkas.length === 0 && <p className="muted-copy">Tidak ada berkas pendukung.</p>}
            <ul className="history-berkas">
              {data.berkas.map((berkas) => {
                const status = STATUS_BERKAS[berkas.status_verifikasi] || STATUS_BERKAS.belum_diperiksa
                return (
                  <li key={berkas.id}>
                    <div><strong>{berkas.nama_syarat}</strong><small>{berkas.original_name}</small>{berkas.catatan_verifikasi && <small className="history-berkas-catatan">Catatan: {berkas.catatan_verifikasi}</small>}</div>
                    <span className={`status-pill ${status.tone}`}><span />{status.label}</span>
                    <button type="button" className="history-berkas-lihat" onClick={() => setPratinjau(berkas)} aria-label={`Lihat ${berkas.nama_syarat}`}><Eye size={14} /></button>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      )}
      {pratinjau && <PratinjauBerkas berkas={pratinjau} onClose={tutupPratinjau} />}
    </article>
  )
}
