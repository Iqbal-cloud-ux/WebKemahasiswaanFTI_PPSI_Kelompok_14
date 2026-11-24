import { useState } from 'react'
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Eye, MoreHorizontal, Search } from 'lucide-react'
import { StatusMuat } from './BerandaMahasiswaPage.jsx'
import { DetailPengajuan } from './DetailPengajuan.jsx'

const PAGE_SIZE = 5

// Riwayat pengajuan milik mahasiswa yang sedang login, dengan pencarian dan filter.
// pengajuan = { status, data, pesan } dari MahasiswaPortal; layanan = daftar layanan untuk filter jenis surat.
export function RiwayatPage({ pengajuan, layanan, selectedSubmissionId, setSelectedSubmissionId, onPerbaiki }) {
  const submissions = pengajuan.data
  const [historySearch, setHistorySearch] = useState('')
  const [historyService, setHistoryService] = useState('')
  const [historyStatus, setHistoryStatus] = useState('')
  const [historyFrom, setHistoryFrom] = useState('')
  const [historyTo, setHistoryTo] = useState('')
  const [historySort, setHistorySort] = useState('newest')
  const [historyPage, setHistoryPage] = useState(1)

  const filteredSubmissions = submissions
    .filter((submission) => !historyService || submission.title === historyService)
    .filter((submission) => !historyStatus || submission.status === historyStatus)
    .filter((submission) => `${submission.id} ${submission.title} ${submission.applicant}`.toLowerCase().includes(historySearch.toLowerCase()))
    .filter((submission) => !historyFrom || submission.dateValue >= historyFrom)
    .filter((submission) => !historyTo || submission.dateValue <= historyTo)
    .sort((first, second) => historySort === 'oldest' ? first.dateValue.localeCompare(second.dateValue) : second.dateValue.localeCompare(first.dateValue))
  const historyPageCount = Math.max(1, Math.ceil(filteredSubmissions.length / PAGE_SIZE))
  const visibleSubmissions = filteredSubmissions.slice((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE)
  const selectedSubmission = filteredSubmissions.find((submission) => submission.id === selectedSubmissionId) || filteredSubmissions[0]

  return (
    <>
            <div className="breadcrumb">Layanan Kemahasiswaan FTI / Mahasiswa</div>
            <div className="history-heading"><h1>Riwayat Pengajuan</h1><p>Cari dan pantau seluruh pengajuan milik Anda.</p></div>
            <section className="history-search-section" aria-label="Cari dan saring pengajuan">
              <h2>Cari &amp; Saring Pengajuan</h2>
              <label className="history-search-field"><span>Cari Pengajuan</span><span className="history-input-wrap"><input value={historySearch} onChange={(event) => { setHistorySearch(event.target.value); setHistoryPage(1) }} placeholder="Cari nomor pengajuan atau jenis surat" /><Search size={16} /></span></label>
              <div className="history-filters">
                <label><span>Jenis Surat</span><select value={historyService} onChange={(event) => { setHistoryService(event.target.value); setHistoryPage(1) }}><option value="">Semua jenis surat</option>{layanan.map((item) => <option key={item.id}>{item.nama_layanan}</option>)}</select></label>
                <label><span>Status</span><select value={historyStatus} onChange={(event) => { setHistoryStatus(event.target.value); setHistoryPage(1) }}><option value="">Semua status</option>{[...new Set(submissions.map((submission) => submission.status))].map((status) => <option key={status}>{status}</option>)}</select></label>
                <label><span>Rentang Tanggal</span><span className="date-filter"><input aria-label="Tanggal mulai" type="date" value={historyFrom} onChange={(event) => { setHistoryFrom(event.target.value); setHistoryPage(1) }} /><span>sampai</span><input aria-label="Tanggal akhir" type="date" value={historyTo} onChange={(event) => { setHistoryTo(event.target.value); setHistoryPage(1) }} /><CalendarDays size={15} /></span></label>
                <label><span>Urutkan Tanggal</span><select value={historySort} onChange={(event) => { setHistorySort(event.target.value); setHistoryPage(1) }}><option value="newest">Terbaru terlebih dahulu</option><option value="oldest">Terlama terlebih dahulu</option></select></label>
              </div>
            </section>
            <section className="history-results">
              <div className="section-heading"><h2>Daftar Pengajuan</h2><p>{filteredSubmissions.length} pengajuan. Hanya data pengajuan milik Anda.</p></div>
              {pengajuan.status !== 'siap' && <StatusMuat state={pengajuan} kosong="" />}
              <div className="history-table-wrap"><table className="history-table"><thead><tr><th>Nomor Pengajuan</th><th>Jenis Surat</th><th>Tanggal Diajukan <button type="button" className="sort-indicator" onClick={() => setHistorySort((sort) => sort === 'newest' ? 'oldest' : 'newest')} aria-label="Urutkan tanggal"><ArrowRight size={12} /></button></th><th>Status</th><th>Aksi</th></tr></thead><tbody>
                {visibleSubmissions.map((submission) => <tr key={submission.id} className={selectedSubmission?.id === submission.id ? 'selected' : ''} onClick={() => setSelectedSubmissionId(submission.id)}><td><strong>{submission.id}</strong><small>{submission.applicant}</small></td><td>{submission.title}</td><td>{submission.date}</td><td><span className={`status-pill ${submission.tone}`}><span />{submission.status}</span></td><td><div className="history-row-actions"><button type="button" title="Lihat detail" aria-label={`Lihat detail ${submission.id}`} onClick={(event) => { event.stopPropagation(); setSelectedSubmissionId(submission.id) }}><Eye size={15} /></button><button type="button" title="Aksi lainnya" aria-label={`Aksi lainnya ${submission.id}`} onClick={(event) => { event.stopPropagation(); setSelectedSubmissionId(submission.id) }}><MoreHorizontal size={16} /></button></div></td></tr>)}
                {pengajuan.status === 'siap' && visibleSubmissions.length === 0 && <tr><td className="history-empty" colSpan="5">{submissions.length === 0 ? 'Belum ada pengajuan.' : 'Tidak ada pengajuan yang sesuai dengan filter.'}</td></tr>}
              </tbody></table></div>
              <div className="history-pagination"><span>Menampilkan {filteredSubmissions.length ? (historyPage - 1) * PAGE_SIZE + 1 : 0}–{Math.min(historyPage * PAGE_SIZE, filteredSubmissions.length)} dari {filteredSubmissions.length} pengajuan</span><div><button type="button" aria-label="Halaman sebelumnya" disabled={historyPage === 1} onClick={() => setHistoryPage((page) => page - 1)}><ChevronLeft size={15} /></button><button type="button" className="current-page" aria-current="page">{historyPage}</button><button type="button" aria-label="Halaman selanjutnya" disabled={historyPage >= historyPageCount} onClick={() => setHistoryPage((page) => page + 1)}><ChevronRight size={15} /></button></div></div>
              
              {selectedSubmission && <DetailPengajuan key={selectedSubmission.pengajuanId} submission={selectedSubmission} onPerbaiki={onPerbaiki} />}
            </section>
    </>
  )
}
