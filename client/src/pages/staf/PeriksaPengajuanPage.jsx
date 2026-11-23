import { useState } from 'react'
import { Check, CheckCircle2, ChevronLeft, ChevronRight, Clock3, ExternalLink, FileText, X } from 'lucide-react'

export function PeriksaPengajuanPage({ submission, onClose }) {
  const [documents, setDocuments] = useState({
    krs: 'sesuai',
    ktm: 'sesuai',
  })
  const [note, setNote] = useState('')
  const [feedback, setFeedback] = useState('')

  const setDocumentStatus = (key, status) => {
    setDocuments((current) => ({ ...current, [key]: status }))
  }

  const submitDecision = (decision) => {
    const incomplete = Object.values(documents).some((status) => status !== 'sesuai')
    if (decision === 'Perbaikan' && !note.trim()) {
      setFeedback('Tambahkan catatan perbaikan sebelum mengembalikan pengajuan.')
      return
    }
    if (decision === 'Verifikasi' && incomplete) {
      setFeedback('Seluruh dokumen harus dinyatakan sesuai sebelum diverifikasi.')
      return
    }
    setFeedback(decision === 'Tolak'
      ? 'Pengajuan ditolak. Status pengajuan telah diperbarui.'
      : decision === 'Perbaikan'
        ? 'Pengajuan dikembalikan kepada mahasiswa untuk diperbaiki.'
        : 'Pengajuan berhasil diverifikasi dan siap diproses lebih lanjut.')
  }

  const documentItems = [
    { key: 'krs', title: 'Kartu Rencana Studi', subtitle: 'Surat Mahasiswa', size: '1,2 MB', action: 'Dokumen wajib', filename: 'KRS_Ganjil_2026.pdf' },
    { key: 'ktm', title: 'Kartu Rencana Studi', subtitle: 'Surat Mahasiswa', size: '840 KB', action: 'Dokumen wajib', filename: 'KRS_Ganjil_2026.pdf' },
  ]

  return (
    <>
      <div className="staff-review-heading">
        <div className="staff-breadcrumb">Layanan Kemahasiswaan FTI <span>/</span> Daftar Pengajuan</div>
        <h1>Periksa &amp; Verifikasi Pengajuan</h1>
        <div className="staff-review-meta">
          <strong>{submission?.id || 'PGJ-2026-0186'}</strong>
          <span className="staff-review-status"><CheckCircle2 size={11} /> {submission?.status || 'Diajukan'}</span>
          <span>Diajukan {submission?.date || '20 Oktober 2026'}, 08.15 WIB</span>
          <button type="button" onClick={onClose} aria-label="Kembali ke daftar pengajuan"><ChevronLeft size={14} /> Kembali</button>
        </div>
      </div>

      {feedback && <div className="staff-notice success staff-review-feedback" role="status"><CheckCircle2 size={16} /><span>{feedback}</span><button type="button" onClick={() => setFeedback('')} aria-label="Tutup pesan"><X size={15} /></button></div>}

      <div className="staff-review-layout">
        <div className="staff-review-main">
          <section className="staff-panel staff-review-applicant">
            <h2>Data Pemohon</h2>
            <div className="staff-review-applicant-grid">
              <dl>
                <div><dt>Identitas akademik</dt><dd /></div>
                <div><dt>Nama</dt><dd>{submission?.name || '-'}</dd></div>
                <div><dt>NIM</dt><dd>{submission?.nim || '-'}</dd></div>
                <div><dt>Program Studi</dt><dd>Sistem Informasi</dd></div>
                <div><dt>Semester</dt><dd>Ganjil 2026/2027</dd></div>
              </dl>
            </div>
          </section>

          <section className="staff-panel staff-review-documents">
            <div className="staff-review-documents-heading">
              <div><h2>Dokumen Persyaratan</h2><p>Tandai dokumen telah diperiksa dan dinyatakan sesuai.</p></div>
              <button type="button" onClick={() => setDocuments({ krs: 'sesuai', ktm: 'sesuai' })}><RefreshIcon /> Diperiksa</button>
            </div>

            {documentItems.map((document) => (
              <article className="staff-review-document" key={document.key}>
                <div className="staff-review-document-name">
                  <span className="staff-review-file-icon"><FileText size={15} /></span>
                  <div><strong>{document.title}</strong><small>{document.subtitle}</small></div>
                  <span>{document.size}</span>
                </div>
                <div className="staff-review-document-actions">
                  <span className="staff-review-document-note">{document.action} <small>{document.filename}</small></span>
                  <div className="staff-review-radio-group" role="radiogroup" aria-label={`Status ${document.title}`}>
                    <label><input type="radio" name={`document-${document.key}`} checked={documents[document.key] === 'sesuai'} onChange={() => setDocumentStatus(document.key, 'sesuai')} /><span>Sesuai</span></label>
                    <label><input type="radio" name={`document-${document.key}`} checked={documents[document.key] === 'tidak-sesuai'} onChange={() => setDocumentStatus(document.key, 'tidak-sesuai')} /><span>Tidak Sesuai</span></label>
                  </div>
                  <label className="staff-review-document-note-field">
                    <span>Catatan pemeriksaan dokumen</span>
                    <input type="text" placeholder="Identifikasi dokumen yang perlu diperbaiki" value={documents[`${document.key}Note`] || ''} onChange={(event) => setDocuments((current) => ({ ...current, [`${document.key}Note`]: event.target.value }))} />
                  </label>
                </div>
              </article>
            ))}

            <div className="staff-review-decision-note">
              <span>Catatan pemeriksaan dokumen</span>
              <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Tambahkan catatan pemeriksaan atau perbaikan..." />
            </div>
          </section>
        </div>

        <aside className="staff-review-aside">
          <section className="staff-panel staff-review-checklist">
            <h2>Hasil Pemeriksaan Otomatis</h2>
            <strong>3 pemeriksaan lolos</strong>
            <ul>
              <li>NRV terdaftar dan berstatus aktif</li>
              <li>Format dan ukuran dokumen sesuai</li>
              <li>Seluruh dokumen wajib ditunggu</li>
            </ul>
            <button type="button"><ExternalLink size={13} /> Lihat Lengkapan <ChevronRight size={13} /></button>
          </section>

          <section className="staff-panel staff-review-timeline">
            <h2>Riwayat Pengajuan</h2>
            <ol>
              <li className="done"><span><Check size={11} /></span><div><strong>Pengajuan diterima</strong><p>Pengajuan {submission?.id || 'PGJ-2026-0186'} berhasil dikirim.</p><small>{submission?.date || '20 Okt 2026'}, 08.15 WIB</small></div></li>
              <li className="done"><span><Check size={11} /></span><div><strong>Pemeriksaan otomatis selesai</strong><p>Kelengkapan dokumen telah diperiksa.</p><small>{submission?.date || '20 Okt 2026'}, 08.16 WIB</small></div></li>
              <li className="current"><span><Clock3 size={11} /></span><div><strong>Verifikasi Staff Akademik</strong><p>Menunggu verifikasi Staf Akademik.</p><small>Belum diproses</small></div></li>
              <li><span /> <div><strong>Persetujuan Kepala Kantor</strong><p>Menunggu hasil verifikasi staf.</p><small>Belum diproses</small></div></li>
            </ol>
          </section>
        </aside>
      </div>

      <div className="staff-review-actions">
        <p>Selesaikan pemeriksaan sesuai dokumen yang diajukan.</p>
        <div>
          <button type="button" className="staff-review-reject" onClick={() => submitDecision('Tolak')}>Tolak</button>
          <button type="button" className="staff-review-correction" onClick={() => submitDecision('Perbaikan')}>Minta Perbaikan</button>
          <button type="button" className="staff-review-verify" onClick={() => submitDecision('Verifikasi')}>Verifikasi</button>
        </div>
      </div>
    </>
  )
}

function RefreshIcon() {
  return <span className="staff-review-refresh-mark" aria-hidden="true">↻</span>
}
