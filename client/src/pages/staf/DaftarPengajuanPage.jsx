import { useState } from 'react'
import { AlertCircle, CalendarDays, ChevronLeft, ChevronRight, LogOut, RefreshCw, Search, Send, X } from 'lucide-react'
import { STATUS_STAF, keBarisStaf } from '../../utils/statusPengajuan.js'

const PAGE_SIZE = 10

// Tab status: kumpulan nilai pengajuan.status yang ditampilkan.
const TABS = {
  Semua: null,
  'Perlu Diverifikasi': ['diajukan'],
  'Perlu Perbaikan': ['perlu_perbaikan'],
  Diproses: ['diverifikasi', 'pending_kakor', 'pending_wadek1', 'pending_dekan'],
  Selesai: ['disetujui'],
  Ditolak: ['ditolak'],
}
const STATUS_LABELS = [...new Set(Object.values(STATUS_STAF).map((item) => item.label))]

// Daftar seluruh pengajuan untuk Staf Akademik. pengajuan = { status, data, pesan } dari StafPortal.
export function DaftarPengajuanPage({ pengajuan, onReview }) {
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState('oldest')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [hiddenServices, setHiddenServices] = useState([])
  const [hiddenStatuses, setHiddenStatuses] = useState([])
  const [activeTab, setActiveTab] = useState('Semua')
  const [page, setPage] = useState(1)

  const rows = pengajuan.data.map(keBarisStaf)
  const services = [...new Set(rows.map((row) => row.service))].sort()

  const filteredSubmissions = rows
    .filter((row) => !hiddenServices.includes(row.service))
    .filter((row) => !hiddenStatuses.includes(row.status))
    .filter((row) => !TABS[activeTab] || TABS[activeTab].includes(row.statusKode))
    .filter((row) => !fromDate || row.dateValue >= fromDate)
    .filter((row) => !toDate || row.dateValue <= toDate)
    .filter((row) => `${row.no} ${row.name} ${row.nim} ${row.service}`.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((first, second) => {
      const selisih = new Date(first.createdAt) - new Date(second.createdAt) || first.id - second.id
      return sortOrder === 'oldest' ? selisih : -selisih
    })

  const pageCount = Math.max(1, Math.ceil(filteredSubmissions.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visibleSubmissions = filteredSubmissions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const toggle = (setter, value) => {
    setPage(1)
    setter((current) => (current.includes(value) ? current.filter((item) => item !== value) : [...current, value]))
  }

  const resetFilters = () => {
    setSearch('')
    setSortOrder('oldest')
    setFromDate('')
    setToDate('')
    setHiddenServices([])
    setHiddenStatuses([])
    setActiveTab('Semua')
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
            {services.map((service) => !hiddenServices.includes(service) && (
              <button type="button" className="staff-filter-chip" key={service} onClick={() => toggle(setHiddenServices, service)} aria-label={`Hapus filter ${service}`}>{service}<X size={12} /></button>
            ))}
            {services.length > 0 && services.every((service) => hiddenServices.includes(service)) && <span className="staff-filter-empty">Tidak ada jenis surat dipilih.</span>}
            {services.length === 0 && <span className="staff-filter-empty">Belum ada pengajuan.</span>}
          </div>
        </div>

        <div className="staff-chip-filter">
          <div className="staff-filter-caption">Status · {STATUS_LABELS.length - hiddenStatuses.length} status dipilih</div>
          <div className="staff-filter-chips">
            {STATUS_LABELS.map((status) => !hiddenStatuses.includes(status) && (
              <button type="button" className="staff-filter-chip" key={status} onClick={() => toggle(setHiddenStatuses, status)} aria-label={`Hapus filter ${status}`}>{status}<X size={12} /></button>
            ))}
            {hiddenStatuses.length === STATUS_LABELS.length && <span className="staff-filter-empty">Tidak ada status dipilih.</span>}
          </div>
        </div>
        <button type="button" className="staff-clear-filters" onClick={resetFilters}>Atur ulang filter</button>
      </section>

      <div className="staff-status-tabs" role="tablist" aria-label="Filter tab status">
        {Object.keys(TABS).map((tab) => (
          <button type="button" role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? 'active' : ''} key={tab} onClick={() => { setActiveTab(tab); setPage(1) }}>{tab}</button>
        ))}
      </div>

      <section className="staff-panel staff-all-submissions">
        <div className="staff-panel-heading">
          <h2>Seluruh Pengajuan · {filteredSubmissions.length}</h2>
        </div>
        {pengajuan.status === 'memuat' && <div className="staff-access-message" role="status"><RefreshCw size={15} /> Memuat pengajuan...</div>}
        {pengajuan.status === 'galat' && <div className="staff-notice error" role="alert"><AlertCircle size={16} /><span>{pengajuan.pesan}</span></div>}
        <div className="staff-table-wrap">
          <table className="staff-submission-table staff-all-submissions-table">
            <thead><tr>
              <th>Nomor Pengajuan</th><th>Mahasiswa / NIM</th><th>Jenis Surat</th><th>Tanggal Masuk</th><th>Status</th><th>Aksi</th>
            </tr></thead>
            <tbody>
              {visibleSubmissions.map((submission) => (
                <tr key={submission.id}>
                  <td>{submission.no}</td>
                  <td><strong>{submission.name}</strong><span>{submission.nim}</span></td>
                  <td>{submission.service}</td>
                  <td>{submission.date}</td>
                  <td><span className={`staff-submission-status status-${submission.kelas}`}>{submission.statusKode === 'diajukan' && <Send size={11} />}{submission.status}</span></td>
                  <td><button type="button" className="staff-review-button" onClick={() => onReview(submission)}><LogOut size={13} /> {submission.statusKode === 'diajukan' ? 'Periksa' : 'Lihat'}</button></td>
                </tr>
              ))}
              {pengajuan.status === 'siap' && visibleSubmissions.length === 0 && <tr><td className="staff-empty-results" colSpan="6">{rows.length === 0 ? 'Belum ada pengajuan masuk.' : 'Tidak ada pengajuan yang cocok dengan filter ini.'}</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="staff-pagination">
          <span>Menampilkan {filteredSubmissions.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–{Math.min(currentPage * PAGE_SIZE, filteredSubmissions.length)} dari {filteredSubmissions.length} data</span>
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
