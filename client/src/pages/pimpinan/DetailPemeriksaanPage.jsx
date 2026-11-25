import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AlertCircle, Check, ChevronLeft, Clock3, Eye, FileText, PenLine, Undo2, X } from 'lucide-react'
import { PratinjauBerkas } from '../../components/PratinjauBerkas.jsx'
import { bacaHasil, detailParafRequest, kembalikanParafRequest, pdfDrafRequest, setujuiParafRequest } from '../../services/api.js'
import { formatTanggal, formatWaktu, statusStaf } from '../../utils/statusPengajuan.js'
import { teksSemester } from '../../utils/semester.js'
import { tandaiSalah } from '../../utils/validasiForm.js'

// Urutan alur persetujuan berjenjang (docs/alur-status.md).
const URUTAN = ['pending_kakor', 'pending_wadek1', 'pending_dekan', 'disetujui']
const TAHAP = [
  { role: 'kakor', label: 'Kepala Kantor', status: 'pending_kakor' },
  { role: 'wadek1', label: 'Wakil Dekan 1', status: 'pending_wadek1' },
  { role: 'dekan', label: 'Dekan', status: 'pending_dekan' },
]
const TAHAP_PERAN = { 'Kepala Kantor': 'pending_kakor', 'Wakil Dekan 1': 'pending_wadek1' }
const KEPUTUSAN = { approved: 'Disetujui dan diparaf', returned: 'Dikembalikan', rejected: 'Ditolak' }

// PDF draf ditampilkan langsung di halaman (diambil dengan token, lalu dari blob lokal).
function PdfDraf({ pengajuanId }) {
  const [state, setState] = useState({ status: 'memuat', url: '', pesan: '' })
  useEffect(() => {
    let aktif = true
    let url = ''
    pdfDrafRequest(pengajuanId)
      .then(async (response) => {
        if (!response.ok) throw new Error((await response.json().catch(() => null))?.message || 'PDF draf gagal dibuka.')
        url = URL.createObjectURL(await response.blob())
        if (aktif) setState({ status: 'siap', url, pesan: '' })
      })
      .catch((galat) => { if (aktif) setState({ status: 'galat', url: '', pesan: galat.message }) })
    return () => { aktif = false; if (url) URL.revokeObjectURL(url) }
  }, [pengajuanId])
  if (state.status === 'memuat') return <p className="pimpinan-pdf-pesan" role="status">Memuat pratinjau surat...</p>
  if (state.status === 'galat') return <p className="pimpinan-pdf-pesan galat" role="alert"><AlertCircle size={15} /> {state.pesan}</p>
  return <><iframe className="pimpinan-pdf" src={state.url} title="Pratinjau draf surat" /><a className="pimpinan-pdf-link" href={state.url} target="_blank" rel="noreferrer">Buka PDF di tab baru</a></>
}

