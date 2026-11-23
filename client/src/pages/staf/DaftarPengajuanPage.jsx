import { useState } from 'react'
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, LogOut, Search, Send, X } from 'lucide-react'
import { staffSubmissions, submissionServices, submissionStatuses } from '../../data/contohStaf.js'

export function DaftarPengajuanPage({ onReview, selectedSubmission, onCloseReview }) {
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
