import { useState } from 'react'
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, FileText, Upload } from 'lucide-react'
import { bacaHasil, kirimPengajuanRequest } from '../../services/api.js'
import { ACCEPT_BERKAS, periksaBerkas, ukuranTampil } from '../../utils/berkas.js'
import { StatusMuat } from './BerandaMahasiswaPage.jsx'
import { tandaiSalah } from '../../utils/validasiForm.js'

const LANGKAH = ['Pilih Layanan', 'Isi Formulir & Unggah Dokumen', 'Tinjau & Kirim']

// Formulir pengajuan 3 langkah: Pilih Layanan, Isi Formulir & Unggah Dokumen, Tinjau & Kirim.
// layanan = { status, data, pesan } dari MahasiswaPortal; initialLayananId terisi bila mahasiswa
// menekan "Ajukan" pada katalog layanan di Beranda.
export function PengajuanPage({ user, layanan, initialLayananId = null, onCancel, onSubmitted, onOpenHistory }) {
  const [selectedId, setSelectedId] = useState(initialLayananId)
  const [step, setStep] = useState(1)
  const [keperluan, setKeperluan] = useState('')
  const [noHp, setNoHp] = useState(user.no_hp || '')
  const [files, setFiles] = useState({}) // id syarat -> File
  const [fileErrors, setFileErrors] = useState({}) // id syarat -> pesan
  const [dragOver, setDragOver] = useState(null)
  const [confirmation, setConfirmation] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [tandaiKurang, setTandaiKurang] = useState(false) // kotak dokumen wajib yang kosong diberi warna merah

  const selected = layanan.data.find((item) => item.id === selectedId)
  const selectedAllowed = selected && selected.kelayakan?.boleh !== false
  const syarat = selected?.syarat || []
  const missingRequired = syarat.filter((item) => item.is_required && !files[item.id])

  const chooseFile = (item, file) => {
    if (!file) return
    const problem = periksaBerkas(file)
    setFileErrors((current) => ({ ...current, [item.id]: problem }))
    if (!problem) setFiles((current) => ({ ...current, [item.id]: file }))
  }

  const chooseService = (item) => {
    if (item.kelayakan?.boleh === false) return
    if (item.id !== selectedId) {
      setFiles({})
      setFileErrors({})
      setTandaiKurang(false)
    }
    setSelectedId(item.id)
    setError('')
  }

  // Langkah 2 tidak menonaktifkan tombol Lanjut, agar mahasiswa mendapat pesan apa yang masih kurang.
  const canContinue = step === 1 ? Boolean(selectedAllowed) : true
  const goNext = () => {
    // Kolom kosong cukup ditandai merah dan difokuskan; dokumen yang kurang tetap disebutkan namanya.
    if (step === 2 && !keperluan.trim()) { setError(''); return tandaiSalah(document.getElementById('purpose')) }
    if (step === 2 && missingRequired.length > 0) {
      setTandaiKurang(true)
      document.getElementById(`syarat-${missingRequired[0].id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return setError(`Dokumen wajib belum diunggah: ${missingRequired.map((item) => item.nama_syarat).join(', ')}.`)
    }
    setError('')
    setStep((current) => Math.min(current + 1, 3))
  }

  const submit = async () => {
    if (!confirmation) { setError(''); return tandaiSalah(document.getElementById('confirmation')) }
    const formData = new FormData()
    formData.append('jenis_layanan_id', String(selected.id))
    formData.append('keperluan', keperluan.trim())
    if (noHp.trim()) formData.append('no_hp', noHp.trim())
    Object.entries(files).forEach(([syaratId, file]) => formData.append(`berkas_${syaratId}`, file))

    setSending(true)
    setError('')
    try {
      const hasil = await bacaHasil(await kirimPengajuanRequest(formData))
      setResult(hasil)
      onSubmitted(hasil, noHp.trim())
    } catch (galat) {
      setError(galat.message || 'Pengajuan gagal dikirim. Coba lagi beberapa saat lagi.')
    } finally {
      setSending(false)
    }
  }

  if (result) {
    return (
      <div className="submission-content">
        <div className="breadcrumb">Layanan Kemahasiswaan FTI / Mahasiswa</div>
        <section className="result-card success" role="status">
          <CheckCircle2 size={48} />
          <h2>Pengajuan berhasil dikirim</h2>
          <p>Pengajuan {result.layanan.nama_layanan} sudah diterima dan akan diperiksa oleh Staf Akademik. Status dan notifikasi dapat dipantau di Riwayat Pengajuan.</p>
          <small>Nomor pengajuan: {result.no_referensi}</small>
          <div className="flow-actions"><button type="button" className="outline-button" onClick={onCancel}>Kembali ke Beranda</button><button type="button" className="primary-button" onClick={onOpenHistory}>Lihat Riwayat Pengajuan <ChevronRight size={15} /></button></div>
        </section>
      </div>
    )
  }

  return (
    <div className="submission-content">
      <div className="breadcrumb">Layanan Kemahasiswaan FTI / Mahasiswa</div>
      <div className="submission-heading">
        <div><h1>{step === 1 ? 'Ajukan Layanan' : LANGKAH[step - 1]}</h1><p>Lengkapi data dan dokumen untuk mengajukan layanan.</p></div>
        <button type="button" className="submission-back-button" onClick={onCancel}><ChevronLeft size={16} /> Kembali ke Beranda</button>
      </div>
      <div className="stepper">{LANGKAH.map((label, index) => <div className={`step${step > index + 1 ? ' done' : ''}${step === index + 1 ? ' current' : ''}`} key={label}><span>{step > index + 1 ? <CheckCircle2 size={13} /> : index + 1}</span>{label}</div>)}</div>

      {step === 1 && (
        <section className="flow-card">
          <div className="flow-card-heading"><h2>Pilih layanan yang ingin diajukan</h2><p>Pilih salah satu layanan untuk melanjutkan pengajuan.</p></div>
          <StatusMuat state={layanan} kosong="Belum ada layanan yang dibuka." />
          <div className="service-choice-list">
            {layanan.data.map((item) => {
              const blocked = item.kelayakan?.boleh === false
              return (
                <button type="button" className={`service-choice${selectedId === item.id ? ' selected' : ''}${blocked ? ' blocked' : ''}`} key={item.id} disabled={blocked} aria-pressed={selectedId === item.id} onClick={() => chooseService(item)}>
                  <span className="service-icon"><FileText size={17} /></span>
                  <span><strong>{item.nama_layanan}</strong><small>{item.deskripsi}</small><small>{item.syarat.length ? `Dokumen: ${item.syarat.map((s) => s.nama_syarat + (s.is_required ? '' : ' (opsional)')).join('; ')}` : 'Tidak perlu mengunggah dokumen pendukung.'}</small>{blocked && <small className="service-choice-reason">{item.kelayakan.alasan}</small>}</span>
                  <span className="choice-radio" />
                </button>
              )
            })}
          </div>
        </section>
      )}

      {step === 2 && selected && (
        <section className="form-flow-grid">
          <div className="flow-card">
            <h2>Data pengajuan</h2>
            <p className="muted-copy">{selected.nama_layanan}</p>
            <label htmlFor="purpose">Keperluan Surat *</label>
            <textarea id="purpose" maxLength={500} value={keperluan} onChange={(event) => setKeperluan(event.target.value)} placeholder="Contoh: Persyaratan pendaftaran beasiswa" />
            <label htmlFor="phone">Nomor Telepon/WhatsApp</label>
            <input id="phone" type="tel" inputMode="tel" value={noHp} onChange={(event) => setNoHp(event.target.value)} placeholder="08xxxxxxxxxx" />
          </div>
          <div className="flow-card">
            <h2>Dokumen pendukung</h2>
            <p className="muted-copy">Format PDF/JPG/PNG, maksimal 5 MB per berkas. Tarik berkas ke kotak, atau tekan Pilih berkas.</p>
            {syarat.length === 0 && <p className="muted-copy">Layanan ini tidak memerlukan dokumen pendukung. Surat dibuat oleh sistem dari data Anda.</p>}
            {syarat.map((item) => (
              <div
                className={`document-upload${files[item.id] ? ' uploaded' : ''}${dragOver === item.id ? ' dragging' : ''}${fileErrors[item.id] || (tandaiKurang && item.is_required && !files[item.id]) ? ' invalid' : ''}`}
                key={item.id}
                id={`syarat-${item.id}`}
                onDragOver={(event) => { event.preventDefault(); setDragOver(item.id) }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(event) => { event.preventDefault(); setDragOver(null); chooseFile(item, event.dataTransfer.files[0]) }}
              >
                <div>
                  <strong>{item.nama_syarat} {item.is_required ? '*' : '(opsional)'}</strong>
                  {fileErrors[item.id]
                    ? <small className="document-upload-error">{fileErrors[item.id]}</small>
                    : <small>{files[item.id] ? `${files[item.id].name} · ${ukuranTampil(files[item.id].size)}` : 'Belum diunggah'}</small>}
                </div>
                <label className="upload-button"><Upload size={14} /> {files[item.id] ? 'Ganti berkas' : 'Pilih berkas'}<input type="file" accept={ACCEPT_BERKAS} onChange={(event) => { chooseFile(item, event.target.files[0]); event.target.value = '' }} /></label>
              </div>
            ))}
          </div>
        </section>
      )}

      {step === 3 && selected && (
        <section className="flow-card review-card">
          <h2>Periksa kembali pengajuan Anda</h2>
          <div className="review-row"><span>Layanan</span><strong>{selected.nama_layanan}</strong></div>
          <div className="review-row"><span>Nama</span><strong>{user.nama || 'Mahasiswa'}</strong></div>
          <div className="review-row"><span>NIM</span><strong>{user.identifier || '-'}</strong></div>
          <div className="review-row"><span>Program Studi</span><strong>{user.prodi || '-'}</strong></div>
          <div className="review-row"><span>Keperluan</span><strong>{keperluan.trim()}</strong></div>
          <div className="review-row"><span>Telepon/WhatsApp</span><strong>{noHp.trim() || '-'}</strong></div>
          <h3>Dokumen terunggah</h3>
          {syarat.length === 0 && <p className="muted-copy">Tidak ada dokumen yang perlu diunggah.</p>}
          {syarat.map((item) => <div className="review-document" key={item.id}>{files[item.id] ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}{item.nama_syarat}<span>{files[item.id]?.name || (item.is_required ? 'Belum diunggah' : 'Tidak dilampirkan')}</span></div>)}
          <label className="confirmation" htmlFor="confirmation"><input id="confirmation" type="checkbox" checked={confirmation} onChange={(event) => setConfirmation(event.target.checked)} /> Saya menyatakan data dan dokumen yang diunggah sudah benar.</label>
        </section>
      )}

      {error && <div className="flow-error" role="alert"><AlertCircle size={15} />{error}</div>}
      <div className="flow-actions">
        <button type="button" className="outline-button" disabled={sending} onClick={step === 1 ? onCancel : () => { setError(''); setStep((current) => current - 1) }}>{step === 1 ? 'Kembali ke Beranda' : 'Kembali'}</button>
        {step < 3
          ? <button type="button" className="primary-button" disabled={!canContinue} onClick={goNext}>Lanjut <ChevronRight size={15} /></button>
          : <button type="button" className="primary-button" disabled={sending} onClick={submit}>{sending ? 'Mengirim...' : 'Kirim Pengajuan'} {!sending && <ChevronRight size={15} />}</button>}
      </div>
    </div>
  )
}
