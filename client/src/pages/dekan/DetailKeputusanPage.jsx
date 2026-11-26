import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AlertCircle, Check, ChevronLeft, Clock3, Eye, FileText, PenLine, Undo2, X } from 'lucide-react'
import { PratinjauBerkas } from '../../components/PratinjauBerkas.jsx'
import { bacaHasil, detailDekanRequest, kembalikanKeputusanDekanRequest, pdfDrafRequest, pratinjauSuratTerbitRequest, setujuiKeputusanDekanRequest, tolakKeputusanDekanRequest } from '../../services/api.js'
import { formatTanggal, formatWaktu, statusStaf } from '../../utils/statusPengajuan.js'
import { teksSemester } from '../../utils/semester.js'
import { tandaiSalah } from '../../utils/validasiForm.js'

const URUTAN = ['pending_kakor', 'pending_wadek1', 'pending_dekan', 'disetujui']
const TAHAP = [
  { role: 'kakor', label: 'Kepala Kantor' },
  { role: 'wadek1', label: 'Wakil Dekan 1' },
  { role: 'dekan', label: 'Dekan' },
]
const KEPUTUSAN = { approved: 'Disetujui dan diparaf', returned: 'Dikembalikan', rejected: 'Ditolak' }
const LABEL_TINDAKAN = { setujui: 'Setujui dan terbitkan', kembalikan: 'Kembalikan untuk revisi', tolak: 'Tolak pengajuan' }

