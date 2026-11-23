import { useEffect, useState } from 'react'
import { Archive, BarChart3, Bell, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Clock3, Download, ExternalLink, Eye, EyeOff, FilePlus2, FileText, GraduationCap, Home, Inbox, LockKeyhole, LogOut, Menu, Pencil, Plus, Search, Send, ShieldAlert, Trash2, UserRound, X } from 'lucide-react'
import './StaffPages.css'

const staffSubmissions = [
  { id: 'PGJ-2026-0186', name: 'Budi Santoso', nim: '9900000001', service: 'Aktif Kuliah', date: '20 Okt 2026', dateValue: '2026-10-20', waiting: '3 hari', status: 'Diajukan' },
  { id: 'PGJ-2026-0187', name: 'Siti Aminah', nim: '9900000002', service: 'Beasiswa', date: '20 Okt 2026', dateValue: '2026-10-20', waiting: '3 hari', status: 'Diajukan' },
  { id: 'PGJ-2026-0188', name: 'Rudi Hartono', nim: '9900000003', service: 'Penurunan UKT', date: '21 Okt 2026', dateValue: '2026-10-21', waiting: '2 hari', status: 'Diajukan' },
  { id: 'PGJ-2026-0189', name: 'Dewi Kartika', nim: '9900000004', service: 'Pengembalian UKT', date: '21 Okt 2026', dateValue: '2026-10-21', waiting: '2 hari', status: 'Diajukan' },
  { id: 'PGJ-2026-0190', name: 'Agus Setiawan', nim: '9900000005', service: 'Pengunduran Diri', date: '22 Okt 2026', dateValue: '2026-10-22', waiting: '1 hari', status: 'Diajukan' },
  { id: 'PGJ-2026-0191', name: 'Rina Marlina', nim: '9900000006', service: 'Aktif Kuliah', date: '23 Okt 2026', dateValue: '2026-10-23', waiting: '1 hari', status: 'Diverifikasi' },
  { id: 'PGJ-2026-0192', name: 'Hendra Wijaya', nim: '9900000007', service: 'Beasiswa', date: '23 Okt 2026', dateValue: '2026-10-23', waiting: '2 hari', status: 'Perlu Perbaikan' },
  { id: 'PGJ-2026-0193', name: 'Fitri Handayani', nim: '9900000008', service: 'Penurunan UKT', date: '23 Okt 2026', dateValue: '2026-10-23', waiting: '3 hari', status: 'Diproses' },
  { id: 'PGJ-2026-0194', name: 'Joko Susilo', nim: '9900000009', service: 'Pengembalian UKT', date: '23 Okt 2026', dateValue: '2026-10-23', waiting: '4 hari', status: 'Menunggu Persetujuan' },
  { id: 'PGJ-2026-0195', name: 'Lina Susanti', nim: '9900000010', service: 'Pengunduran Diri', date: '23 Okt 2026', dateValue: '2026-10-23', waiting: '5 hari', status: 'Disetujui' },
  { id: 'PGJ-2026-0196', name: 'Eko Prasetyo', nim: '9900000011', service: 'Aktif Kuliah', date: '23 Okt 2026', dateValue: '2026-10-23', waiting: '6 hari', status: 'Selesai' },
  { id: 'PGJ-2026-0197', name: 'Yuni Astuti', nim: '9900000012', service: 'Beasiswa', date: '23 Okt 2026', dateValue: '2026-10-23', waiting: '7 hari', status: 'Ditolak' },
]

const submissionServices = [...new Set(staffSubmissions.map(({ service }) => service))]
const submissionStatuses = ['Diajukan', 'Diverifikasi', 'Perlu Perbaikan', 'Diproses', 'Menunggu Persetujuan', 'Disetujui', 'Selesai', 'Ditolak']

const initialStaffDrafts = [
  { ...staffSubmissions[0], draftStatus: 'Belum Dibuat' },
  { ...staffSubmissions[1], draftStatus: 'Draf Dibuat' },
  { ...staffSubmissions[2], draftStatus: 'Dikembalikan untuk Revisi' },
  { ...staffSubmissions[3], draftStatus: 'Dikembalikan untuk Revisi' },
  { ...staffSubmissions[4], draftStatus: 'Dikembalikan untuk Revisi' },
  { ...staffSubmissions[5], draftStatus: 'Draf Dibuat' },
  { ...staffSubmissions[6], draftStatus: 'Belum Dibuat' },
  { ...staffSubmissions[7], draftStatus: 'Belum Dibuat' },
  { ...staffSubmissions[8], draftStatus: 'Draf Dibuat' },
  { ...staffSubmissions[9], draftStatus: 'Belum Dibuat' },
  { ...staffSubmissions[10], draftStatus: 'Draf Dibuat' },
  { ...staffSubmissions[11], draftStatus: 'Belum Dibuat' },
  { id: 'PGJ-2026-0198', name: 'Bayu Saputro', nim: '9900000013', service: 'Penurunan UKT', date: '23 Okt 2026', dateValue: '2026-10-23', draftStatus: 'Belum Dibuat' },
  { id: 'PGJ-2026-0199', name: 'Indah Permata', nim: '9900000014', service: 'Pengembalian UKT', date: '23 Okt 2026', dateValue: '2026-10-23', draftStatus: 'Draf Dibuat' },
  { id: 'PGJ-2026-0200', name: 'Wahyu Hidayat', nim: '9900000015', service: 'Pengunduran Diri', date: '23 Okt 2026', dateValue: '2026-10-23', draftStatus: 'Belum Dibuat' },
  { id: 'PGJ-2026-0201', name: 'Sri Wahyuni', nim: '9900000016', service: 'Aktif Kuliah', date: '23 Okt 2026', dateValue: '2026-10-23', draftStatus: 'Draf Dibuat' },
  { id: 'PGJ-2026-0202', name: 'Doni Kurniawan', nim: '9900000017', service: 'Beasiswa', date: '23 Okt 2026', dateValue: '2026-10-23', draftStatus: 'Belum Dibuat' },
  { id: 'PGJ-2026-0203', name: 'Mega Sari', nim: '9900000018', service: 'Pengunduran Diri', date: '23 Okt 2026', dateValue: '2026-10-23', draftStatus: 'Belum Dibuat' },
]

const draftStatuses = ['Belum Dibuat', 'Draf Dibuat', 'Dikembalikan untuk Revisi']

const archiveSamples = [
  { archiveNumber: 'B/352/UN.16.15.WDI/KM.00.00/2026', student: staffSubmissions[0] },
  { archiveNumber: 'B/353/UN.16.15.WDI/KM.00.00/2026', student: staffSubmissions[1] },
  { archiveNumber: 'B/354/UN.16.15.WDI/KM.00.00/2026', student: staffSubmissions[2] },
  { archiveNumber: 'B/355/UN.16.15.WDI/KM.00.00/2026', student: staffSubmissions[3] },
  { archiveNumber: 'B/356/UN.16.15.WDI/KM.00.00/2026', student: staffSubmissions[4] },
]

const initialStaffArchives = Array.from({ length: 128 }, (_, index) => {
  const sample = archiveSamples[index] || {
    archiveNumber: `B/${352 + index}/UN.16.15.WDI/KM.00.00/2026`,
    student: staffSubmissions[index % staffSubmissions.length],
  }
  const day = index < archiveSamples.length ? 23 : (index % 23) + 1
  const dateValue = `2026-10-${String(day).padStart(2, '0')}`

  return {
    ...sample.student,
    archiveNumber: sample.archiveNumber,
    dateValue,
    publishedDate: `${day} Okt 2026`,
    status: 'Selesai',
  }
})

const initialStaffServices = [
  { id: 'LYN-01', code: 'LYN-01', name: 'Aktif Kuliah', templateId: 'TPL-01', documents: ['Dokumen wajib 1', 'Dokumen wajib 2'], updated: '23 Okt 2026', active: true },
  { id: 'LYN-02', code: 'LYN-02', name: 'Beasiswa', templateId: 'TPL-02', documents: ['Dokumen wajib 1', 'Dokumen wajib 2'], updated: '23 Okt 2026', active: true },
  { id: 'LYN-03', code: 'LYN-03', name: 'Penurunan UKT', templateId: 'TPL-03', documents: ['Dokumen wajib 1', 'Dokumen wajib 2', 'Dokumen wajib 3'], updated: '23 Okt 2026', active: true },
  { id: 'LYN-04', code: 'LYN-04', name: 'Pengembalian UKT', templateId: 'TPL-04', documents: ['Dokumen wajib 1', 'Dokumen wajib 2', 'Dokumen wajib 3'], updated: '23 Okt 2026', active: true },
  { id: 'LYN-05', code: 'LYN-05', name: 'Pengunduran Diri', templateId: 'TPL-05', documents: ['Dokumen wajib 1', 'Dokumen wajib 2', 'Dokumen wajib 3'], updated: '23 Okt 2026', active: true },
]

const initialStaffTemplates = [
  { id: 'TPL-01', name: 'Template Aktif Kuliah', content: 'SURAT KETERANGAN AKTIF KULIAH\nNomor: [NOMOR SURAT]\n\nMenerangkan bahwa [NAMA MAHASISWA] dengan NIM [NIM] berstatus sebagai mahasiswa aktif.', updated: '23 Okt 2026', active: true },
  { id: 'TPL-02', name: 'Template Beasiswa', content: 'SURAT KETERANGAN BEASISWA\nNomor: [NOMOR SURAT]\n\nMenerangkan bahwa [NAMA MAHASISWA] dengan NIM [NIM] mengajukan layanan beasiswa.', updated: '23 Okt 2026', active: true },
  { id: 'TPL-03', name: 'Template Penurunan UKT', content: 'SURAT KETERANGAN PENURUNAN UKT\nNomor: [NOMOR SURAT]\n\nMenerangkan bahwa [NAMA MAHASISWA] dengan NIM [NIM] mengajukan penurunan UKT.', updated: '23 Okt 2026', active: true },
  { id: 'TPL-04', name: 'Template Pengembalian UKT', content: 'SURAT KETERANGAN PENGEMBALIAN UKT\nNomor: [NOMOR SURAT]\n\nMenerangkan bahwa [NAMA MAHASISWA] dengan NIM [NIM] mengajukan pengembalian UKT.', updated: '23 Okt 2026', active: true },
  { id: 'TPL-05', name: 'Template Pengunduran Diri', content: 'SURAT KETERANGAN PENGUNDURAN DIRI\nNomor: [NOMOR SURAT]\n\nMenerangkan bahwa [NAMA MAHASISWA] dengan NIM [NIM] mengajukan pengunduran diri.', updated: '23 Okt 2026', active: true },
]