// Detail Pemeriksaan Surat (#89): pratinjau draf, ringkasan pengajuan, alur persetujuan,
// lalu Setujui dan Paraf (dengan pop-up konfirmasi) atau Kembalikan (wajib catatan).
export function DetailPemeriksaanPage({ peranLabel, onKembali }) {
  const { id } = useParams()
  const [detail, setDetail] = useState({ status: 'memuat', data: null, pesan: '' })
  const [catatan, setCatatan] = useState('')
  const [konfirmasi, setKonfirmasi] = useState(null) // 'setujui' | 'kembalikan'
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [pratinjau, setPratinjau] = useState(null)
  const tutupPratinjau = useCallback(() => setPratinjau(null), [])

  useEffect(() => {
    let aktif = true
    detailParafRequest(id)
      .then(bacaHasil)
      .then((data) => { if (aktif) setDetail({ status: 'siap', data, pesan: '' }) })
      .catch((galat) => { if (aktif) setDetail({ status: 'galat', data: null, pesan: galat.message }) })
    return () => { aktif = false }
  }, [id])

  const heading = (
    <div className="staff-review-heading">
      <div className="staff-breadcrumb">Layanan Kemahasiswaan FTI <span>/</span> Detail Pemeriksaan Surat</div>
      <h1>Detail Pemeriksaan Surat</h1>
      <div className="staff-review-meta">
        {detail.data && <><strong>{detail.data.pengajuan.no_referensi}</strong><span className={`staff-submission-status status-${statusStaf(detail.data.pengajuan.status).kelas}`}>{statusStaf(detail.data.pengajuan.status).label}</span></>}
        <button type="button" onClick={() => onKembali()}><ChevronLeft size={14} /> Kembali</button>
      </div>
    </div>
  )

  if (detail.status !== 'siap') {
    return <>{heading}{detail.status === 'memuat'
      ? <div className="staff-access-message" role="status"><span className="staff-spinner" /> Memuat draf...</div>
      : <div className="staff-notice error" role="alert"><AlertCircle size={16} /><span>{detail.pesan}</span></div>}</>
  }

  const { pengajuan, berkas, persetujuan } = detail.data
  const giliranSaya = pengajuan.status === TAHAP_PERAN[peranLabel]
  const posisi = URUTAN.indexOf(pengajuan.status)
  const parafTerakhir = (role) => [...persetujuan].reverse().find((p) => p.role_pimpinan === role && p.status === 'approved')

  const buka = (jenis) => {
    setError('')
    if (jenis === 'kembalikan' && !catatan.trim()) return tandaiSalah(document.getElementById('catatan-paraf'))
    setKonfirmasi(jenis)
  }

  const kirim = async () => {
    setSending(true)
    setError('')
    try {
      const request = konfirmasi === 'setujui' ? setujuiParafRequest : kembalikanParafRequest
      const hasil = await bacaHasil(await request(pengajuan.id, catatan.trim()))
      onKembali(konfirmasi === 'setujui'
        ? `Draf ${hasil.no_referensi} sudah Anda paraf dan diteruskan ke tahap berikutnya (${statusStaf(hasil.status).label}).`
        : `Draf ${hasil.no_referensi} dikembalikan ke Staf Akademik untuk direvisi.`)
    } catch (galat) {
      setError(galat.message)
      setKonfirmasi(null)
      setSending(false)
    }
  }

  return (
    <>
      {heading}
      {!giliranSaya && <div className="staff-notice info" role="status"><span>Draf ini tidak sedang menunggu paraf {peranLabel} ({statusStaf(pengajuan.status).label}). Halaman ini hanya untuk dibaca.</span></div>}
      {error && <div className="staff-notice error" role="alert"><AlertCircle size={16} /><span>{error}</span><button type="button" className="pimpinan-tutup" onClick={() => setError('')} aria-label="Tutup pesan"><X size={15} /></button></div>}

      <div className="staff-review-layout">
        <div className="staff-review-main">
          <section className="staff-panel pimpinan-pdf-panel">
            <h2>Pratinjau Surat</h2>
            <PdfDraf pengajuanId={pengajuan.id} />
          </section>
        </div>

        <aside className="staff-review-aside">
          <section className="staff-panel staff-review-applicant">
            <h2>Ringkasan Pengajuan</h2>
            <div className="staff-review-applicant-grid">
              <dl>
                <div><dt>Mahasiswa</dt><dd>{pengajuan.mahasiswa.nama}</dd></div>
                <div><dt>NIM</dt><dd>{pengajuan.mahasiswa.nim}</dd></div>
                <div><dt>Program Studi</dt><dd>{pengajuan.mahasiswa.prodi || '-'}</dd></div>
                <div><dt>Semester</dt><dd>{teksSemester(pengajuan.mahasiswa.angkatan)}</dd></div>
                <div><dt>Layanan</dt><dd>{pengajuan.layanan.nama_layanan}</dd></div>
                <div><dt>Keperluan</dt><dd>{pengajuan.keperluan}</dd></div>
                <div><dt>Tanggal Pengajuan</dt><dd>{formatTanggal(pengajuan.created_at)}</dd></div>
              </dl>
            </div>
            {berkas.length > 0 && (
              <ul className="pimpinan-berkas">
                {berkas.map((b) => <li key={b.id}><FileText size={13} /><span>{b.nama_syarat}</span><button type="button" onClick={() => setPratinjau(b)} aria-label={`Lihat ${b.nama_syarat}`}><Eye size={13} /></button></li>)}
              </ul>
            )}
          </section>

          <section className="staff-panel staff-review-timeline">
            <h2>Alur Persetujuan Berjenjang</h2>
            <ol>
              <li className="done"><span><Check size={11} /></span><div><strong>Staf Akademik</strong><p>Draf disusun dan diteruskan.</p></div></li>
              {TAHAP.map((tahap, index) => {
                const selesai = posisi > index
                const sekarang = posisi === index
                const paraf = selesai ? parafTerakhir(tahap.role) : null
                return (
                  <li className={selesai ? 'done' : sekarang ? 'current' : ''} key={tahap.role}>
                    <span>{selesai ? <Check size={11} /> : sekarang ? <Clock3 size={11} /> : null}</span>
                    <div>
                      <strong>{tahap.label}</strong>
                      <p>{selesai ? `Disetujui${paraf ? ` oleh ${paraf.pimpinan_nama}` : ''}.` : sekarang ? 'Sedang memeriksa.' : 'Belum sampai tahap ini.'}</p>
                      {paraf && <small>{formatWaktu(paraf.created_at)}</small>}
                    </div>
                  </li>
                )
              })}
            </ol>
            {persetujuan.length > 0 && (
              <details className="pimpinan-riwayat-paraf">
                <summary>Riwayat keputusan ({persetujuan.length})</summary>
                <ul>{persetujuan.map((p) => <li key={p.id}><strong>{p.pimpinan_nama}</strong> · {KEPUTUSAN[p.status]} · {formatWaktu(p.created_at)}{p.catatan && <p>{p.catatan}</p>}</li>)}</ul>
              </details>
            )}
          </section>
        </aside>
      </div>

      {giliranSaya && (
        <section className="staff-panel pimpinan-keputusan">
          <label htmlFor="catatan-paraf">Catatan (wajib bila mengembalikan; opsional saat memaraf)</label>
          <textarea id="catatan-paraf" maxLength={1000} value={catatan} onChange={(event) => setCatatan(event.target.value)} placeholder="Contoh: perbaiki penulisan keperluan pada paragraf kedua." />
          <div className="staff-review-actions">
            <p>Periksa isi surat sebelum mengambil keputusan.</p>
            <div>
              <button type="button" className="staff-review-correction" disabled={sending} onClick={() => buka('kembalikan')}><Undo2 size={13} /> Kembalikan</button>
              <button type="button" className="staff-review-verify" disabled={sending} onClick={() => buka('setujui')}><PenLine size={13} /> Setujui dan Paraf</button>
            </div>
          </div>
        </section>
      )}

      {konfirmasi && (
        <div className="staff-editor-overlay">
          <section className="staff-config-delete pimpinan-konfirmasi" role="alertdialog" aria-modal="true" aria-labelledby="konfirmasi-judul">
            <span className={`staff-config-delete-icon${konfirmasi === 'setujui' ? ' setujui' : ''}`}>{konfirmasi === 'setujui' ? <PenLine size={17} /> : <Undo2 size={17} />}</span>
            <h2 id="konfirmasi-judul">{konfirmasi === 'setujui' ? 'Setujui dan paraf draf ini?' : 'Kembalikan draf ke Staf Akademik?'}</h2>
            <p>{konfirmasi === 'setujui'
              ? <>Paraf Anda sebagai <strong>{peranLabel}</strong> akan tercatat dan draf {pengajuan.no_referensi} diteruskan ke {pengajuan.status === 'pending_kakor' ? 'Wakil Dekan 1' : 'Dekan'}.</>
              : <>Draf {pengajuan.no_referensi} akan dikembalikan dengan catatan: “{catatan.trim()}”.</>}</p>
            <div className="staff-editor-actions">
              <button type="button" className="staff-editor-cancel" disabled={sending} onClick={() => setKonfirmasi(null)}><X size={13} /> Batal</button>
              <button type="button" className={konfirmasi === 'setujui' ? 'staff-editor-save' : 'staff-config-delete-confirm'} disabled={sending} onClick={kirim}>{sending ? 'Memproses...' : konfirmasi === 'setujui' ? 'Ya, Paraf' : 'Ya, Kembalikan'}</button>
            </div>
          </section>
        </div>
      )}

      {pratinjau && <PratinjauBerkas berkas={pratinjau} onClose={tutupPratinjau} />}
    </>
  )
}