export function DetailKeputusanPage({ onKembali }) {
  const { id } = useParams()
  const [detail, setDetail] = useState({ status: 'memuat', data: null, pesan: '' })
  const [catatan, setCatatan] = useState('')
  const [konfirmasi, setKonfirmasi] = useState(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [pratinjau, setPratinjau] = useState(null)
  const tutupPratinjau = useCallback(() => setPratinjau(null), [])

  useEffect(() => {
    let aktif = true
    detailDekanRequest(id)
      .then(bacaHasil)
      .then((data) => { if (aktif) setDetail({ status: 'siap', data, pesan: '' }) })
      .catch((galat) => { if (aktif) setDetail({ status: 'galat', data: null, pesan: galat.message }) })
    return () => { aktif = false }
  }, [id])

  const suratTerbit = detail.data?.pengajuan.status === 'disetujui'
  const muatPdf = useCallback(() => suratTerbit ? pratinjauSuratTerbitRequest(id) : pdfDrafRequest(id), [id, suratTerbit])
  const heading = (
    <div className="staff-review-heading">
      <div className="staff-breadcrumb">Layanan Kemahasiswaan FTI <span>/</span> Tinjau Surat</div>
      <h1>Tinjau Surat</h1>
      <div className="staff-review-meta">
        {detail.data && <><strong>{detail.data.pengajuan.no_referensi}</strong><span className={`staff-submission-status status-${statusStaf(detail.data.pengajuan.status).kelas}`}>{statusStaf(detail.data.pengajuan.status).label}</span></>}
        <button type="button" onClick={() => onKembali()}><ChevronLeft size={14} /> Kembali</button>
      </div>
    </div>
  )

  if (detail.status !== 'siap') {
    return <>{heading}{detail.status === 'memuat'
      ? <div className="staff-access-message" role="status"><span className="staff-spinner" /> Memuat surat...</div>
      : <div className="staff-notice error" role="alert"><AlertCircle size={16} /><span>{detail.pesan}</span></div>}</>
  }

  const { pengajuan, berkas, persetujuan } = detail.data
  const giliranSaya = pengajuan.status === 'pending_dekan'
  const posisi = URUTAN.indexOf(pengajuan.status)
  const parafTerakhir = (role) => [...persetujuan].reverse().find((item) => item.role_pimpinan === role && item.status === 'approved')

  const buka = (jenis) => {
    setError('')
    if (jenis !== 'setujui' && !catatan.trim()) return tandaiSalah(document.getElementById('catatan-dekan'))
    setKonfirmasi(jenis)
  }

  const kirim = async () => {
    setSending(true)
    setError('')
    try {
      const request = {
        setujui: setujuiKeputusanDekanRequest,
        kembalikan: kembalikanKeputusanDekanRequest,
        tolak: tolakKeputusanDekanRequest,
      }[konfirmasi]
      const hasil = await bacaHasil(await request(pengajuan.id, catatan.trim()))
      const pesan = konfirmasi === 'setujui'
        ? `Surat ${hasil.no_referensi} disetujui dan diterbitkan dengan kode verifikasi.`
        : konfirmasi === 'kembalikan'
          ? `Draf ${hasil.no_referensi} dikembalikan ke Staf Akademik untuk direvisi.`
          : `Pengajuan ${hasil.no_referensi} ditolak.`
      onKembali(pesan)
    } catch (galat) {
      setError(galat.message)
      setKonfirmasi(null)
      setSending(false)
    }
  }

  return (
    <>
      {heading}
      {!giliranSaya && <div className="staff-notice info" role="status"><span>Surat ini tidak sedang menunggu keputusan Dekan ({statusStaf(pengajuan.status).label}). Halaman ini hanya untuk dibaca.</span></div>}
      {error && <div className="staff-notice error" role="alert"><AlertCircle size={16} /><span>{error}</span><button type="button" className="pimpinan-tutup" onClick={() => setError('')} aria-label="Tutup pesan"><X size={15} /></button></div>}

      <div className="staff-review-layout">
        <div className="staff-review-main">
          <section className="staff-panel pimpinan-pdf-panel">
            <h2>Pratinjau Surat</h2>
            <p>{suratTerbit ? 'Surat final telah diterbitkan dengan kode QR verifikasi.' : 'Periksa isi draf sebelum memberi keputusan akhir.'}</p>
            <button type="button" className="staff-review-button" onClick={() => setPratinjau({ jenis: suratTerbit ? 'terbit' : 'draf' })}><Eye size={13} /> {suratTerbit ? 'Lihat PDF terbit (QR)' : 'Lihat PDF draf'}</button>
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
                {berkas.map((item) => <li key={item.id}><FileText size={13} /><span>{item.nama_syarat}</span><button type="button" onClick={() => setPratinjau(item)} aria-label={`Lihat ${item.nama_syarat}`}><Eye size={13} /></button></li>)}
              </ul>
            )}
          </section>

          <section className="staff-panel staff-review-timeline">
            <h2>Alur Persetujuan</h2>
            <ol>
              <li className="done"><span><Check size={11} /></span><div><strong>Staf Akademik</strong><p>Draf disusun dan diteruskan.</p></div></li>
              {TAHAP.map((tahap, index) => {
                const selesai = posisi > index
                const sekarang = posisi === index
                const keputusan = selesai ? parafTerakhir(tahap.role) : null
                return (
                  <li className={selesai ? 'done' : sekarang ? 'current' : ''} key={tahap.role}>
                    <span>{selesai ? <Check size={11} /> : sekarang ? <Clock3 size={11} /> : null}</span>
                    <div><strong>{tahap.label}</strong><p>{selesai ? `Disetujui${keputusan ? ` oleh ${keputusan.pimpinan_nama}` : ''}.` : sekarang ? 'Menunggu keputusan.' : 'Belum sampai tahap ini.'}</p>{keputusan && <small>{formatWaktu(keputusan.created_at)}</small>}</div>
                  </li>
                )
              })}
            </ol>
            {persetujuan.length > 0 && (
              <details className="pimpinan-riwayat-paraf">
                <summary>Riwayat keputusan ({persetujuan.length})</summary>
                <ul>{persetujuan.map((item) => <li key={item.id}><strong>{item.pimpinan_nama}</strong> · {KEPUTUSAN[item.status] || item.status} · {formatWaktu(item.created_at)}{item.catatan && <p>{item.catatan}</p>}</li>)}</ul>
              </details>
            )}
          </section>
        </aside>
      </div>

      {giliranSaya && (
        <section className="staff-panel pimpinan-keputusan">
          <label htmlFor="catatan-dekan">Catatan (wajib untuk mengembalikan atau menolak; opsional saat menyetujui)</label>
          <textarea id="catatan-dekan" maxLength={1000} value={catatan} onChange={(event) => setCatatan(event.target.value)} placeholder="Tuliskan catatan untuk Staf Akademik atau alasan penolakan." />
          <div className="staff-review-actions">
            <p>Pastikan semua isi surat sudah benar sebelum memberi keputusan.</p>
            <div>
              <button type="button" className="staff-review-correction" disabled={sending} onClick={() => buka('kembalikan')}><Undo2 size={13} /> Kembalikan</button>
              <button type="button" className="staff-review-reject" disabled={sending} onClick={() => buka('tolak')}><X size={13} /> Tolak</button>
              <button type="button" className="staff-review-verify" disabled={sending} onClick={() => buka('setujui')}><PenLine size={13} /> Setujui</button>
            </div>
          </div>
        </section>
      )}

      {konfirmasi && (
        <div className="staff-editor-overlay">
          <section className="staff-config-delete pimpinan-konfirmasi" role="alertdialog" aria-modal="true" aria-labelledby="konfirmasi-dekan-judul">
            <span className={`staff-config-delete-icon${konfirmasi === 'setujui' ? ' setujui' : ''}`}>{konfirmasi === 'setujui' ? <PenLine size={17} /> : konfirmasi === 'kembalikan' ? <Undo2 size={17} /> : <X size={17} />}</span>
            <h2 id="konfirmasi-dekan-judul">{konfirmasi === 'setujui' ? 'Setujui dan terbitkan surat ini?' : konfirmasi === 'kembalikan' ? 'Kembalikan draf untuk revisi?' : 'Tolak pengajuan ini?'}</h2>
            <p>{konfirmasi === 'setujui'
              ? <>Surat {pengajuan.no_referensi} akan diterbitkan dengan persetujuan elektronik beserta kode verifikasi.</>
              : <>{LABEL_TINDAKAN[konfirmasi]} untuk {pengajuan.no_referensi} dengan catatan: “{catatan.trim()}”.</>}</p>
            <div className="staff-editor-actions">
              <button type="button" className="staff-editor-cancel" disabled={sending} onClick={() => setKonfirmasi(null)}><X size={13} /> Batal</button>
              <button type="button" className={konfirmasi === 'setujui' ? 'staff-editor-save' : 'staff-config-delete-confirm'} disabled={sending} onClick={kirim}>{sending ? 'Memproses...' : `Ya, ${LABEL_TINDAKAN[konfirmasi]}`}</button>
            </div>
          </section>
        </div>
      )}

      {pratinjau && (pratinjau.jenis === 'draf'
        ? <PratinjauBerkas judul="Pratinjau draf surat" subjudul={pengajuan.no_referensi} muat={muatPdf} onClose={tutupPratinjau} />
        : pratinjau.jenis === 'terbit'
          ? <PratinjauBerkas judul="Surat resmi terbit" subjudul={pengajuan.no_referensi} muat={muatPdf} onClose={tutupPratinjau} />
          : <PratinjauBerkas berkas={pratinjau} onClose={tutupPratinjau} />)}
    </>
  )
}