const staffActivities = [
  { title: 'Draf dikembalikan untuk revisi', description: 'Kepala Kantor · Perbaiki penulisan tahun akademik.', time: '10 menit lalu' },
  { title: 'Pengajuan PGJ-2026-0191 diterima', description: 'Rina Marlina · Surat Keterangan Aktif Kuliah.', time: '28 menit lalu' },
  { title: 'Surat B/352 telah diterbitkan', description: 'Persetujuan akhir oleh Dekan dicatat.', time: '1 jam lalu' },
]

const serviceVolumes = [
  { name: 'Aktif Kuliah', value: 68 },
  { name: 'Beasiswa', value: 46 },
  { name: 'Penurunan UKT', value: 30 },
  { name: 'Pengembalian UKT', value: 19 },
  { name: 'Pengunduran Diri', value: 11 },
]

const reportServiceSeeds = [
  { name: 'Aktif Kuliah', total: 68, completed: 52, processing: 14, rejected: 2, oneDayCompletions: 21 },
  { name: 'Beasiswa', total: 46, completed: 34, processing: 10, rejected: 2, oneDayCompletions: 13 },
  { name: 'Penurunan UKT', total: 30, completed: 22, processing: 7, rejected: 1, oneDayCompletions: 9 },
  { name: 'Pengembalian UKT', total: 19, completed: 13, processing: 5, rejected: 1, oneDayCompletions: 5 },
  { name: 'Pengunduran Diri', total: 11, completed: 7, processing: 4, rejected: 0, oneDayCompletions: 3 },
]

const reportDateBuckets = [
  { start: 1, end: 7 },
  { start: 8, end: 14 },
  { start: 15, end: 21 },
  { start: 22, end: 23 },
]
const reportStatusBucketCounts = {
  Selesai: [15, 40, 7, 66],
  Diproses: [4, 8, 9, 19],
  Ditolak: [1, 2, 2, 1],
}
const reportStatusBucketSequence = Object.fromEntries(Object.entries(reportStatusBucketCounts).map(([status, counts]) => [
  status,
  counts.flatMap((count, bucketIndex) => Array(count).fill(bucketIndex)),
]))
const reportStatusIndexes = { Selesai: 0, Diproses: 0, Ditolak: 0 }
const reportBucketDayIndexes = { Selesai: [0, 0, 0, 0], Diproses: [0, 0, 0, 0], Ditolak: [0, 0, 0, 0] }

const initialReportRecords = reportServiceSeeds.flatMap((service, serviceIndex) => {
  let completedIndex = 0
  return Array.from({ length: service.total }, (_, index) => {
    const status = index < service.completed
      ? 'Selesai'
      : index < service.completed + service.processing
        ? 'Diproses'
        : 'Ditolak'
    const turnaroundDays = status === 'Selesai'
      ? (completedIndex++ < service.oneDayCompletions ? 1 : 2)
      : null

    return {
      id: `RPT-${String(serviceIndex * 100 + index + 1).padStart(4, '0')}`,
      service: service.name,
      status,
      turnaroundDays,
    }
  })
}).map((record) => {
  const bucketIndex = reportStatusBucketSequence[record.status][reportStatusIndexes[record.status]++]
  const bucket = reportDateBuckets[bucketIndex]
  const dayOffset = reportBucketDayIndexes[record.status][bucketIndex]++ % (bucket.end - bucket.start + 1)
  const day = bucket.start + dayOffset

  return { ...record, dateValue: `2026-10-${String(day).padStart(2, '0')}` }
})

function StaffReviewPage({ submission, onClose }) {
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

function StaffSubmissionPage({ onReview, selectedSubmission, onCloseReview }) {
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState('oldest')
  const [fromDate, setFromDate] = useState('2026-10-01')
  const [toDate, setToDate] = useState('2026-10-23')
  const [selectedServices, setSelectedServices] = useState(submissionServices)
  const [selectedStatuses, setSelectedStatuses] = useState(submissionStatuses)
  const [activeTab, setActiveTab] = useState('Semua')
  const [selectedIds, setSelectedIds] = useState([])
  const [page, setPage] = useState(1)
  const pageSize = 5

  const filteredSubmissions = staffSubmissions
    .filter((submission) => selectedServices.includes(submission.service))
    .filter((submission) => selectedStatuses.includes(submission.status))
    .filter((submission) => activeTab === 'Semua'
      || (activeTab === 'Perlu Diverifikasi' && ['Diajukan', 'Diverifikasi'].includes(submission.status))
      || submission.status === activeTab)
    .filter((submission) => !fromDate || submission.dateValue >= fromDate)
    .filter((submission) => !toDate || submission.dateValue <= toDate)
    .filter((submission) => `${submission.id} ${submission.name} ${submission.nim} ${submission.service}`.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((first, second) => {
      const byDate = first.dateValue.localeCompare(second.dateValue)
      const byId = first.id.localeCompare(second.id)
      return (sortOrder === 'oldest' ? byDate || byId : -byDate || -byId)
    })

  const pageCount = Math.max(1, Math.ceil(filteredSubmissions.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const visibleSubmissions = filteredSubmissions.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const visibleIds = visibleSubmissions.map(({ id }) => id)
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id))
  const selectedStatusCount = submissionStatuses.reduce((count, status) => count + (selectedStatuses.includes(status) ? 1 : 0), 0)
  const statusSlug = (status) => status.toLowerCase().replace(/\s+/g, '-')

  const toggleService = (service) => {
    setPage(1)
    setSelectedServices((current) => current.includes(service)
      ? current.filter((item) => item !== service)
      : [...current, service])
  }

  const toggleStatus = (status) => {
    setPage(1)
    setSelectedStatuses((current) => current.includes(status)
      ? current.filter((item) => item !== status)
      : [...current, status])
  }

  const toggleVisibleSelection = () => {
    setSelectedIds((current) => allVisibleSelected
      ? current.filter((id) => !visibleIds.includes(id))
      : [...new Set([...current, ...visibleIds])])
  }

  const resetFilters = () => {
    setSearch('')
    setSortOrder('oldest')
    setFromDate('')
    setToDate('')
    setSelectedServices(submissionServices)
    setSelectedStatuses(submissionStatuses)
    setActiveTab('Semua')
    setSelectedIds([])
    setPage(1)
  }

  return (
    <>
      <div className="staff-submissions-heading">
        <div className="staff-breadcrumb">Layanan Kemahasiswaan FTI <span>/</span> Daftar Pengajuan</div>
        <h1>Daftar Pengajuan</h1>
        <p>Kelola, periksa, dan lacak seluruh pengajuan layanan mahasiswa.</p>
      </div>

      <section className="staff-panel staff-filters-panel" aria-label="Filter pengajuan">
        <div className="staff-filter-grid">
          <label className="staff-filter-field staff-search-field" htmlFor="staff-search">
            <span>Cari pengajuan</span>
            <span className="staff-search-control"><input id="staff-search" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Cari nomor pengajuan, nama, atau NIM" /><Search size={16} /></span>
          </label>
          <label className="staff-filter-field" htmlFor="staff-sort">
            <span>Urutkan</span>
            <select id="staff-sort" value={sortOrder} onChange={(event) => { setSortOrder(event.target.value); setPage(1) }}>
              <option value="oldest">Tanggal masuk terlama</option>
              <option value="newest">Tanggal masuk terbaru</option>
            </select>
          </label>
          <div className="staff-filter-field">
            <span>Rentang Tanggal</span>
            <div className="staff-date-range">
              <label htmlFor="staff-date-from"><span className="staff-visually-hidden">Tanggal mulai</span><input id="staff-date-from" type="date" value={fromDate} onChange={(event) => { setFromDate(event.target.value); setPage(1) }} /></label>
              <span className="staff-date-separator">s.d.</span>
              <label htmlFor="staff-date-to"><span className="staff-visually-hidden">Tanggal akhir</span><input id="staff-date-to" type="date" value={toDate} onChange={(event) => { setToDate(event.target.value); setPage(1) }} /></label>
              <CalendarDays size={15} aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="staff-chip-filter">
          <div className="staff-filter-caption">Jenis Surat</div>
          <div className="staff-filter-chips">
            {submissionServices.map((service) => selectedServices.includes(service) && (
              <button type="button" className="staff-filter-chip" key={service} onClick={() => toggleService(service)} aria-label={`Hapus filter ${service}`}>{service}<X size={12} /></button>
            ))}
            {selectedServices.length === 0 && <span className="staff-filter-empty">Tidak ada jenis surat dipilih.</span>}
          </div>
        </div>

        <div className="staff-chip-filter">
          <div className="staff-filter-caption">Status · {selectedStatusCount} status tersedia</div>
          <div className="staff-filter-chips">
            {submissionStatuses.map((status) => selectedStatuses.includes(status) && (
              <button type="button" className="staff-filter-chip" key={status} onClick={() => toggleStatus(status)} aria-label={`Hapus filter ${status}`}>{status}<X size={12} /></button>
            ))}
            {selectedStatusCount === 0 && <span className="staff-filter-empty">Tidak ada status dipilih.</span>}
          </div>
        </div>
        <button type="button" className="staff-clear-filters" onClick={resetFilters}>Atur ulang filter</button>
      </section>

      <div className="staff-status-tabs" role="tablist" aria-label="Filter tab status">
        {['Semua', 'Perlu Diverifikasi', 'Perlu Perbaikan', 'Diproses', 'Selesai', 'Ditolak'].map((tab) => (
          <button type="button" role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? 'active' : ''} key={tab} onClick={() => { setActiveTab(tab); setPage(1) }}>{tab}</button>
        ))}
      </div>

      <section className="staff-panel staff-all-submissions">
        <div className="staff-panel-heading">
          <h2>Seluruh Pengajuan · {filteredSubmissions.length}</h2>
          {selectedIds.length > 0 && <span className="staff-selected-count">{selectedIds.length} dipilih</span>}
        </div>
        <div className="staff-table-wrap">
          <table className="staff-submission-table staff-all-submissions-table">
            <thead><tr>
              <th><input type="checkbox" aria-label="Pilih semua pada halaman ini" checked={allVisibleSelected} onChange={toggleVisibleSelection} /></th>
              <th>Nomor Pengajuan</th><th>Mahasiswa / NIM</th><th>Jenis Surat</th><th>Tanggal Masuk</th><th>Status</th><th>Aksi</th>
            </tr></thead>
            <tbody>
              {visibleSubmissions.map((submission) => (
                <tr key={submission.id}>
                  <td><input type="checkbox" aria-label={`Pilih ${submission.id}`} checked={selectedIds.includes(submission.id)} onChange={() => setSelectedIds((current) => current.includes(submission.id) ? current.filter((id) => id !== submission.id) : [...current, submission.id])} /></td>
                  <td>{submission.id}</td>
                  <td><strong>{submission.name}</strong><span>{submission.nim}</span></td>
                  <td>{submission.service}</td>
                  <td>{submission.date}</td>
                  <td><span className={`staff-submission-status status-${statusSlug(submission.status)}`}>{submission.status === 'Diajukan' && <Send size={11} />}{submission.status}</span></td>
                  <td><button type="button" className="staff-review-button" onClick={() => onReview(submission)}><LogOut size={13} /> Periksa</button></td>
                </tr>
              ))}
              {visibleSubmissions.length === 0 && <tr><td className="staff-empty-results" colSpan="7">Tidak ada pengajuan yang cocok dengan filter ini.</td></tr>}
            </tbody>
          </table>
        </div>
        {selectedSubmission && <div className="staff-review-panel" role="status"><CheckCircle2 size={17} /><span><strong>{selectedSubmission.id}</strong> · {selectedSubmission.name} — {selectedSubmission.service}</span><button type="button" onClick={onCloseReview} aria-label="Tutup detail"><X size={15} /></button></div>}
        <div className="staff-pagination">
          <span>Menampilkan {filteredSubmissions.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filteredSubmissions.length)} dari {filteredSubmissions.length} data</span>
          <div>
            <button type="button" aria-label="Halaman sebelumnya" disabled={currentPage === 1} onClick={() => setPage((current) => current - 1)}><ChevronLeft size={15} /></button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
              <button type="button" className={currentPage === pageNumber ? 'current' : ''} aria-current={currentPage === pageNumber ? 'page' : undefined} key={pageNumber} onClick={() => setPage(pageNumber)}>{pageNumber}</button>
            ))}
            <button type="button" aria-label="Halaman selanjutnya" disabled={currentPage === pageCount} onClick={() => setPage((current) => current + 1)}><ChevronRight size={15} /></button>
          </div>
        </div>
      </section>
    </>
  )
}

