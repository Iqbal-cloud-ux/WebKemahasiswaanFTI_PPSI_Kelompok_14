import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, CalendarDays, Check, CheckCircle2, ChevronLeft, ChevronRight, Download, ExternalLink, LockKeyhole, Search, X } from 'lucide-react'
import { PratinjauBerkas } from '../../components/PratinjauBerkas.jsx'
import { useDataServer } from '../../hooks/useDataServer.js'
import { usePesanOtomatis } from '../../hooks/usePesanOtomatis.js'
import { daftarArsipSuratRequest, pdfSuratTerbitRequest, pratinjauSuratTerbitRequest, qrSuratTerbitRequest } from '../../services/api.js'

const formatTanggal = (tanggal) => {
  if (!tanggal) return '-'
  const [tahun, bulan, hari] = tanggal.split('-').map(Number)
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(tahun, bulan - 1, hari))
}

export function ArsipSuratPage() {
  const [archiveState] = useDataServer(daftarArsipSuratRequest)
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const [selectedArchive, setSelectedArchive] = useState(null)
  const [qrState, setQrState] = useState({ status: 'kosong', url: '', pesan: '' })
  const [previewOpen, setPreviewOpen] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)
  const [notice, setNotice] = useState('')
  const [downloadError, setDownloadError] = useState('')
  usePesanOtomatis(notice, () => setNotice(''))
  const pageSize = 5

  const archives = archiveState.data.map((archive) => ({
    ...archive,
    archiveNumber: archive.no_surat || archive.no_referensi,
    name: archive.mahasiswa.nama,
    nim: archive.mahasiswa.nim,
    service: archive.nama_layanan,
    dateValue: archive.tgl_terbit,
    publishedDate: formatTanggal(archive.tgl_terbit),
  }))
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

  useEffect(() => {
    if (!selectedArchive) return undefined

    let aktif = true
    let url = ''
    qrSuratTerbitRequest(selectedArchive.pengajuan_id)
      .then(async (response) => {
        if (!response.ok) {
          const hasil = await response.json().catch(() => null)
          throw new Error(hasil?.message || 'Kode verifikasi gagal dimuat.')
        }
        url = URL.createObjectURL(await response.blob())
        if (aktif) setQrState({ status: 'siap', url, pesan: '' })
      })
      .catch((galat) => {
        if (aktif) setQrState({ status: 'galat', url: '', pesan: galat.message })
      })

    return () => {
      aktif = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [selectedArchive])

  const muatPdf = useCallback(
    () => pratinjauSuratTerbitRequest(selectedArchive.pengajuan_id),
    [selectedArchive]
  )
  const tutupPratinjau = useCallback(() => setPreviewOpen(false), [])
  const bukaDetailArsip = (archive) => {
    setPreviewOpen(false)
    setQrState({ status: 'memuat', url: '', pesan: '' })
    setSelectedArchive(archive)
  }

  const unduhSurat = async (archive) => {
    setDownloadingId(archive.pengajuan_id)
    setDownloadError('')
    setNotice('')
    try {
      const response = await pdfSuratTerbitRequest(archive.pengajuan_id)
      if (!response.ok) {
        const hasil = await response.json().catch(() => null)
        throw new Error(hasil?.message || 'Surat gagal diunduh. Coba lagi beberapa saat lagi.')
      }

      const url = URL.createObjectURL(await response.blob())
      const link = document.createElement('a')
      link.href = url
      link.download = `Surat-${archive.archiveNumber.replace(/[^a-zA-Z0-9._-]/g, '_')}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setNotice(`Surat ${archive.archiveNumber} berhasil diunduh.`)
    } catch (galat) {
      setDownloadError(galat.message)
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <>
      <div className="staff-archives-heading">
        <div className="staff-breadcrumb">Layanan Kemahasiswaan FTI <span>/</span> Arsip Surat</div>
        <h1>Arsip Surat</h1>
        <p>Surat yang telah diterbitkan setelah persetujuan Dekan.</p>
      </div>

      {(notice || downloadError) && (
        <div className={`staff-notice ${downloadError ? 'error' : 'success'} staff-archive-notice`} role={downloadError ? 'alert' : 'status'}>
          {downloadError ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{downloadError || notice}</span>
          <button type="button" onClick={() => { setNotice(''); setDownloadError('') }} aria-label="Tutup notifikasi"><X size={15} /></button>
        </div>
      )}

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
            <h2>Surat Terbit · {archiveState.status === 'siap' ? filteredArchives.length : '—'}</h2>
            <p>Unduh PDF resmi atau buka detail kode verifikasi dan sidik jari surat.</p>
          </div>
        </div>
        <div className="staff-table-wrap">
          <table className="staff-submission-table staff-archive-table">
            <thead><tr><th>Nomor Surat / Referensi</th><th>Mahasiswa / NIM <span aria-hidden="true">↕</span></th><th>Jenis Surat <span aria-hidden="true">↕</span></th><th>Tanggal Terbit <span aria-hidden="true">↕</span></th><th>Status <span aria-hidden="true">↕</span></th><th>Aksi</th></tr></thead>
            <tbody>
              {archiveState.status === 'memuat' && <tr><td className="staff-empty-results" colSpan="6">Memuat arsip surat...</td></tr>}
              {archiveState.status === 'galat' && <tr><td className="staff-empty-results" colSpan="6" role="alert">{archiveState.pesan}</td></tr>}
              {archiveState.status === 'siap' && visibleArchives.map((archive) => (
                <tr key={archive.pengajuan_id}>
                  <td>{archive.archiveNumber}</td>
                  <td><strong>{archive.name}</strong><span>{archive.nim}</span></td>
                  <td>{archive.service}</td>
                  <td>{archive.publishedDate}</td>
                  <td><span className="staff-archive-status"><Check size={11} /> Selesai</span></td>
                  <td>
                    <div className="staff-archive-actions">
                      <button type="button" className="staff-archive-view" onClick={() => bukaDetailArsip(archive)}><ExternalLink size={13} /> Detail</button>
                      <button type="button" className="staff-archive-download" disabled={downloadingId === archive.pengajuan_id} onClick={() => unduhSurat(archive)}><Download size={13} /> {downloadingId === archive.pengajuan_id ? 'Mengunduh...' : 'Unduh'}</button>
                    </div>
                  </td>
                </tr>
              ))}
              {archiveState.status === 'siap' && visibleArchives.length === 0 && <tr><td className="staff-empty-results" colSpan="6">Tidak ada arsip yang sesuai dengan pencarian dan rentang tanggal.</td></tr>}
            </tbody>
          </table>
        </div>
        {archiveState.status === 'siap' && (
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
        )}
        <p className="staff-archive-footnote"><LockKeyhole size={12} /> Arsip dan kode QR hanya dapat dibuka Staf Akademik; akses unduhan dan kode verifikasi dicatat.</p>
      </section>

      {selectedArchive && (
        <div className="staff-editor-overlay">
          <section className="staff-archive-preview" role="dialog" aria-modal="true" aria-labelledby="staff-archive-preview-title">
            <header><div><span>ARSIP SURAT TERBIT</span><h2 id="staff-archive-preview-title">Detail Surat</h2></div><button type="button" onClick={() => setSelectedArchive(null)} aria-label="Tutup detail"><X size={18} /></button></header>
            <dl className="staff-archive-details">
              <div><dt>Nomor surat / referensi</dt><dd>{selectedArchive.archiveNumber}</dd></div>
              <div><dt>Mahasiswa</dt><dd>{selectedArchive.name} · {selectedArchive.nim}</dd></div>
              <div><dt>Jenis surat</dt><dd>{selectedArchive.service}</dd></div>
              <div><dt>Tanggal terbit</dt><dd>{selectedArchive.publishedDate}</dd></div>
              <div><dt>Status</dt><dd>Selesai</dd></div>
              <div><dt>Sidik jari SHA-256</dt><dd className="staff-archive-hash">{selectedArchive.hash_sha256}</dd></div>
            </dl>
            <div className="staff-archive-qr">
              {qrState.status === 'memuat' && <p role="status">Memuat kode verifikasi...</p>}
              {qrState.status === 'galat' && <p role="alert">{qrState.pesan}</p>}
              {qrState.status === 'siap' && <img src={qrState.url} alt={`Kode verifikasi surat ${selectedArchive.archiveNumber}`} />}
            </div>
            <footer>
              <button type="button" className="staff-editor-cancel" onClick={() => setSelectedArchive(null)}>Tutup</button>
              <button type="button" className="staff-archive-view" onClick={() => setPreviewOpen(true)}><ExternalLink size={14} /> Pratinjau PDF</button>
              <button type="button" className="staff-editor-save" disabled={downloadingId === selectedArchive.pengajuan_id} onClick={() => unduhSurat(selectedArchive)}><Download size={14} /> Unduh PDF</button>
            </footer>
          </section>
        </div>
      )}
      {selectedArchive && previewOpen && (
        <PratinjauBerkas
          judul={`Surat ${selectedArchive.archiveNumber}`}
          subjudul={`${selectedArchive.service} · ${selectedArchive.name}`}
          muat={muatPdf}
          onClose={tutupPratinjau}
        />
      )}
    </>
  )
}
