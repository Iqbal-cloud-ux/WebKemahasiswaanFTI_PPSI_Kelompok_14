import { useState } from 'react'
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, FileText, Upload } from 'lucide-react'
import { services } from '../../data/contohMahasiswa.js'

const EMPTY_SUBMISSION = { purpose: '', phone: '', files: {}, confirmation: false }

// Nomor sementara di peramban. Nanti dibuat server (#62); format resmi [BELUM FINAL].
const buatNomorSementara = () => `PGJ-2026-${String(Date.now()).slice(-5)}`

// Formulir pengajuan 3 langkah: Pilih Layanan, Isi Formulir & Unggah Dokumen, Tinjau & Kirim.
// initialService terisi bila mahasiswa menekan "Ajukan" pada katalog layanan di Beranda.
export function PengajuanPage({ user, initialService = '', onCancel }) {
  const [selectedService, setSelectedService] = useState(initialService)
  const [submissionStep, setSubmissionStep] = useState(1)
  const [submissionData, setSubmissionData] = useState(EMPTY_SUBMISSION)
  const [submissionResult, setSubmissionResult] = useState(null)

  const selectedServiceData = services.find((service) => service.title === selectedService)
  const updateSubmission = (field, value) => setSubmissionData((current) => ({ ...current, [field]: value }))
  const uploadDocument = (documentName, file) => {
    if (file) updateSubmission('files', { ...submissionData.files, [documentName]: file.name })
  }

  const submitApplication = () => {
    if (!submissionData.confirmation) {
      setSubmissionResult({ type: 'error', title: 'Pengajuan gagal dikirim', message: 'Centang pernyataan bahwa data dan dokumen yang diunggah sudah benar.' })
      return
    }

    const missingDocuments = (selectedServiceData?.documents || []).filter((document) => !submissionData.files[document])
    if (missingDocuments.length > 0) {
      setSubmissionResult({ type: 'error', title: 'Pengajuan gagal dikirim', message: `Dokumen wajib belum lengkap: ${missingDocuments.join(', ')}.` })
      return
    }

    setSubmissionResult({ type: 'success', title: 'Pengajuan berhasil dikirim', message: 'Pengajuan Anda telah diterima dan akan diperiksa oleh Staf Akademik.', reference: buatNomorSementara() })
  }

  const canContinue = submissionStep === 1 ? Boolean(selectedService) : Boolean(submissionData.purpose.trim() && submissionData.phone.trim())
  const goToNextStep = () => {
    if (canContinue) setSubmissionStep((step) => Math.min(step + 1, 3))
  }

  return (
    <div className="submission-content">
        <div className="breadcrumb">Layanan Kemahasiswaan FTI / Mahasiswa</div>
        <div className="submission-heading">
          <div><h1>{submissionResult ? 'Status Pengajuan' : submissionStep === 1 ? 'Ajukan Layanan' : submissionStep === 2 ? 'Isi Formulir & Unggah Dokumen' : 'Tinjau & Kirim'}</h1><p>{submissionResult ? 'Berikut hasil pengiriman pengajuan Anda.' : 'Lengkapi data dan dokumen untuk mengajukan layanan.'}</p></div>
          {!submissionResult && <button type="button" className="submission-back-button" onClick={onCancel}><ChevronLeft size={16} /> Kembali ke Beranda</button>}
        </div>
        {!submissionResult && <div className="stepper">{['Pilih Layanan', 'Isi Formulir & Unggah Dokumen', 'Tinjau & Kirim'].map((label, index) => <div className={`step${submissionStep > index + 1 ? ' done' : ''}${submissionStep === index + 1 ? ' current' : ''}`} key={label}><span>{submissionStep > index + 1 ? <CheckCircle2 size={13} /> : index + 1}</span>{label}</div>)}</div>}

        {submissionResult ? (
          <section className={`result-card ${submissionResult.type}`}>
            {submissionResult.type === 'success' ? <CheckCircle2 size={48} /> : <AlertCircle size={48} />}
            <h2>{submissionResult.title}</h2><p>{submissionResult.message}</p>
            {submissionResult.type === 'success' && <small>Nomor pengajuan: {submissionResult.reference}</small>}
            <button type="button" className="primary-button" onClick={onCancel}>Kembali ke Beranda</button>
          </section>
        ) : (
          <>
            {submissionStep === 1 && <section className="flow-card"><div className="flow-card-heading"><h2>Pilih layanan yang ingin diajukan</h2><p>Pilih salah satu layanan untuk melanjutkan pengajuan.</p></div><div className="service-choice-list">{services.map((service) => <button type="button" className={`service-choice${selectedService === service.title ? ' selected' : ''}`} key={service.title} onClick={() => setSelectedService(service.title)}><span className="service-icon"><FileText size={17} /></span><span><strong>{service.title}</strong><small>{service.description}</small></span><span className="choice-radio" /></button>)}</div></section>}
            {submissionStep === 2 && <section className="form-flow-grid"><div className="flow-card"><h2>Data pengajuan</h2><label htmlFor="purpose">Keperluan Surat *</label><textarea id="purpose" value={submissionData.purpose} onChange={(event) => updateSubmission('purpose', event.target.value)} placeholder="Contoh: Administrasi beasiswa" /><label htmlFor="phone">Nomor Telepon/WhatsApp *</label><input id="phone" value={submissionData.phone} onChange={(event) => updateSubmission('phone', event.target.value)} placeholder="08xxxxxxxxxx" /></div><div className="flow-card"><h2>Dokumen wajib</h2><p className="muted-copy">Format PDF/JPG/PNG, maksimal 5 MB.</p>{selectedServiceData.documents.map((document) => <div className={`document-upload${submissionData.files[document] ? ' uploaded' : ''}`} key={document}><div><strong>{document} *</strong>{submissionData.files[document] ? <small>{submissionData.files[document]}</small> : <small>Belum diunggah</small>}</div><label className="upload-button"><Upload size={14} /> {submissionData.files[document] ? 'Ganti berkas' : 'Pilih berkas'}<input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => uploadDocument(document, event.target.files[0])} /></label></div>)}</div></section>}
            {submissionStep === 3 && <section className="flow-card review-card"><h2>Periksa kembali pengajuan Anda</h2><div className="review-row"><span>Layanan</span><strong>{selectedService}</strong></div><div className="review-row"><span>Nama</span><strong>{user.nama || 'Mahasiswa'}</strong></div><div className="review-row"><span>NIM</span><strong>{user.nim || user.identifier || '-'}</strong></div><div className="review-row"><span>Keperluan</span><strong>{submissionData.purpose}</strong></div><h3>Dokumen terunggah</h3>{selectedServiceData.documents.map((document) => <div className="review-document" key={document}><CheckCircle2 size={15} />{document}<span>{submissionData.files[document] || 'Belum diunggah'}</span></div>)}<label className="confirmation"><input type="checkbox" checked={submissionData.confirmation} onChange={(event) => updateSubmission('confirmation', event.target.checked)} /> Saya menyatakan data dan dokumen yang diunggah sudah benar.</label>{submissionResult && <div className="flow-error"><AlertCircle size={15} />{submissionResult.message}</div>}</section>}
            {submissionResult && <div className="flow-error"><AlertCircle size={15} />{submissionResult.message}</div>}
            <div className="flow-actions"><button type="button" className="outline-button" onClick={submissionStep === 1 ? onCancel : () => setSubmissionStep((step) => step - 1)}>{submissionStep === 1 ? 'Kembali ke Beranda' : 'Kembali'}</button>{submissionStep < 3 ? <button type="button" className="primary-button" disabled={!canContinue} onClick={goToNextStep}>Lanjut <ChevronRight size={15} /></button> : <button type="button" className="primary-button" onClick={submitApplication}>Kirim Pengajuan <ChevronRight size={15} /></button>}</div>
          </>
        )}
    </div>
  )
}