function StaffDraftPage() {
  const [drafts, setDrafts] = useState(initialStaffDrafts)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [serviceFilter, setServiceFilter] = useState('')
  const [activeTab, setActiveTab] = useState('Semua Draf')
  const [page, setPage] = useState(1)
  const [editingDraft, setEditingDraft] = useState(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftContent, setDraftContent] = useState('')
  const [editorError, setEditorError] = useState('')
  const [notice, setNotice] = useState('')
  const pageSize = 5

  const filteredDrafts = drafts
    .filter((draft) => !statusFilter || draft.draftStatus === statusFilter)
    .filter((draft) => !serviceFilter || draft.service === serviceFilter)
    .filter((draft) => activeTab === 'Semua Draf' || draft.draftStatus === activeTab)
    .filter((draft) => `${draft.id} ${draft.name} ${draft.nim} ${draft.service}`.toLowerCase().includes(search.trim().toLowerCase()))

  const pageCount = Math.max(1, Math.ceil(filteredDrafts.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const visibleDrafts = filteredDrafts.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const draftCounts = drafts.reduce((counts, draft) => {
    counts[draft.draftStatus] += 1
    return counts
  }, { 'Belum Dibuat': 0, 'Draf Dibuat': 0, 'Dikembalikan untuk Revisi': 0 })

  const openEditor = (draft) => {
    setEditingDraft(draft)
    setDraftTitle(draft.draftTitle || `Surat ${draft.service}`)
    setDraftContent(draft.draftContent || `Dengan ini menerangkan bahwa ${draft.name}, NIM ${draft.nim}, mengajukan layanan ${draft.service}. Draf surat ini perlu diperiksa dan disesuaikan sebelum diteruskan.`)
    setEditorError('')
  }

  const saveDraft = (event) => {
    event.preventDefault()
    if (!draftTitle.trim() || !draftContent.trim()) {
      setEditorError('Judul dan isi draf wajib diisi.')
      return
    }

    setDrafts((current) => current.map((draft) => draft.id === editingDraft.id
      ? { ...draft, draftStatus: 'Draf Dibuat', draftTitle: draftTitle.trim(), draftContent: draftContent.trim() }
      : draft))
    setNotice(`Draf ${editingDraft.id} tersimpan sementara di halaman ini.`)
    setEditingDraft(null)
    setActiveTab('Semua Draf')
    setStatusFilter('')
    setPage(1)
  }

  return (
    <>
      <div className="staff-drafts-heading">
        <div className="staff-breadcrumb">Layanan Kemahasiswaan FTI <span>/</span> Draf Surat</div>
        <h1>Draf Surat</h1>
        <p>Susun draf dari pengajuan yang telah diverifikasi, lalu teruskan kepada Kepala Kantor untuk pemeriksaan.</p>
      </div>

      {notice && <div className="staff-notice success staff-draft-notice" role="status"><CheckCircle2 size={16} /><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Tutup notifikasi"><X size={15} /></button></div>}

      <section className="staff-panel staff-draft-filters" aria-label="Filter draf surat">
        <label className="staff-draft-search" htmlFor="staff-draft-search">
          <span>Cari pengajuan terverifikasi</span>
          <span className="staff-search-control"><input id="staff-draft-search" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Cari nama atau nomor pengajuan" /><Search size={16} /></span>
        </label>
        <label className="staff-filter-field" htmlFor="staff-draft-status">
          <span>Status Draf</span>
          <select id="staff-draft-status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1) }}>
            <option value="">Semua status draf</option>
            {draftStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
        <label className="staff-filter-field" htmlFor="staff-draft-service">
          <span>Jenis Surat</span>
          <select id="staff-draft-service" value={serviceFilter} onChange={(event) => { setServiceFilter(event.target.value); setPage(1) }}>
            <option value="">Semua jenis surat</option>
            {submissionServices.map((service) => <option key={service} value={service}>{service}</option>)}
          </select>
        </label>
      </section>

      <div className="staff-draft-tabs" role="tablist" aria-label="Filter status draf">
        {['Semua Draf', ...draftStatuses].map((tab) => (
          <button type="button" role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? 'active' : ''} key={tab} onClick={() => { setActiveTab(tab); setStatusFilter(''); setPage(1) }}>{tab}</button>
        ))}
      </div>

      <section className="staff-panel staff-draft-table-panel">
        <div className="staff-draft-table-heading">
          <div>
            <h2>Pengajuan Terverifikasi · {filteredDrafts.length}</h2>
            <p>{draftCounts['Belum Dibuat']} draf belum dibuat · {draftCounts['Draf Dibuat']} draf tersimpan · {draftCounts['Dikembalikan untuk Revisi']} dikembalikan untuk revisi</p>
          </div>
        </div>
        <div className="staff-table-wrap">
          <table className="staff-submission-table staff-draft-table">
            <thead><tr><th>Nomor Pengajuan</th><th>Mahasiswa / NIM</th><th>Jenis Surat</th><th>Tanggal Masuk</th><th>Status Draf</th><th>Aksi</th></tr></thead>
            <tbody>
              {visibleDrafts.map((draft) => (
                <tr key={draft.id}>
                  <td>{draft.id}</td>
                  <td><strong>{draft.name}</strong><span>{draft.nim}</span></td>
                  <td>{draft.service}</td>
                  <td>{draft.date}</td>
                  <td><span className={`staff-draft-status status-${draft.draftStatus.toLowerCase().replace(/\s+/g, '-')}`}>{draft.draftStatus}</span></td>
                  <td><button type="button" className="staff-review-button" onClick={() => openEditor(draft)}><LogOut size={13} /> {draft.draftStatus === 'Belum Dibuat' ? 'Buat Draf' : 'Edit Draf'}</button></td>
                </tr>
              ))}
              {visibleDrafts.length === 0 && <tr><td className="staff-empty-results" colSpan="6">Tidak ada pengajuan yang cocok dengan filter draf ini.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="staff-pagination">
          <span>Menampilkan {filteredDrafts.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filteredDrafts.length)} dari {filteredDrafts.length} data</span>
          <div>
            <button type="button" aria-label="Halaman sebelumnya" disabled={currentPage === 1} onClick={() => setPage((current) => current - 1)}><ChevronLeft size={15} /></button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
              <button type="button" className={currentPage === pageNumber ? 'current' : ''} aria-current={currentPage === pageNumber ? 'page' : undefined} key={pageNumber} onClick={() => setPage(pageNumber)}>{pageNumber}</button>
            ))}
            <button type="button" aria-label="Halaman selanjutnya" disabled={currentPage === pageCount} onClick={() => setPage((current) => current + 1)}><ChevronRight size={15} /></button>
          </div>
        </div>
      </section>

      {editingDraft && (
        <div className="staff-editor-overlay">
          <section className="staff-draft-editor" role="dialog" aria-modal="true" aria-labelledby="staff-draft-editor-title">
            <header><div><span>EDITOR DRAF SURAT</span><h2 id="staff-draft-editor-title">{editingDraft.draftStatus === 'Belum Dibuat' ? 'Buat Draf Surat' : 'Edit Draf Surat'}</h2></div><button type="button" onClick={() => setEditingDraft(null)} aria-label="Tutup editor"><X size={18} /></button></header>
            <div className="staff-editor-applicant"><strong>{editingDraft.name}</strong><span>{editingDraft.id} · {editingDraft.nim} · {editingDraft.service}</span></div>
            <form onSubmit={saveDraft}>
              <label htmlFor="staff-draft-title">Judul Surat</label>
              <input id="staff-draft-title" value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} />
              <label htmlFor="staff-draft-content">Isi Draf</label>
              <textarea id="staff-draft-content" rows="8" value={draftContent} onChange={(event) => setDraftContent(event.target.value)} />
              {editorError && <p className="staff-editor-error" role="alert">{editorError}</p>}
              <p className="staff-editor-note">Draf disimpan sementara di halaman ini dan belum dikirim ke Kepala Kantor.</p>
              <div className="staff-editor-actions"><button type="button" className="staff-editor-cancel" onClick={() => setEditingDraft(null)}>Batal</button><button type="submit" className="staff-editor-save">Simpan Draf</button></div>
            </form>
          </section>
        </div>
      )}
    </>
  )
}

