import { useState } from 'react'
import { CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, Download, ExternalLink, LockKeyhole, Search, X } from 'lucide-react'
import { initialStaffArchives } from '../../data/contohStaf.js'

export function ArsipSuratPage() {
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
