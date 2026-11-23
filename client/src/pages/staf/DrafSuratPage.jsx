import { useState } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight, LogOut, Search, X } from 'lucide-react'
import { submissionServices, initialStaffDrafts, draftStatuses } from '../../data/contohStaf.js'

export function DrafSuratPage() {
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