function StaffArchivePage() {
  const [archives] = useState(initialStaffArchives)
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('2026-10-01')
  const [endDate, setEndDate] = useState('2026-10-23')
  const [page, setPage] = useState(1)
  const [selectedArchive, setSelectedArchive] = useState(null)
  const [notice, setNotice] = useState('')
  const pageSize = 5

  const filteredArchives = archives
    .filter((archive) => !startDate || archive.dateValue >= startDate)
    .filter((archive) => !endDate || archive.dateValue <= endDate)
    .filter((archive) => `${archive.archiveNumber} ${archive.name} ${archive.nim} ${archive.service}`.toLowerCase().includes(search.trim().toLowerCase()))

  const pageCount = Math.max(1, Math.ceil(filteredArchives.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const visibleArchives = filteredArchives.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const paginationItems = pageCount <= 5
    ? Array.from({ length: pageCount }, (_, index) => index + 1)
    : currentPage <= 3
      ? [1, 2, 3, 'gap', pageCount]
      : currentPage >= pageCount - 2
        ? [1, 'gap', pageCount - 2, pageCount - 1, pageCount]
        : [1, 'gap', currentPage - 1, currentPage, currentPage + 1, 'gap-end', pageCount]

  const downloadArchive = (archive) => {
    const contents = [
      'DOKUMEN DEMO - BUKAN SURAT RESMI',
      '',
      `Nomor Surat: ${archive.archiveNumber}`,
      `Nama: ${archive.name}`,
      `NIM: ${archive.nim}`,
      `Jenis Surat: ${archive.service}`,
      `Tanggal Terbit: ${archive.publishedDate}`,
      `Status: ${archive.status}`,
      '',
      'Data arsip contoh. File PDF resmi belum terhubung ke aplikasi.',
    ].join('\n')
    const fileUrl = URL.createObjectURL(new Blob([contents], { type: 'text/plain;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = `${archive.archiveNumber.replace(/[^a-zA-Z0-9-]/g, '_')}.txt`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1000)
    setNotice(`Ringkasan demo ${archive.archiveNumber} berhasil diunduh. PDF resmi belum tersedia.`)
  }

  return (
    <>
      <div className="staff-archives-heading">
        <div className="staff-breadcrumb">Layanan Kemahasiswaan FTI <span>/</span> Arsip Surat</div>
        <h1>Arsip Surat</h1>
        <p>Surat yang telah diterbitkan setelah Persetujuan Elektronik akhir oleh Dekan.</p>
      </div>

      {notice && <div className="staff-notice success staff-archive-notice" role="status"><CheckCircle2 size={16} /><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Tutup notifikasi"><X size={15} /></button></div>}

      <section className="staff-archive-filters" aria-label="Filter arsip surat">
        <label className="staff-archive-search" htmlFor="staff-archive-search">
          <span>Cari arsip surat</span>
          <span className="staff-archive-search-control"><input id="staff-archive-search" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Cari nomor surat, nama mahasiswa, atau NIM" /><Search size={16} /></span>
        </label>
        <label className="staff-archive-date" htmlFor="staff-archive-start">
          <span>Tanggal terbit mulai</span>
          <span className="staff-archive-date-control"><input id="staff-archive-start" type="date" value={startDate} max={endDate || undefined} onChange={(event) => { setStartDate(event.target.value); setPage(1) }} /><CalendarDays size={15} /></span>
        </label>
        <label className="staff-archive-date" htmlFor="staff-archive-end">
          <span>Tanggal terbit sampai</span>
          <span className="staff-archive-date-control"><input id="staff-archive-end" type="date" value={endDate} min={startDate || undefined} onChange={(event) => { setEndDate(event.target.value); setPage(1) }} /><CalendarDays size={15} /></span>
        </label>
      </section>

      <section className="staff-panel staff-archive-panel">
        <div className="staff-archive-panel-heading">
          <div>
            <h2>Surat Terbit · {filteredArchives.length}</h2>
            <p>Unduh surat resmi atau lihat Kode Verifikasi (QR) untuk memeriksa keaslian dokumen.</p>
          </div>
        </div>
        <div className="staff-table-wrap">
          <table className="staff-submission-table staff-archive-table">
            <thead><tr><th>Nomor Surat</th><th>Mahasiswa / NIM <span aria-hidden="true">↕</span></th><th>Jenis Surat <span aria-hidden="true">↕</span></th><th>Tanggal Terbit <span aria-hidden="true">↕</span></th><th>Status <span aria-hidden="true">↕</span></th><th>Aksi</th></tr></thead>
            <tbody>
              {visibleArchives.map((archive) => (
                <tr key={archive.archiveNumber}>
                  <td>{archive.archiveNumber}</td>
                  <td><strong>{archive.name}</strong><span>{archive.nim}</span></td>
                  <td>{archive.service}</td>
                  <td>{archive.publishedDate}</td>
                  <td><span className="staff-archive-status"><Check size={11} /> {archive.status}</span></td>
                  <td>
                    <div className="staff-archive-actions">
                      <button type="button" className="staff-archive-view" onClick={() => setSelectedArchive(archive)}><ExternalLink size={13} /> Lihat</button>
                      <button type="button" className="staff-archive-download" onClick={() => downloadArchive(archive)}><Download size={13} /> Unduh</button>
                    </div>
                  </td>
                </tr>
              ))}
              {visibleArchives.length === 0 && <tr><td className="staff-empty-results" colSpan="6">Tidak ada arsip yang sesuai dengan pencarian dan rentang tanggal.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="staff-pagination staff-archive-pagination">
          <span>Menampilkan {filteredArchives.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filteredArchives.length)} dari {filteredArchives.length} data</span>
          <div>
            <button type="button" aria-label="Halaman sebelumnya" disabled={currentPage === 1} onClick={() => setPage((current) => current - 1)}><ChevronLeft size={15} /></button>
            {paginationItems.map((item, index) => item === 'gap' || item === 'gap-end'
              ? <span className="staff-pagination-gap" key={`${item}-${index}`}>…</span>
              : <button type="button" className={currentPage === item ? 'current' : ''} aria-current={currentPage === item ? 'page' : undefined} key={item} onClick={() => setPage(item)}>{item}</button>)}
            <button type="button" aria-label="Halaman selanjutnya" disabled={currentPage === pageCount} onClick={() => setPage((current) => current + 1)}><ChevronRight size={15} /></button>
          </div>
        </div>
        <p className="staff-archive-footnote"><LockKeyhole size={12} /> Data arsip saat ini adalah contoh. File PDF resmi dan QR verifikasi belum terhubung ke backend.</p>
      </section>

      {selectedArchive && (
        <div className="staff-editor-overlay">
          <section className="staff-archive-preview" role="dialog" aria-modal="true" aria-labelledby="staff-archive-preview-title">
            <header><div><span>PREVIEW ARSIP SURAT</span><h2 id="staff-archive-preview-title">Detail Surat Terbit</h2></div><button type="button" onClick={() => setSelectedArchive(null)} aria-label="Tutup preview"><X size={18} /></button></header>
            <div className="staff-archive-paper">
              <span className="staff-archive-demo-stamp">CONTOH</span>
              <div className="staff-archive-paper-brand">UNIVERSITAS ANDALAS<br /><strong>FAKULTAS TEKNOLOGI INFORMASI</strong></div>
              <div className="staff-archive-paper-rule" />
              <h3>{selectedArchive.service}</h3>
              <p>Nomor: {selectedArchive.archiveNumber}</p>
              <p>Surat ini menerangkan bahwa <strong>{selectedArchive.name}</strong> (NIM {selectedArchive.nim}) tercatat pada layanan {selectedArchive.service}.</p>
              <p>Diterbitkan pada {selectedArchive.publishedDate}.</p>
              <div className="staff-archive-verification"><LockKeyhole size={14} /><span>Kode verifikasi dan file PDF resmi tersedia setelah arsip terhubung ke backend.</span></div>
            </div>
            <footer><button type="button" className="staff-editor-cancel" onClick={() => setSelectedArchive(null)}>Tutup</button><button type="button" className="staff-editor-save" onClick={() => downloadArchive(selectedArchive)}><Download size={14} /> Unduh Ringkasan Demo</button></footer>
          </section>
        </div>
      )}
    </>
  )
}

function StaffServiceTemplatePage() {
  const [services, setServices] = useState(initialStaffServices)
  const [templates, setTemplates] = useState(initialStaffTemplates)
  const [activeTab, setActiveTab] = useState('services')
  const [serviceSearch, setServiceSearch] = useState('')
  const [templateSearch, setTemplateSearch] = useState('')
  const [serviceEditor, setServiceEditor] = useState(null)
  const [templateEditor, setTemplateEditor] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [previewTemplate, setPreviewTemplate] = useState(null)
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const updatedToday = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())

  const filteredServices = services.filter((service) => {
    const templateName = templates.find((template) => template.id === service.templateId)?.name || ''
    return `${service.name} ${service.code} ${templateName}`.toLowerCase().includes(serviceSearch.trim().toLowerCase())
  })
  const filteredTemplates = templates.filter((template) => {
    const linkedService = services.find((service) => service.templateId === template.id)?.name || ''
    return `${template.id} ${template.name} ${linkedService}`.toLowerCase().includes(templateSearch.trim().toLowerCase())
  })
  const activeServiceCount = services.filter((service) => service.active).length

  const openServiceEditor = (service = null) => {
    setFormError('')
    let nextCodeNumber = services.length + 1
    while (services.some((item) => item.code === `LYN-${String(nextCodeNumber).padStart(2, '0')}`)) nextCodeNumber += 1
    setServiceEditor(service
      ? { ...service, documentsText: service.documents.join('\n') }
      : {
          id: '',
          code: `LYN-${String(nextCodeNumber).padStart(2, '0')}`,
          name: '',
          templateId: '',
          documentsText: 'Dokumen wajib 1\nDokumen wajib 2',
          active: true,
        })
  }

  const saveService = (event) => {
    event.preventDefault()
    const name = serviceEditor.name.trim()
    const code = serviceEditor.code.trim().toUpperCase()
    const documents = serviceEditor.documentsText.split('\n').map((document) => document.trim()).filter(Boolean)

    if (!name || !code || !documents.length) {
      setFormError('Nama layanan, kode layanan, dan minimal satu dokumen wajib diisi.')
      return
    }
    if (services.some((service) => service.code.toUpperCase() === code && service.id !== serviceEditor.id)) {
      setFormError('Kode layanan sudah digunakan. Gunakan kode yang berbeda.')
      return
    }

    const savedService = {
      ...serviceEditor,
      id: serviceEditor.id || code,
      code,
      name,
      documents,
      updated: updatedToday,
    }
    setServices((current) => {
      const next = current.map((service) => {
        if (service.id === savedService.id) return savedService
        if (savedService.templateId && service.templateId === savedService.templateId) return { ...service, templateId: '' }
        return service
      })
      return current.some((service) => service.id === savedService.id) ? next : [...next, savedService]
    })
    if (savedService.templateId) {
      setTemplates((current) => current.map((template) => template.id === savedService.templateId ? { ...template, updated: updatedToday } : template))
    }
    setNotice(`Layanan ${name} tersimpan sementara.`)
    setServiceEditor(null)
  }

  const openTemplateEditor = (template = null) => {
    setFormError('')
    setTemplateEditor(template
      ? { ...template, serviceId: services.find((service) => service.templateId === template.id)?.id || '' }
      : {
          id: '',
          name: '',
          serviceId: '',
          content: 'JUDUL SURAT\nNomor: [NOMOR SURAT]\n\nMenerangkan bahwa [NAMA MAHASISWA] dengan NIM [NIM] ...',
          active: true,
        })
  }

  const saveTemplate = (event) => {
    event.preventDefault()
    const name = templateEditor.name.trim()
    const content = templateEditor.content.trim()
    if (!name || !content) {
      setFormError('Nama template dan isi template wajib diisi.')
      return
    }

    let nextTemplateNumber = templates.length + 1
    while (!templateEditor.id && templates.some((template) => template.id === `TPL-${String(nextTemplateNumber).padStart(2, '0')}`)) nextTemplateNumber += 1
    const templateId = templateEditor.id || `TPL-${String(nextTemplateNumber).padStart(2, '0')}`
    const savedTemplate = { ...templateEditor, id: templateId, name, content, updated: updatedToday }
    setTemplates((current) => {
      const exists = current.some((template) => template.id === templateId)
      return exists
        ? current.map((template) => template.id === templateId ? savedTemplate : template)
        : [...current, savedTemplate]
    })
    setServices((current) => current.map((service) => {
      if (service.templateId === templateId && service.id !== templateEditor.serviceId) return { ...service, templateId: '' }
      if (service.id === templateEditor.serviceId) return { ...service, templateId, updated: updatedToday }
      return service
    }))
    setNotice(`Template ${name} tersimpan sementara.`)
    setTemplateEditor(null)
  }

  const toggleService = (serviceId) => {
    setServices((current) => current.map((service) => service.id === serviceId
      ? { ...service, active: !service.active, updated: updatedToday }
      : service))
  }

  const confirmDelete = () => {
    if (deleteTarget.kind === 'service') {
      setServices((current) => current.filter((service) => service.id !== deleteTarget.item.id))
      setNotice(`Layanan ${deleteTarget.item.name} dihapus dari data contoh.`)
    } else {
      setTemplates((current) => current.filter((template) => template.id !== deleteTarget.item.id))
      setServices((current) => current.map((service) => service.templateId === deleteTarget.item.id
        ? { ...service, templateId: '', updated: updatedToday }
        : service))
      setNotice(`Template ${deleteTarget.item.name} dihapus dari data contoh.`)
    }
    setDeleteTarget(null)
  }

  return (
    <>
      <div className="staff-service-config-heading">
        <div className="staff-breadcrumb">Layanan Kemahasiswaan FTI <span>/</span> Jenis Layanan &amp; Template</div>
        <h1>Jenis Layanan &amp; Template</h1>
        <p>Kelola layanan mahasiswa, persyaratan dokumen, dan template surat fakultas.</p>
      </div>

      {notice && <div className="staff-notice success staff-service-notice" role="status"><CheckCircle2 size={16} /><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Tutup notifikasi"><X size={15} /></button></div>}

      <div className="staff-service-tabs" role="tablist" aria-label="Pengaturan layanan dan template">
        <button type="button" role="tab" aria-selected={activeTab === 'services'} className={activeTab === 'services' ? 'active' : ''} onClick={() => setActiveTab('services')}>Jenis Layanan</button>
        <button type="button" role="tab" aria-selected={activeTab === 'templates'} className={activeTab === 'templates' ? 'active' : ''} onClick={() => setActiveTab('templates')}>Template Surat</button>
      </div>

      <div className="staff-service-toolbar">
        <label htmlFor="staff-service-search">
          <span>{activeTab === 'services' ? 'Cari jenis layanan' : 'Cari template surat'}</span>
          <span className="staff-service-search-control">
            <input id="staff-service-search" type="search" value={activeTab === 'services' ? serviceSearch : templateSearch} onChange={(event) => activeTab === 'services' ? setServiceSearch(event.target.value) : setTemplateSearch(event.target.value)} placeholder={activeTab === 'services' ? 'Nama atau kode layanan' : 'Nama template atau layanan'} />
            <Search size={16} />
          </span>
        </label>
        <button type="button" className="staff-service-add-button" onClick={() => activeTab === 'services' ? openServiceEditor() : openTemplateEditor()}><Plus size={15} /> Tambah {activeTab === 'services' ? 'Layanan' : 'Template'}</button>
      </div>

      {activeTab === 'services' ? (
        <section className="staff-panel staff-service-config-panel">
          <div className="staff-service-panel-heading">
            <div>
              <h2>Jenis Layanan · {filteredServices.length} layanan</h2>
              <p>Perubahan persyaratan hanya berlaku untuk pengajuan baru. Template aktif tetap disimpan dalam arsip versi.</p>
            </div>
          </div>
          <div className="staff-table-wrap">
            <table className="staff-service-config-table">
              <thead><tr><th>Layanan / Kode</th><th>Template Surat</th><th>Diperbarui</th><th>Status Layanan</th><th>Aksi</th></tr></thead>
              <tbody>
                {filteredServices.map((service) => {
                  const template = templates.find((item) => item.id === service.templateId)
                  return (
                    <tr key={service.id}>
                      <td><strong>{service.name}</strong><span>{service.code} · {service.documents.length} dokumen wajib</span></td>
                      <td>{template?.name || 'Belum ada template'}</td>
                      <td>{service.updated}</td>
                      <td>
                        <div className="staff-service-state">
                          <button type="button" role="switch" aria-checked={service.active} aria-label={`${service.active ? 'Nonaktifkan' : 'Aktifkan'} layanan ${service.name}`} className={`staff-switch${service.active ? ' on' : ''}`} onClick={() => toggleService(service.id)}><i /></button>
                          <span>{service.active ? 'Aktif' : 'Nonaktif'}</span>
                        </div>
                        <small className="staff-service-state-note">{service.active ? 'Menerima pengajuan' : 'Pengajuan ditutup'}</small>
                      </td>
                      <td><div className="staff-service-row-actions"><button type="button" className="staff-service-edit" onClick={() => openServiceEditor(service)}><Pencil size={13} /> Edit</button><button type="button" className="staff-service-delete" onClick={() => setDeleteTarget({ kind: 'service', item: service })}><LogOut size={13} /> Hapus</button></div></td>
                    </tr>
                  )
                })}
                {filteredServices.length === 0 && <tr><td className="staff-empty-results" colSpan="5">Tidak ada jenis layanan yang cocok dengan pencarian.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="staff-service-config-footnote">{activeServiceCount} dari {services.length} layanan aktif · Terakhir diperbarui oleh Staf Akademik Contoh. Data ini masih contoh dan belum mengubah layanan pada halaman mahasiswa.</p>
        </section>
      ) : (
        <section className="staff-panel staff-service-config-panel">
          <div className="staff-service-panel-heading">
            <div>
              <h2>Template Surat · {filteredTemplates.length} template</h2>
              <p>Kelola konten template surat yang digunakan sebagai contoh pada proses penerbitan.</p>
            </div>
          </div>
          <div className="staff-table-wrap">
            <table className="staff-service-config-table staff-template-config-table">
              <thead><tr><th>Template / Kode</th><th>Jenis Layanan</th><th>Diperbarui</th><th>Status Template</th><th>Aksi</th></tr></thead>
              <tbody>
                {filteredTemplates.map((template) => {
                  const linkedService = services.find((service) => service.templateId === template.id)
                  return (
                    <tr key={template.id}>
                      <td><strong>{template.name}</strong><span>{template.id} · versi contoh</span></td>
                      <td>{linkedService?.name || 'Belum ditautkan'}</td>
                      <td>{template.updated}</td>
                      <td><span className={`staff-template-status${template.active ? '' : ' inactive'}`}>{template.active ? 'Aktif' : 'Nonaktif'}</span></td>
                      <td><div className="staff-service-row-actions"><button type="button" className="staff-template-view" onClick={() => setPreviewTemplate(template)}><Eye size={13} /> Lihat</button><button type="button" className="staff-service-edit" onClick={() => openTemplateEditor(template)}><Pencil size={13} /> Edit</button><button type="button" className="staff-service-delete" onClick={() => setDeleteTarget({ kind: 'template', item: template })}><LogOut size={13} /> Hapus</button></div></td>
                    </tr>
                  )
                })}
                {filteredTemplates.length === 0 && <tr><td className="staff-empty-results" colSpan="5">Tidak ada template surat yang cocok dengan pencarian.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="staff-service-config-footnote">{templates.filter((template) => template.active).length} template aktif · Data template masih contoh dan belum terhubung ke proses penerbitan surat.</p>
        </section>
      )}

      {serviceEditor && (
        <div className="staff-editor-overlay">
          <section className="staff-config-editor" role="dialog" aria-modal="true" aria-labelledby="staff-service-editor-title">
            <header><div><span>PENGELOLAAN LAYANAN</span><h2 id="staff-service-editor-title">{serviceEditor.id ? 'Edit Jenis Layanan' : 'Tambah Jenis Layanan'}</h2></div><button type="button" onClick={() => setServiceEditor(null)} aria-label="Tutup form layanan"><X size={18} /></button></header>
            <form onSubmit={saveService}>
              <label htmlFor="staff-service-name">Nama layanan</label>
              <input id="staff-service-name" value={serviceEditor.name} onChange={(event) => setServiceEditor((current) => ({ ...current, name: event.target.value }))} autoFocus />
              <label htmlFor="staff-service-code">Kode layanan</label>
              <input id="staff-service-code" value={serviceEditor.code} onChange={(event) => setServiceEditor((current) => ({ ...current, code: event.target.value }))} />
              <label htmlFor="staff-service-template">Template surat</label>
              <select id="staff-service-template" value={serviceEditor.templateId} onChange={(event) => setServiceEditor((current) => ({ ...current, templateId: event.target.value }))}>
                <option value="">Belum ada template</option>
                {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
              </select>
              <label htmlFor="staff-service-documents">Dokumen wajib (satu dokumen per baris)</label>
              <textarea id="staff-service-documents" rows="5" value={serviceEditor.documentsText} onChange={(event) => setServiceEditor((current) => ({ ...current, documentsText: event.target.value }))} />
              <p className="staff-config-helper">Persyaratan pada halaman ini adalah contoh dan belum mengubah formulir pengajuan mahasiswa.</p>
              {formError && <p className="staff-editor-error" role="alert">{formError}</p>}
              <div className="staff-editor-actions"><button type="button" className="staff-editor-cancel" onClick={() => setServiceEditor(null)}>Batal</button><button type="submit" className="staff-editor-save">Simpan Layanan</button></div>
            </form>
          </section>
        </div>
      )}

      {templateEditor && (
        <div className="staff-editor-overlay">
          <section className="staff-config-editor" role="dialog" aria-modal="true" aria-labelledby="staff-template-editor-title">
            <header><div><span>PENGELOLAAN TEMPLATE</span><h2 id="staff-template-editor-title">{templateEditor.id ? 'Edit Template Surat' : 'Tambah Template Surat'}</h2></div><button type="button" onClick={() => setTemplateEditor(null)} aria-label="Tutup form template"><X size={18} /></button></header>
            <form onSubmit={saveTemplate}>
              <label htmlFor="staff-template-name">Nama template</label>
              <input id="staff-template-name" value={templateEditor.name} onChange={(event) => setTemplateEditor((current) => ({ ...current, name: event.target.value }))} autoFocus />
              <label htmlFor="staff-template-service">Tautkan ke layanan</label>
              <select id="staff-template-service" value={templateEditor.serviceId} onChange={(event) => setTemplateEditor((current) => ({ ...current, serviceId: event.target.value }))}>
                <option value="">Belum ditautkan</option>
                {services.map((service) => <option key={service.id} value={service.id}>{service.name} ({service.code})</option>)}
              </select>
              <label htmlFor="staff-template-content">Isi template contoh</label>
              <textarea id="staff-template-content" rows="8" value={templateEditor.content} onChange={(event) => setTemplateEditor((current) => ({ ...current, content: event.target.value }))} />
              <p className="staff-config-helper">Template ini hanya tersimpan sementara di halaman pengelolaan dan belum digunakan untuk menerbitkan surat.</p>
              {formError && <p className="staff-editor-error" role="alert">{formError}</p>}
              <div className="staff-editor-actions"><button type="button" className="staff-editor-cancel" onClick={() => setTemplateEditor(null)}>Batal</button><button type="submit" className="staff-editor-save">Simpan Template</button></div>
            </form>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div className="staff-editor-overlay">
          <section className="staff-config-delete" role="alertdialog" aria-modal="true" aria-labelledby="staff-config-delete-title">
            <span className="staff-config-delete-icon"><Trash2 size={17} /></span>
            <h2 id="staff-config-delete-title">Hapus {deleteTarget.kind === 'service' ? 'layanan' : 'template'}?</h2>
            <p><strong>{deleteTarget.item.name}</strong> akan dihapus dari data contoh. Tindakan ini tidak memengaruhi halaman mahasiswa.</p>
            <div className="staff-editor-actions"><button type="button" className="staff-editor-cancel" onClick={() => setDeleteTarget(null)}>Batal</button><button type="button" className="staff-config-delete-confirm" onClick={confirmDelete}>Hapus</button></div>
          </section>
        </div>
      )}

      {previewTemplate && (
        <div className="staff-editor-overlay">
          <section className="staff-config-editor staff-template-preview" role="dialog" aria-modal="true" aria-labelledby="staff-template-preview-title">
            <header><div><span>PREVIEW TEMPLATE</span><h2 id="staff-template-preview-title">{previewTemplate.name}</h2></div><button type="button" onClick={() => setPreviewTemplate(null)} aria-label="Tutup preview template"><X size={18} /></button></header>
            <pre>{previewTemplate.content}</pre>
            <p className="staff-config-helper">Preview data contoh · versi {previewTemplate.id}</p>
            <div className="staff-editor-actions"><button type="button" className="staff-editor-cancel" onClick={() => setPreviewTemplate(null)}>Tutup</button><button type="button" className="staff-editor-save" onClick={() => { setPreviewTemplate(null); openTemplateEditor(previewTemplate) }}><Pencil size={13} /> Edit Template</button></div>
          </section>
        </div>
      )}
    </>
  )
}

function StaffReportsPage() {
  const [startDate, setStartDate] = useState('2026-10-01')
  const [endDate, setEndDate] = useState('2026-10-23')
  const [serviceFilter, setServiceFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [exportFormat, setExportFormat] = useState('excel')
  const [notice, setNotice] = useState('')
  const periods = [
    { label: '1–7 Okt', start: '2026-10-01', end: '2026-10-07' },
    { label: '8–14 Okt', start: '2026-10-08', end: '2026-10-14' },
    { label: '15–21 Okt', start: '2026-10-15', end: '2026-10-21' },
    { label: '22–23 Okt', start: '2026-10-22', end: '2026-10-23' },
  ]

  const filteredRecords = initialReportRecords.filter((record) =>
    (!startDate || record.dateValue >= startDate)
    && (!endDate || record.dateValue <= endDate)
    && (!serviceFilter || record.service === serviceFilter)
    && (!statusFilter || record.status === statusFilter))
  const completedRecords = filteredRecords.filter((record) => record.status === 'Selesai')
  const processingCount = filteredRecords.filter((record) => record.status === 'Diproses').length
  const rejectedCount = filteredRecords.filter((record) => record.status === 'Ditolak').length
  const averageDays = completedRecords.length
    ? (completedRecords.reduce((total, record) => total + record.turnaroundDays, 0) / completedRecords.length).toFixed(1)
    : '—'
  const completedPercent = filteredRecords.length ? (completedRecords.length / filteredRecords.length) * 100 : 0
  const processingPercent = filteredRecords.length ? (processingCount / filteredRecords.length) * 100 : 0
  const rejectedPercent = filteredRecords.length ? (rejectedCount / filteredRecords.length) * 100 : 0
  const visibleServices = reportServiceSeeds.filter((service) => !serviceFilter || service.name === serviceFilter)
  const serviceRows = visibleServices.map((service) => {
    const records = filteredRecords.filter((record) => record.service === service.name)
    return {
      name: service.name,
      total: records.length,
      completed: records.filter((record) => record.status === 'Selesai').length,
      processing: records.filter((record) => record.status === 'Diproses').length,
      rejected: records.filter((record) => record.status === 'Ditolak').length,
    }
  })
  const maxServiceCount = Math.max(1, ...serviceRows.map((service) => service.total))
  const trendRows = periods.map((period) => {
    const records = filteredRecords.filter((record) => record.dateValue >= period.start && record.dateValue <= period.end)
    return {
      ...period,
      incoming: records.length,
      completed: records.filter((record) => record.status === 'Selesai').length,
    }
  })
  const maxTrendCount = Math.max(1, ...trendRows.map((period) => Math.max(period.incoming, period.completed)))
  const chartX = [30, 130, 230, 330]
  const chartY = (value) => 118 - (value / maxTrendCount) * 100
  const incomingPoints = trendRows.map((period, index) => `${chartX[index]},${chartY(period.incoming)}`).join(' ')
  const completedPoints = trendRows.map((period, index) => `${chartX[index]},${chartY(period.completed)}`).join(' ')
  const distributionStyle = filteredRecords.length
    ? { background: `conic-gradient(#146e3a 0deg ${completedPercent * 3.6}deg, #7185a3 ${completedPercent * 3.6}deg ${(completedPercent + processingPercent) * 3.6}deg, #d9533f ${(completedPercent + processingPercent) * 3.6}deg 360deg)` }
    : { background: 'conic-gradient(#e7edf1 0deg 360deg)' }

  const handleExport = () => {
    if (exportFormat === 'pdf') {
      setNotice('Pilih “Simpan sebagai PDF” pada dialog cetak browser untuk mengunduh laporan.')
      window.print()
      return
    }

    const exportRows = [
      ['Rekapitulasi & Laporan'],
      ['Rentang tanggal', `${startDate || 'Semua tanggal'} – ${endDate || 'Semua tanggal'}`],
      ['Jenis layanan', serviceFilter || 'Semua layanan'],
      ['Status', statusFilter || 'Semua status'],
      [],
      ['Ringkasan', 'Jumlah'],
      ['Total pengajuan', filteredRecords.length],
      ['Surat selesai', completedRecords.length],
      ['Masih diproses', processingCount],
      ['Ditolak', rejectedCount],
      ['Rata-rata penyelesaian (hari)', averageDays],
      [],
      ['Jenis layanan', 'Masuk', 'Selesai', 'Diproses', 'Ditolak'],
      ...serviceRows.map((service) => [service.name, service.total, service.completed, service.processing, service.rejected]),
    ]
    const csvEscape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const csv = exportRows.map((row) => row.map(csvEscape).join(',')).join('\r\n')
    const fileUrl = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = fileUrl
    link.download = `rekapitulasi_${startDate || 'semua'}_${endDate || 'semua'}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1000)
    setNotice('Laporan Excel (CSV) berhasil diunduh menggunakan filter yang dipilih.')
  }

  return (
    <>
      <div className="staff-reports-heading">
        <div className="staff-breadcrumb">Layanan Kemahasiswaan FTI <span>/</span> Rekapitulasi &amp; Laporan</div>
        <h1>Rekapitulasi &amp; Laporan</h1>
        <p>Pantau volume pengajuan, penyelesaian surat, dan kinerja layanan akademik.</p>
      </div>

      {notice && <div className="staff-notice success staff-report-notice" role="status"><CheckCircle2 size={16} /><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Tutup notifikasi"><X size={15} /></button></div>}

      <section className="staff-report-filters" aria-label="Filter laporan">
        <div className="staff-report-filter-card staff-report-range-filter">
          <label htmlFor="staff-report-start">Rentang Tanggal</label>
          <div className="staff-report-date-range">
            <input id="staff-report-start" aria-label="Tanggal mulai laporan" type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} />
            <span>–</span>
            <input id="staff-report-end" aria-label="Tanggal akhir laporan" type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} />
            <CalendarDays size={14} />
          </div>
        </div>
        <label className="staff-report-filter-card" htmlFor="staff-report-service">
          <span>Jenis Layanan</span>
          <select id="staff-report-service" value={serviceFilter} onChange={(event) => setServiceFilter(event.target.value)}>
            <option value="">Semua layanan</option>
            {reportServiceSeeds.map((service) => <option value={service.name} key={service.name}>{service.name}</option>)}
          </select>
        </label>
        <label className="staff-report-filter-card" htmlFor="staff-report-status">
          <span>Status</span>
          <select id="staff-report-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">Semua status</option>
            <option value="Selesai">Selesai</option>
            <option value="Diproses">Diproses</option>
            <option value="Ditolak">Ditolak</option>
          </select>
        </label>
        <label className="staff-report-filter-card" htmlFor="staff-report-format">
          <span>Format Ekspor</span>
          <select id="staff-report-format" value={exportFormat} onChange={(event) => setExportFormat(event.target.value)}>
            <option value="excel">Excel (.csv)</option>
            <option value="pdf">PDF (cetak)</option>
          </select>
        </label>
        <button type="button" className="staff-report-export" onClick={handleExport}><Download size={14} /> Ekspor</button>
      </section>

      <section className="staff-report-stats" aria-label="Ringkasan kinerja">
        <article className="staff-report-stat">
          <span>Total Pengajuan</span><FileText size={15} /><strong>{filteredRecords.length}</strong><b>Seluruh layanan</b><small>Rentang tanggal terpilih</small>
        </article>
        <article className="staff-report-stat">
          <span>Surat Selesai</span><CheckCircle2 size={15} /><strong>{completedRecords.length}</strong><b>{completedPercent.toFixed(1)}% dari pengajuan</b><small>Persetujuan akhir Dekan</small>
        </article>
        <article className="staff-report-stat">
          <span>Masih Diproses</span><Clock3 size={15} /><strong>{processingCount}</strong><b>Termasuk perbaikan</b><small>Tindak lanjuti antrean</small>
        </article>
        <article className="staff-report-stat">
          <span>Rata-rata Penyelesaian</span><CalendarDays size={15} /><strong>{averageDays}{averageDays === '—' ? '' : ' hari'}</strong><b>Sejak pengajuan masuk</b><small>{averageDays === '—' ? 'Belum ada surat selesai' : '0,4 hari lebih cepat'}</small>
        </article>
      </section>

      <div className="staff-report-chart-grid">
        <section className="staff-panel staff-report-panel">
          <h2>Pengajuan per Jenis Layanan</h2>
          <div className="staff-report-bars">
            {serviceRows.map((service) => (
              <div className="staff-report-bar-row" key={service.name}>
                <span>{service.name}</span><div className="staff-report-bar-track"><i style={{ width: `${(service.total / maxServiceCount) * 100}%` }} /></div><strong>{service.total}</strong>
              </div>
            ))}
            {serviceRows.length === 0 && <p className="staff-report-empty">Tidak ada data untuk filter ini.</p>}
          </div>
          <p className="staff-report-chart-caption">{startDate || 'Semua tanggal'} – {endDate || 'Semua tanggal'} · {filteredRecords.length} pengajuan</p>
        </section>

        <section className="staff-panel staff-report-panel">
          <h2>Tren Pengajuan &amp; Penyelesaian</h2>
          <div className="staff-report-legend"><span><i /> Pengajuan</span><span><i /> Selesai</span></div>
          <svg className="staff-report-line-chart" viewBox="0 0 360 160" role="img" aria-label="Grafik tren pengajuan dan surat selesai per minggu">
            {[18, 43, 68, 93, 118].map((y) => <line key={y} x1="15" x2="345" y1={y} y2={y} />)}
            <polyline className="incoming" points={incomingPoints} />
            <polyline className="completed" points={completedPoints} />
            {trendRows.map((period, index) => (
              <g key={period.label}>
                <circle className="incoming-dot" cx={chartX[index]} cy={chartY(period.incoming)} r="2.5"><title>{period.incoming} pengajuan</title></circle>
                <circle className="completed-dot" cx={chartX[index]} cy={chartY(period.completed)} r="2.5"><title>{period.completed} surat selesai</title></circle>
                <text x={chartX[index]} y="145" textAnchor="middle">{period.label}</text>
              </g>
            ))}
          </svg>
          <p className="staff-report-chart-caption">{filteredRecords.length} pengajuan masuk · {completedRecords.length} surat selesai</p>
        </section>
      </div>

      <div className="staff-report-detail-grid">
        <section className="staff-panel staff-report-panel staff-report-distribution">
          <h2>Distribusi Status</h2>
          <div className="staff-report-donut" style={distributionStyle} role="img" aria-label={`${completedRecords.length} selesai, ${processingCount} diproses, ${rejectedCount} ditolak`}>
            <div><strong>{filteredRecords.length}</strong><span>pengajuan</span></div>
          </div>
          <div className="staff-report-status-legend">
            <div><span className="complete-dot" /> <span>Selesai</span><strong>{completedRecords.length} · {completedPercent.toFixed(1)}%</strong></div>
            <div><span className="processing-dot" /> <span>Diproses</span><strong>{processingCount} · {processingPercent.toFixed(1)}%</strong></div>
            <div><span className="rejected-dot" /> <span>Ditolak</span><strong>{rejectedCount} · {rejectedPercent.toFixed(1)}%</strong></div>
          </div>
        </section>

        <section className="staff-panel staff-report-panel staff-report-breakdown">
          <h2>Rincian per Jenis Layanan</h2>
          <div className="staff-table-wrap">
            <table className="staff-report-table">
              <thead><tr><th>Jenis Layanan</th><th>Masuk</th><th>Selesai</th><th>Diproses</th><th>Ditolak</th></tr></thead>
              <tbody>
                {serviceRows.map((service) => (
                  <tr key={service.name}><td>{service.name}</td><td>{service.total}</td><td>{service.completed}</td><td>{service.processing}</td><td>{service.rejected}</td></tr>
                ))}
                {serviceRows.length === 0 && <tr><td className="staff-report-empty" colSpan="5">Tidak ada data untuk filter ini.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="staff-report-chart-caption">Total: {filteredRecords.length} masuk · {completedRecords.length} selesai · {processingCount} diproses · {rejectedCount} ditolak</p>
        </section>
      </div>
    </>
  )
}

function StaffProfilePage({ user, staffName, initials }) {
  const [email, setEmail] = useState(user?.email || 'staff.akademik@fti.unand.ac.id')
  const [phone, setPhone] = useState(user?.no_hp || '0812 0000 0000')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [visiblePasswords, setVisiblePasswords] = useState({ current: false, new: false, confirm: false })
  const [feedback, setFeedback] = useState(null)

  const saveContactProfile = (event) => {
    event.preventDefault()
    if (!email.trim() || !phone.trim()) {
      setFeedback({ type: 'error', message: 'Email dan nomor telepon wajib diisi.' })
      return
    }
    const updatedUser = { ...user, email: email.trim(), no_hp: phone.trim() }
    localStorage.setItem('user', JSON.stringify(updatedUser))
    setFeedback({ type: 'success', message: 'Informasi kontak berhasil disimpan.' })
  }

  const changePassword = (event) => {
    event.preventDefault()
    if (!currentPassword || !newPassword || !confirmPassword) {
      setFeedback({ type: 'error', message: 'Lengkapi semua kolom kata sandi terlebih dahulu.' })
      return
    }
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      setFeedback({ type: 'error', message: 'Kata sandi baru harus memenuhi seluruh persyaratan keamanan.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', message: 'Konfirmasi kata sandi baru tidak cocok.' })
      return
    }
    setFeedback({ type: 'success', message: 'Validasi berhasil. Fitur ubah kata sandi akan terhubung ke server.' })
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const passwordFields = [
    { key: 'current', label: 'Kata Sandi Saat Ini', placeholder: 'Masukkan kata sandi lama', value: currentPassword, setValue: setCurrentPassword, autoComplete: 'current-password' },
    { key: 'new', label: 'Kata Sandi Baru', placeholder: 'Masukkan kata sandi baru', value: newPassword, setValue: setNewPassword, autoComplete: 'new-password' },
    { key: 'confirm', label: 'Konfirmasi Kata Sandi Baru', placeholder: 'Masukkan kata sandi baru', value: confirmPassword, setValue: setConfirmPassword, autoComplete: 'new-password' },
  ]

  return (
    <>
      <div className="staff-profile-heading">
        <div className="staff-breadcrumb">Layanan Kemahasiswaan FTI <span>/</span> Profil</div>
      </div>
      <div className="staff-profile-title">
        <h1>Profil</h1>
        <p>Kelola identitas akun, informasi kontak, dan keamanan akun kerja Anda.</p>
      </div>
      {feedback && <div className={`staff-notice ${feedback.type === 'success' ? 'success' : 'error'} staff-profile-feedback`} role="status"><CheckCircle2 size={16} /><span>{feedback.message}</span><button type="button" onClick={() => setFeedback(null)} aria-label="Tutup pesan"><X size={15} /></button></div>}

      <section className="staff-profile-summary">
        <span className="staff-profile-avatar">{initials || 'SA'}</span>
        <div className="staff-profile-summary-main">
          <h2>{staffName}</h2>
          <p>Staf Akademik</p>
        </div>
        <div className="staff-profile-summary-meta">
          <span>Terakhir masuk: 23 Oktober 2026, 08.00 WIB</span>
          <small>Akun aktif · Akses staf akademik</small>
        </div>
      </section>

      <div className="staff-profile-layout">
        <section className="staff-panel staff-profile-card">
          <h2>Informasi Kontak</h2>
          <p>Informasi kontak digunakan untuk koordinasi layanan internal fakultas.</p>
          <form onSubmit={saveContactProfile}>
            <label className="staff-profile-readonly" htmlFor="staff-profile-name">
              <span>Nama</span>
              <span><input id="staff-profile-name" value={staffName} readOnly /><LockKeyhole size={15} /></span>
              <small>Identitas akun dikelola oleh administrator sistem.</small>
            </label>
            <label className="staff-profile-input" htmlFor="staff-profile-email">
              <span>Alamat Surel</span>
              <input id="staff-profile-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label className="staff-profile-input" htmlFor="staff-profile-phone">
              <span>Nomor Telepon</span>
              <input id="staff-profile-phone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </label>
            <label className="staff-profile-readonly" htmlFor="staff-profile-unit">
              <span>Unit Kerja</span>
              <span><input id="staff-profile-unit" value="Akademik - Fakultas Teknologi Informasi" readOnly /></span>
              <small>&nbsp;</small>
            </label>
            <button type="submit" className="staff-profile-save">Simpan Perubahan</button>
          </form>
        </section>

        <section className="staff-panel staff-profile-card staff-profile-password-card">
          <h2>Ubah Kata Sandi</h2>
          <p>Gunakan minimal 8 karakter dengan kombinasi huruf, angka, dan simbol.</p>
          <form onSubmit={changePassword}>
            {passwordFields.map((field) => (
              <label className="staff-profile-password-field" htmlFor={`staff-password-${field.key}`} key={field.key}>
                <span>{field.label} <b>*</b></span>
                <span>
                  <input id={`staff-password-${field.key}`} type={visiblePasswords[field.key] ? 'text' : 'password'} autoComplete={field.autoComplete} placeholder={field.placeholder} value={field.value} onChange={(event) => field.setValue(event.target.value)} />
                  <button type="button" aria-label={visiblePasswords[field.key] ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'} onClick={() => setVisiblePasswords((current) => ({ ...current, [field.key]: !current[field.key] }))}>
                    {visiblePasswords[field.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </span>
              </label>
            ))}
            <button type="submit" className="staff-profile-password-save">Ubah Kata Sandi</button>
          </form>
        </section>
      </div>
    </>
  )
}

export function StaffDashboard({ user, onLogout }) {
  const [access, setAccess] = useState({ status: 'checking', message: '' })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [menuNotice, setMenuNotice] = useState('')
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [loginSuccessNotice, setLoginSuccessNotice] = useState(false)
  const [activePage, setActivePage] = useState('Beranda')

  useEffect(() => {
    let active = true
    let noticeTimer
    const token = localStorage.getItem('token')

    fetch('/api/auth/khusus-staf', {
      headers: { Authorization: `Bearer ${token || ''}` },
    })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok || !result.success) {
          throw new Error(response.status === 403
            ? 'Akses ditolak. Halaman ini khusus Staff Akademik.'
            : result.message || 'Sesi tidak valid. Silakan masuk kembali.')
        }
        return result
      })
      .then((result) => {
        if (active) {
          setAccess({ status: 'authorized', message: result.message })
          if (sessionStorage.getItem('staff-login-success') === '1') {
            sessionStorage.removeItem('staff-login-success')
            setLoginSuccessNotice(true)
            noticeTimer = window.setTimeout(() => setLoginSuccessNotice(false), 4000)
          }
        }
      })
      .catch((error) => {
        if (active) setAccess({ status: 'denied', message: error.message || 'Server tidak dapat dihubungi.' })
      })

    return () => {
      active = false
      window.clearTimeout(noticeTimer)
    }
  }, [])

  const logout = onLogout

  const staffName = user?.nama || 'Staf Akademik Contoh'
  const initials = staffName.split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase()
  const today = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
  const navigation = [
    { label: 'Beranda', icon: Home },
    { label: 'Daftar Pengajuan', icon: Inbox },
    { label: 'Draf Surat', icon: FileText },
    { label: 'Arsip Surat', icon: Archive },
    { label: 'Jenis Layanan & Template', icon: FilePlus2 },
  ]
  const openStaffPage = (label) => {
    setSidebarOpen(false)
    if (label === 'Beranda' || label === 'Daftar Pengajuan' || label === 'Draf Surat' || label === 'Arsip Surat' || label === 'Jenis Layanan & Template' || label === 'Rekapitulasi & Laporan' || label === 'Profil') {
      setActivePage(label)
      setMenuNotice('')
      setSelectedSubmission(null)
      return
    }
    setMenuNotice(`Halaman ${label} belum tersedia.`)
  }

  return (
    <main className={`staff-dashboard-page${activePage === 'Rekapitulasi & Laporan' ? ' staff-report-print-page' : ''}`}>
      <aside className={`staff-sidebar${sidebarOpen ? ' is-open' : ''}`} aria-label="Navigasi staff akademik">
        <div className="staff-sidebar-brand">
          <div className="staff-brand-mark"><GraduationCap size={20} /></div>
          <strong>Layanan<br />Kemahasiswaan FTI</strong>
          <button type="button" className="staff-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Tutup menu"><X size={18} /></button>
        </div>
        <div className="staff-workspace-label">RUANG KERJA</div>
        <div className="staff-workspace-name">Staf Akademik</div>
        <nav className="staff-side-nav">
          {navigation.map(({ label, icon: Icon }) => (
            <button type="button" className={`staff-side-link${label === activePage ? ' active' : ''}`} key={label} onClick={() => openStaffPage(label)}>
              <Icon size={16} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="staff-side-divider" />
        <button type="button" className={`staff-side-link${activePage === 'Rekapitulasi & Laporan' ? ' active' : ''}`} onClick={() => openStaffPage('Rekapitulasi & Laporan')}><BarChart3 size={16} /><span>Rekapitulasi &amp; Laporan</span></button>
        <button type="button" className="staff-side-link" onClick={() => openStaffPage('Profil')}><UserRound size={16} /><span>Profil</span></button>
        <div className="staff-sidebar-footer">Fakultas Teknologi Informasi<br />Universitas Andalas</div>
      </aside>
      {sidebarOpen && <button type="button" className="staff-sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-label="Tutup menu navigasi" />}

      <div className="staff-workspace">
        <header className="staff-topbar">
          <button type="button" className="staff-menu-toggle" onClick={() => setSidebarOpen(true)} aria-label="Buka menu"><Menu size={19} /></button>
          <div className="staff-topbar-title"><strong>{staffName}</strong><span>Staf Akademik</span></div>
          <div className="staff-topbar-actions">
            <div className="staff-popover-anchor">
              <button type="button" className={`staff-icon-button${notificationsOpen ? ' active' : ''}`} onClick={() => { setNotificationsOpen((open) => !open); setProfileOpen(false) }} aria-label="Notifikasi"><Bell size={17} /><i /></button>
              {notificationsOpen && <div className="staff-popover staff-notification-popover"><strong>Notifikasi terbaru</strong><p>3 pengajuan baru menunggu pemeriksaan.</p><span>Terakhir diperbarui beberapa menit lalu</span></div>}
            </div>
            <div className="staff-popover-anchor">
              <button type="button" className="staff-profile-button" onClick={() => { setProfileOpen((open) => !open); setNotificationsOpen(false) }} aria-expanded={profileOpen}>
                <span className="staff-avatar">{initials || 'SA'}</span><ChevronDown size={14} />
              </button>
              {profileOpen && <div className="staff-popover staff-profile-popover"><strong>{staffName}</strong><span>Staf Akademik</span><button type="button" onClick={() => { setProfileOpen(false); openStaffPage('Profil') }}><UserRound size={14} /> Lihat Profil</button><button type="button" className="staff-profile-logout" onClick={logout}><LogOut size={14} /> Keluar</button></div>}
            </div>
          </div>
        </header>

        <section className="staff-dashboard-content">
          {access.status === 'checking' && <div className="staff-access-message" role="status"><span className="staff-spinner" /> Memeriksa hak akses...</div>}
          {access.status === 'denied' && (
            <div className="staff-access-card">
              <div className="staff-notice error" role="alert"><ShieldAlert size={17} /><span>{access.message}</span></div>
              <button type="button" className="staff-login-button staff-access-link" onClick={logout}>Kembali ke Login</button>
            </div>
          )}
          {access.status === 'authorized' && (
            <>
              {loginSuccessNotice && <div className="staff-notice success staff-login-success" role="status"><CheckCircle2 size={16} /><span>Login berhasil. Selamat datang di portal Staff Akademik.</span></div>}
              {activePage === 'Beranda' && <div className="staff-breadcrumb">Layanan Kemahasiswaan FTI <span>/</span> Beranda</div>}
              {activePage === 'Beranda' && <div className="staff-dashboard-heading"><h1>Beranda</h1><p>{today} · Ringkasan layanan dan pekerjaan yang perlu Anda tindak lanjuti.</p></div>}
              {menuNotice && <div className="staff-notice info" role="status">{menuNotice}<button type="button" onClick={() => setMenuNotice('')} aria-label="Tutup pesan"><X size={15} /></button></div>}

              {selectedSubmission ? (
                <StaffReviewPage submission={selectedSubmission} onClose={() => setSelectedSubmission(null)} />
              ) : activePage === 'Beranda' ? (
                <>
                  <section className="staff-stats-grid" aria-label="Ringkasan layanan">
                    <article className="staff-stat-card featured"><span>Pengajuan Baru</span><FileText size={17} /><strong>12</strong><b>Masuk hari ini</b><small>↗ 7 dari kemarin</small></article>
                    <article className="staff-stat-card"><span>Perlu Diverifikasi</span><FileText size={17} /><strong>24</strong><b>Menunggu pemeriksaan</b><small>2 pengajuan +2 hari</small></article>
                    <article className="staff-stat-card"><span>Perlu Perbaikan</span><FileText size={17} /><strong>7</strong><b>Menunggu mahasiswa</b><small>Dokumen perlu dilengkapi</small></article>
                    <article className="staff-stat-card"><span>Draf Surat Belum Dibuat</span><FileText size={17} /><strong>9</strong><b>Sudah diverifikasi</b><small>Siap disusun oleh staf</small></article>
                    <article className="staff-stat-card"><span>Selesai Bulan Ini</span><FileText size={17} /><strong>128</strong><b>Surat telah terbit</b><small>↗ 18 dari bulan lalu</small></article>
                  </section>

                  <section className="staff-panel staff-queue-panel" id="staff-queue">
                    <div className="staff-panel-heading"><div><h2>Antrean Pengajuan</h2><p>5 pengajuan terbaru yang belum diproses. Dahulukan pengajuan dengan waktu tunggu lebih dari 2 hari.</p></div></div>
                    <div className="staff-table-wrap">
                      <table className="staff-submission-table">
                        <thead><tr><th>Nomor Pengajuan</th><th>Mahasiswa / NIM</th><th>Jenis Surat</th><th>Tanggal Masuk</th><th>Status</th><th>Lama Menunggu</th><th>Aksi</th></tr></thead>
                        <tbody>{staffSubmissions.slice(0, 5).map((submission) => (
                          <tr key={submission.id}>
                            <td>{submission.id}</td>
                            <td><strong>{submission.name}</strong><span>{submission.nim}</span></td>
                            <td>{submission.service}</td>
                            <td>{submission.date}</td>
                            <td><span className="staff-submission-status"><Send size={11} /> {submission.status}</span></td>
                            <td className={submission.waiting === '3 hari' ? 'staff-waiting overdue' : 'staff-waiting'}>{submission.waiting === '3 hari' && <span>△ </span>}{submission.waiting}</td>
                            <td><button type="button" className="staff-review-button" onClick={() => setSelectedSubmission(submission)}><LogOut size={13} /> Periksa</button></td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                    {selectedSubmission && <div className="staff-review-panel" role="status"><CheckCircle2 size={17} /><span><strong>{selectedSubmission.id}</strong> · {selectedSubmission.name} — {selectedSubmission.service}</span><button type="button" onClick={() => setSelectedSubmission(null)} aria-label="Tutup detail"><X size={15} /></button></div>}
                  </section>

                  <div className="staff-lower-grid">
                    <section className="staff-panel staff-activity-panel">
                      <h2>Aktivitas Terbaru</h2>
                      <div className="staff-activity-list">{staffActivities.map((activity) => (
                        <article className="staff-activity-item" key={activity.title}>
                          <span className="staff-activity-check"><Check size={14} /></span>
                          <div><strong>{activity.title}</strong><p>{activity.description}</p><small>{activity.time}</small></div>
                        </article>
                      ))}</div>
                    </section>
                    <section className="staff-panel staff-services-panel">
                      <h2>Pengajuan per Jenis Layanan <span>(bulan ini)</span></h2>
                      <div className="staff-service-chart">{serviceVolumes.map((service, index) => (
                        <div className="staff-service-row" key={service.name}>
                          <span>{service.name}</span><div className="staff-service-track"><i className={index === 0 ? 'primary' : ''} style={{ width: `${(service.value / serviceVolumes[0].value) * 100}%` }} /></div><strong>{service.value}</strong>
                        </div>
                      ))}</div>
                      <p className="staff-chart-caption">1–23 Oktober 2026 · 174 pengajuan</p>
                    </section>
                  </div>
                </>
              ) : activePage === 'Daftar Pengajuan' ? (
                <StaffSubmissionPage onReview={setSelectedSubmission} selectedSubmission={selectedSubmission} onCloseReview={() => setSelectedSubmission(null)} />
              ) : activePage === 'Draf Surat' ? <StaffDraftPage /> : activePage === 'Arsip Surat' ? <StaffArchivePage /> : activePage === 'Rekapitulasi & Laporan' ? <StaffReportsPage /> : activePage === 'Profil' ? <StaffProfilePage user={user} staffName={staffName} initials={initials} /> : <StaffServiceTemplatePage />}
            </>
          )}
        </section>
        <footer className="staff-dashboard-footer">Fakultas Teknologi Informasi, Universitas Andalas. © 2026</footer>
      </div>
    </main>
  )
}
