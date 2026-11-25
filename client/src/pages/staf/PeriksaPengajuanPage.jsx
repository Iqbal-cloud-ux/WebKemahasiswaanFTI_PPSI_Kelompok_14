import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, Check, CheckCircle2, ChevronLeft, Eye, FileText, X } from 'lucide-react'
import { PratinjauBerkas } from '../../components/PratinjauBerkas.jsx'
import { bacaHasil, detailPengajuanRequest, periksaPengajuanRequest } from '../../services/api.js'
import { formatWaktu, statusStaf } from '../../utils/statusPengajuan.js'
import { teksSemester } from '../../utils/semester.js'
import { usePesanOtomatis } from '../../hooks/usePesanOtomatis.js'
import { tandaiSalah } from '../../utils/validasiForm.js'
import { tampilIsian } from '../../utils/isian.js'

const KEPUTUSAN = {
  verifikasi: { tombol: 'Verifikasi', kelas: 'staff-review-verify' },
  perbaikan: { tombol: 'Minta Perbaikan', kelas: 'staff-review-correction' },
  tolak: { tombol: 'Tolak', kelas: 'staff-review-reject' },
}

// Periksa dan verifikasi satu pengajuan (#71, #72, #74). Data diambil dari GET /api/pengajuan/:id;
// keputusan dikirim ke POST /api/pengajuan/:id/pemeriksaan. onSelesai memuat ulang daftar di StafPortal.
export function PeriksaPengajuanPage({ pengajuanId, onClose, onSelesai }) {
  const [detail, setDetail] = useState({ status: 'memuat', data: null, pesan: '' })
  const [versi, setVersi] = useState(0)
  const [hasilBerkas, setHasilBerkas] = useState({}) // id berkas -> { status_verifikasi, catatan }
  const [note, setNote] = useState('')
  const [feedback, setFeedback] = useState(null)
  usePesanOtomatis(feedback, () => setFeedback(null), feedback?.type === 'success')
  const [sending, setSending] = useState(false)
  const [pratinjau, setPratinjau] = useState(null)

  useEffect(() => {
    let aktif = true
    detailPengajuanRequest(pengajuanId)
      .then(bacaHasil)
      .then((data) => {
        if (!aktif) return
        setDetail({ status: 'siap', data, pesan: '' })
        // Tanda awal mengikuti hasil pemeriksaan sebelumnya (misalnya berkas yang sudah sesuai sebelum perbaikan).
        setHasilBerkas(Object.fromEntries(data.berkas.map((b) => [b.id, {
          status_verifikasi: b.status_verifikasi === 'belum_diperiksa' ? '' : b.status_verifikasi,
          catatan: b.catatan_verifikasi || '',
        }])))
      })
      .catch((galat) => { if (aktif) setDetail({ status: 'galat', data: null, pesan: galat.message }) })
    return () => { aktif = false }
  }, [pengajuanId, versi])

  const tutupPratinjau = useCallback(() => setPratinjau(null), [])

  if (detail.status !== 'siap') {
    return (
      <>
        <div className="staff-review-heading">
          <div className="staff-breadcrumb">Layanan Kemahasiswaan FTI <span>/</span> Daftar Pengajuan</div>
          <h1>Periksa &amp; Verifikasi Pengajuan</h1>
          <div className="staff-review-meta"><button type="button" onClick={onClose}><ChevronLeft size={14} /> Kembali</button></div>
        </div>
        {detail.status === 'memuat'
          ? <div className="staff-access-message" role="status"><span className="staff-spinner" /> Memuat pengajuan...</div>
          : <div className="staff-notice error" role="alert"><AlertCircle size={16} /><span>{detail.pesan}</span></div>}
      </>
    )
  }

  const data = detail.data
  const bisaDiperiksa = data.status === 'diajukan'
  const status = statusStaf(data.status)

  const ubahBerkas = (id, nilai) => setHasilBerkas((current) => ({ ...current, [id]: { ...current[id], ...nilai } }))
  const tandaiSemuaSesuai = () => setHasilBerkas((current) => Object.fromEntries(Object.entries(current).map(([id, nilai]) => [id, { ...nilai, status_verifikasi: 'sesuai' }])))

  const submitDecision = async (keputusan) => {
    const belumDitandai = data.berkas.filter((b) => !hasilBerkas[b.id]?.status_verifikasi)
    if (keputusan === 'verifikasi' && belumDitandai.length > 0) {
      // Gulir ke dokumen pertama yang belum ditandai Sesuai/Tidak Sesuai.
      const pilihan = document.querySelector(`input[name="document-${belumDitandai[0].id}"]`)
      pilihan?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      pilihan?.focus({ preventScroll: true })
      return setFeedback({ type: 'error', message: `Tandai semua dokumen terlebih dahulu. Belum ditandai: ${belumDitandai.map((b) => b.nama_syarat).join(', ')}.` })
    }
    if (keputusan === 'verifikasi' && data.berkas.some((b) => hasilBerkas[b.id]?.status_verifikasi !== 'sesuai')) {
      return setFeedback({ type: 'error', message: 'Semua dokumen harus dinyatakan Sesuai sebelum diverifikasi. Gunakan Minta Perbaikan bila ada dokumen yang tidak sesuai.' })
    }
    if (keputusan !== 'verifikasi' && !note.trim()) {
      setFeedback(null)
      return tandaiSalah(document.getElementById('catatan-pemeriksaan'))
    }
    if (keputusan === 'tolak' && !window.confirm('Tolak pengajuan ini? Penolakan bersifat akhir dan mahasiswa harus membuat pengajuan baru.')) return

    setSending(true)
    setFeedback(null)
    try {
      const berkas = data.berkas
        .filter((b) => hasilBerkas[b.id]?.status_verifikasi)
        .map((b) => ({ id: b.id, status_verifikasi: hasilBerkas[b.id].status_verifikasi, catatan: hasilBerkas[b.id].catatan }))
      const response = await periksaPengajuanRequest(data.id, { keputusan, catatan: note.trim(), berkas })
      const pesan = (await response.clone().json().catch(() => null))?.message
      await bacaHasil(response)
      setFeedback({ type: 'success', message: `${pesan || 'Keputusan tersimpan'}. Mahasiswa sudah menerima notifikasi.` })
      setNote('')
      setVersi((v) => v + 1)
      onSelesai()
    } catch (galat) {
      setFeedback({ type: 'error', message: galat.message })
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <div className="staff-review-heading">
        <div className="staff-breadcrumb">Layanan Kemahasiswaan FTI <span>/</span> Daftar Pengajuan</div>
        <h1>Periksa &amp; Verifikasi Pengajuan</h1>
        <div className="staff-review-meta">
          <strong>{data.no_referensi}</strong>
          <span className={`staff-submission-status status-${status.kelas}`}>{status.label}</span>
          <span>Diajukan {formatWaktu(data.created_at)}</span>
          <button type="button" onClick={onClose} aria-label="Kembali ke daftar pengajuan"><ChevronLeft size={14} /> Kembali</button>
        </div>
      </div>

      {feedback && <div className={`staff-notice ${feedback.type} staff-review-feedback`} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}<span>{feedback.message}</span><button type="button" onClick={() => setFeedback(null)} aria-label="Tutup pesan"><X size={15} /></button></div>}
      {!bisaDiperiksa && <div className="staff-notice info" role="status"><span>Pengajuan ini berstatus {status.label}. Pemeriksaan berkas hanya bisa dilakukan saat status Diajukan.</span></div>}

      <div className="staff-review-layout">
        <div className="staff-review-main">
          <section className="staff-panel staff-review-applicant">
            <h2>Data Pemohon</h2>
            <div className="staff-review-applicant-grid">
              <dl>
                <div><dt>Nama</dt><dd>{data.mahasiswa.nama}</dd></div>
                <div><dt>NIM</dt><dd>{data.mahasiswa.nim}</dd></div>
                <div><dt>Program Studi</dt><dd>{data.mahasiswa.prodi || '-'}</dd></div>
                <div><dt>Semester</dt><dd>{teksSemester(data.mahasiswa.angkatan)}</dd></div>
                <div><dt>Layanan</dt><dd>{data.layanan.nama_layanan}</dd></div>
                <div><dt>Keperluan</dt><dd>{data.keperluan}</dd></div>
                {/* Isian tambahan dari mahasiswa (misalnya data orang tua): periksa terhadap dokumen pendukung. */}
                {(data.isian || []).map((item) => <div key={item.nama}><dt>{item.label}</dt><dd>{tampilIsian(item, data.data_isian?.[item.nama])}</dd></div>)}
                {data.catatan_revisi && <div><dt>Catatan terakhir untuk mahasiswa</dt><dd>{data.catatan_revisi}</dd></div>}
              </dl>
            </div>
          </section>

          <section className="staff-panel staff-review-documents">
            <div className="staff-review-documents-heading">
              <div><h2>Dokumen Persyaratan</h2><p>{bisaDiperiksa ? 'Buka setiap dokumen, lalu tandai Sesuai atau Tidak Sesuai.' : 'Hasil pemeriksaan dokumen.'}</p></div>
              {bisaDiperiksa && data.berkas.length > 0 && <button type="button" onClick={tandaiSemuaSesuai}><Check size={13} /> Tandai semua sesuai</button>}
            </div>

            {data.berkas.length === 0 && <p className="staff-review-empty">Layanan ini tidak memerlukan dokumen pendukung.</p>}
            {data.berkas.map((berkas) => {
              const nilai = hasilBerkas[berkas.id] || {}
              return (
                <article className="staff-review-document" key={berkas.id}>
                  <div className="staff-review-document-name">
                    <span className="staff-review-file-icon"><FileText size={15} /></span>
                    <div><strong>{berkas.nama_syarat}</strong><small>{berkas.original_name}</small></div>
                    <button type="button" className="staff-review-open" onClick={() => setPratinjau(berkas)}><Eye size={13} /> Lihat</button>
                  </div>
                  <div className="staff-review-document-actions">
                    <div className="staff-review-radio-group" role="radiogroup" aria-label={`Status ${berkas.nama_syarat}`}>
                      <label><input type="radio" name={`document-${berkas.id}`} disabled={!bisaDiperiksa} checked={nilai.status_verifikasi === 'sesuai'} onChange={() => ubahBerkas(berkas.id, { status_verifikasi: 'sesuai' })} /><span>Sesuai</span></label>
                      <label><input type="radio" name={`document-${berkas.id}`} disabled={!bisaDiperiksa} checked={nilai.status_verifikasi === 'tidak_sesuai'} onChange={() => ubahBerkas(berkas.id, { status_verifikasi: 'tidak_sesuai' })} /><span>Tidak Sesuai</span></label>
                    </div>
                    <label className="staff-review-document-note-field">
                      <span>Catatan dokumen (tampil ke mahasiswa)</span>
                      <input type="text" maxLength={1000} disabled={!bisaDiperiksa} placeholder="Contoh: tanda tangan Pembimbing Akademik belum ada" value={nilai.catatan || ''} onChange={(event) => ubahBerkas(berkas.id, { catatan: event.target.value })} />
                    </label>
                  </div>
                </article>
              )
            })}

            {bisaDiperiksa && (
              <div className="staff-review-decision-note">
                <label htmlFor="catatan-pemeriksaan">Catatan untuk mahasiswa (wajib untuk Minta Perbaikan dan Tolak)</label>
                <textarea id="catatan-pemeriksaan" maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Jelaskan apa yang perlu diperbaiki, atau alasan penolakan..." />
              </div>
            )}
          </section>
        </div>

        <aside className="staff-review-aside">
          <section className="staff-panel staff-review-checklist">
            <h2>Ringkasan Pemeriksaan</h2>
            <strong>{data.berkas.filter((b) => hasilBerkas[b.id]?.status_verifikasi === 'sesuai').length} dari {data.berkas.length} dokumen sesuai</strong>
            <ul>
              <li>Format dan ukuran berkas sudah diperiksa sistem saat diunggah (PDF/JPG/PNG, maks. 5 MB).</li>
              <li>Dokumen wajib sudah lengkap saat pengajuan dikirim.</li>
              <li>Keaslian dan isi dokumen diperiksa oleh Staf Akademik.</li>
            </ul>
          </section>

          <section className="staff-panel staff-review-timeline">
            <h2>Riwayat Pengajuan</h2>
            <ol>
              {data.riwayat.map((item) => (
                <li className="done" key={item.id}>
                  <span><Check size={11} /></span>
                  <div>
                    <strong>{statusStaf(item.status_baru).label}</strong>
                    <p>{item.status_sebelumnya ? `Dari ${statusStaf(item.status_sebelumnya).label}` : 'Pengajuan dikirim'}{item.pelaku_nama ? ` oleh ${item.pelaku_nama}` : ''}.{item.catatan ? ` Catatan: ${item.catatan}` : ''}</p>
                    <small>{formatWaktu(item.created_at)}</small>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>

      {bisaDiperiksa && (
        <div className="staff-review-actions">
          <p>Selesaikan pemeriksaan sesuai dokumen yang diajukan.</p>
          <div>
            {['tolak', 'perbaikan', 'verifikasi'].map((keputusan) => (
              <button type="button" key={keputusan} className={KEPUTUSAN[keputusan].kelas} disabled={sending} onClick={() => submitDecision(keputusan)}>{KEPUTUSAN[keputusan].tombol}</button>
            ))}
          </div>
        </div>
      )}

      {pratinjau && <PratinjauBerkas berkas={pratinjau} onClose={tutupPratinjau} />}
    </>
  )
}
