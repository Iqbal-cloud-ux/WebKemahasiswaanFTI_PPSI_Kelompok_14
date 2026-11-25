import { useCallback, useState } from 'react'
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Eye, LogOut, Search, Send, X } from 'lucide-react'
import { PratinjauBerkas } from '../../components/PratinjauBerkas.jsx'
import { useDataServer } from '../../hooks/useDataServer.js'
import {
  bacaHasil, daftarDrafRequest, detailDrafRequest, pdfDrafRequest, pratinjauDrafRequest, simpanDrafRequest, teruskanDrafRequest,
} from '../../services/api.js'
import { formatTanggal, statusStaf } from '../../utils/statusPengajuan.js'
import { usePesanOtomatis } from '../../hooks/usePesanOtomatis.js'

const PAGE_SIZE = 10
// surat_resmi.status_draf -> label dan akhiran kelas CSS (docs/alur-status.md).
const STATUS_DRAF = {
  belum_dibuat: { label: 'Belum Dibuat', kelas: 'belum-dibuat' },
  dibuat: { label: 'Draf Dibuat', kelas: 'draf-dibuat' },
  dikembalikan: { label: 'Dikembalikan untuk Revisi', kelas: 'dikembalikan-untuk-revisi' },
  diteruskan: { label: 'Diteruskan ke Pimpinan', kelas: 'diteruskan' },
}
const NAMA_PIMPINAN = { kakor: 'Kepala Kantor', wadek1: 'Wakil Dekan 1', dekan: 'Dekan' }
const TABS = ['Semua Draf', ...Object.keys(STATUS_DRAF)]

// Draf surat dari pengajuan terverifikasi (#82): buat atau sunting draf dari template, pratinjau PDF,
// simpan, lalu teruskan ke Kepala Kantor. Data dari GET /api/draf.
export function DrafSuratPage() {
  const [daftar, muatDaftar] = useDataServer(daftarDrafRequest)
  const [search, setSearch] = useState('')
  const [serviceFilter, setServiceFilter] = useState('')
  const [activeTab, setActiveTab] = useState('Semua Draf')
  const [page, setPage] = useState(1)
  const [editor, setEditor] = useState(null) // { status, data, isi, tersimpan, pesan }
  const [busy, setBusy] = useState('')
  const [editorError, setEditorError] = useState('')
  const [notice, setNotice] = useState('')
  usePesanOtomatis(notice, () => setNotice(''))
  const [pratinjau, setPratinjau] = useState(null) // { judul, muat }

  const drafts = daftar.data
  const services = [...new Set(drafts.map((d) => d.nama_layanan))].sort()
  const filtered = drafts
    .filter((d) => !serviceFilter || d.nama_layanan === serviceFilter)
    .filter((d) => activeTab === 'Semua Draf' || d.status_draf === activeTab)
    .filter((d) => `${d.no_referensi} ${d.mahasiswa.nama} ${d.mahasiswa.nim} ${d.nama_layanan}`.toLowerCase().includes(search.trim().toLowerCase()))
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const counts = Object.fromEntries(Object.keys(STATUS_DRAF).map((key) => [key, drafts.filter((d) => d.status_draf === key).length]))
  const tutupPratinjau = useCallback(() => setPratinjau(null), [])

  const openEditor = async (draft) => {
    setEditorError('')
    setEditor({ status: 'memuat', ringkas: draft })
    try {
      const data = await bacaHasil(await detailDrafRequest(draft.pengajuan_id))
      setEditor({ status: 'siap', ringkas: draft, data, isi: data.isi_draf, tersimpan: data.status_draf !== 'belum_dibuat' ? data.isi_draf : null })
    } catch (galat) {
      setEditor({ status: 'galat', ringkas: draft, pesan: galat.message })
    }
  }

  const bisaDiubah = editor?.status === 'siap' && editor.data.pengajuan.status === 'diverifikasi'
  const belumDisimpan = editor?.status === 'siap' && editor.isi !== editor.tersimpan

  const simpan = async () => {
    setBusy('simpan')
    setEditorError('')
    try {
      await bacaHasil(await simpanDrafRequest(editor.ringkas.pengajuan_id, editor.isi))
      setEditor((current) => ({ ...current, tersimpan: current.isi, data: { ...current.data, status_draf: 'dibuat', ada_pdf: true } }))
      setNotice(`Draf ${editor.ringkas.no_referensi} tersimpan. Periksa PDF-nya, lalu teruskan ke Kepala Kantor.`)
      muatDaftar()
    } catch (galat) {
      setEditorError(galat.message)
    } finally {
      setBusy('')
    }
  }

  const teruskan = async () => {
    if (belumDisimpan) return setEditorError('Simpan perubahan draf terlebih dahulu sebelum meneruskan.')
    if (!window.confirm(`Teruskan draf ${editor.ringkas.no_referensi} ke Kepala Kantor? Draf tidak bisa diubah sampai dikembalikan.`)) return
    setBusy('teruskan')
    setEditorError('')
    try {
      await bacaHasil(await teruskanDrafRequest(editor.ringkas.pengajuan_id))
      setNotice(`Draf ${editor.ringkas.no_referensi} diteruskan ke Kepala Kantor. Mahasiswa sudah menerima notifikasi.`)
      setEditor(null)
      muatDaftar()
    } catch (galat) {
      setEditorError(galat.message)
    } finally {
      setBusy('')
    }
  }

  const lihatPratinjau = () => {
    const { pengajuan_id: id, no_referensi: no } = editor.ringkas
    const isi = editor.isi
    if (bisaDiubah && belumDisimpan) {
      setPratinjau({ judul: `Pratinjau draf ${no}`, subjudul: 'Belum disimpan', muat: () => pratinjauDrafRequest(id, isi) })
    } else {
      setPratinjau({ judul: `Draf ${no}`, subjudul: 'PDF draf tersimpan', muat: () => pdfDrafRequest(id) })
    }
  }

  return (
    <>
      <div className="staff-drafts-heading">
        <div className="staff-breadcrumb">Layanan Kemahasiswaan FTI <span>/</span> Draf Surat</div>
        <h1>Draf Surat</h1>
        <p>Susun draf dari pengajuan yang telah diverifikasi, lalu teruskan kepada Kepala Kantor untuk pemeriksaan.</p>
      </div>

      {notice && <div className="staff-notice success staff-draft-notice" role="status"><CheckCircle2 size={16} /><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Tutup notifikasi"><X size={15} /></button></div>}
      {daftar.status === 'galat' && <div className="staff-notice error" role="alert"><AlertCircle size={16} /><span>{daftar.pesan}</span></div>}

      <section className="staff-panel staff-draft-filters" aria-label="Filter draf surat">
        <label className="staff-draft-search" htmlFor="staff-draft-search">
          <span>Cari pengajuan terverifikasi</span>
          <span className="staff-search-control"><input id="staff-draft-search" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Cari nama, NIM, atau nomor pengajuan" /><Search size={16} /></span>
        </label>
        <label className="staff-filter-field" htmlFor="staff-draft-service">
          <span>Jenis Surat</span>
          <select id="staff-draft-service" value={serviceFilter} onChange={(event) => { setServiceFilter(event.target.value); setPage(1) }}>
            <option value="">Semua jenis surat</option>
            {services.map((service) => <option key={service} value={service}>{service}</option>)}
          </select>
        </label>
      </section>

      <div className="staff-draft-tabs" role="tablist" aria-label="Filter status draf">
        {TABS.map((tab) => (
          <button type="button" role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? 'active' : ''} key={tab} onClick={() => { setActiveTab(tab); setPage(1) }}>{STATUS_DRAF[tab]?.label || tab}</button>
        ))}
      </div>

      <section className="staff-panel staff-draft-table-panel">
        <div className="staff-draft-table-heading">
          <div>
            <h2>Pengajuan Terverifikasi · {filtered.length}</h2>
            <p>{counts.belum_dibuat} belum dibuat · {counts.dibuat} tersimpan · {counts.dikembalikan} dikembalikan untuk revisi · {counts.diteruskan} di pimpinan</p>
          </div>
        </div>
        <div className="staff-table-wrap">
          <table className="staff-submission-table staff-draft-table">
            <thead><tr><th>Nomor Pengajuan</th><th>Mahasiswa / NIM</th><th>Jenis Surat</th><th>Tanggal Masuk</th><th>Status Draf</th><th>Aksi</th></tr></thead>
            <tbody>
              {visible.map((draft) => {
                const status = STATUS_DRAF[draft.status_draf] || STATUS_DRAF.belum_dibuat
                return (
                  <tr key={draft.pengajuan_id}>
                    <td>{draft.no_referensi}</td>
                    <td><strong>{draft.mahasiswa.nama}</strong><span>{draft.mahasiswa.nim}</span></td>
                    <td>{draft.nama_layanan}</td>
                    <td>{formatTanggal(draft.created_at)}</td>
                    <td><span className={`staff-draft-status status-${status.kelas}`}>{draft.status_draf === 'diteruskan' ? statusStaf(draft.status).label : status.label}</span>{draft.catatan_pengembalian && <small className="staff-draft-catatan">{NAMA_PIMPINAN[draft.pengembali] || 'Pimpinan'}: {draft.catatan_pengembalian}</small>}</td>
                    <td><button type="button" className="staff-review-button" onClick={() => openEditor(draft)}><LogOut size={13} /> {draft.status_draf === 'belum_dibuat' ? 'Buat Draf' : draft.status_draf === 'diteruskan' ? 'Lihat Draf' : 'Edit Draf'}</button></td>
                  </tr>
                )
              })}
              {daftar.status === 'memuat' && <tr><td className="staff-empty-results" colSpan="6">Memuat draf...</td></tr>}
              {daftar.status === 'siap' && visible.length === 0 && <tr><td className="staff-empty-results" colSpan="6">{drafts.length === 0 ? 'Belum ada pengajuan terverifikasi.' : 'Tidak ada pengajuan yang cocok dengan filter draf ini.'}</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="staff-pagination">
          <span>Menampilkan {filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} dari {filtered.length} data</span>
          <div>
            <button type="button" aria-label="Halaman sebelumnya" disabled={currentPage === 1} onClick={() => setPage((current) => current - 1)}><ChevronLeft size={15} /></button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
              <button type="button" className={currentPage === pageNumber ? 'current' : ''} aria-current={currentPage === pageNumber ? 'page' : undefined} key={pageNumber} onClick={() => setPage(pageNumber)}>{pageNumber}</button>
            ))}
            <button type="button" aria-label="Halaman selanjutnya" disabled={currentPage === pageCount} onClick={() => setPage((current) => current + 1)}><ChevronRight size={15} /></button>
          </div>
        </div>
      </section>

      {editor && (
        <div className="staff-editor-overlay">
          <section className="staff-draft-editor" role="dialog" aria-modal="true" aria-labelledby="staff-draft-editor-title">
            <header><div><span>EDITOR DRAF SURAT</span><h2 id="staff-draft-editor-title">{!bisaDiubah && editor.status === 'siap' ? 'Lihat Draf Surat' : editor.ringkas.status_draf === 'belum_dibuat' ? 'Buat Draf Surat' : 'Edit Draf Surat'}</h2></div><button type="button" onClick={() => setEditor(null)} aria-label="Tutup editor"><X size={18} /></button></header>
            <div className="staff-editor-applicant"><strong>{editor.ringkas.mahasiswa.nama}</strong><span>{editor.ringkas.no_referensi} · {editor.ringkas.mahasiswa.nim} · {editor.ringkas.nama_layanan}</span></div>
            {editor.status === 'memuat' && <p className="staff-editor-note" role="status">Memuat draf...</p>}
            {editor.status === 'galat' && <p className="staff-editor-error" role="alert">{editor.pesan}</p>}
            {editor.status === 'siap' && (
              <form onSubmit={(event) => { event.preventDefault(); simpan() }}>
                {editor.data.pengembalian && <div className="staff-notice error staff-draft-kembali"><AlertCircle size={15} /><span><strong>Dikembalikan oleh {NAMA_PIMPINAN[editor.data.pengembalian.role_pimpinan] || 'pimpinan'}:</strong> {editor.data.pengembalian.catatan}</span></div>}
                {editor.data.pengajuan.keperluan && <p className="staff-editor-note">Keperluan: {editor.data.pengajuan.keperluan}</p>}
                <label htmlFor="staff-draft-content">Isi draf (kepala dan kaki surat diambil dari template layanan)</label>
                <textarea id="staff-draft-content" rows="14" maxLength={20000} readOnly={!bisaDiubah || editor.data.formulir_mahasiswa} value={editor.isi} onChange={(event) => setEditor((current) => ({ ...current, isi: event.target.value }))} />
                <p className="staff-editor-note">{bisaDiubah && editor.data.formulir_mahasiswa
                  ? 'Layanan ini memakai pernyataan bermeterai yang diunggah mahasiswa. Tekan Pratinjau untuk melihat pindaiannya, Simpan, lalu Teruskan.'
                  : bisaDiubah
                  ? <>{'{{no_surat}}'} dan {'{{tanggal}}'} biarkan apa adanya; keduanya diisi otomatis saat Dekan menyetujui.{belumDisimpan ? ' Ada perubahan yang belum disimpan.' : ''}</>
                  : `Draf sedang dalam proses persetujuan (${statusStaf(editor.data.pengajuan.status).label}) dan tidak bisa diubah.`}</p>
                {editorError && <p className="staff-editor-error" role="alert">{editorError}</p>}
                <div className="staff-editor-actions">
                  <button type="button" className="staff-editor-cancel" onClick={() => setEditor(null)}>Tutup</button>
                  <button type="button" className="staff-editor-cancel" disabled={!editor.isi.trim() || (!bisaDiubah && !editor.data.ada_pdf)} onClick={lihatPratinjau}><Eye size={13} /> Pratinjau PDF</button>
                  {bisaDiubah && <button type="submit" className="staff-editor-save" disabled={Boolean(busy) || !belumDisimpan}>{busy === 'simpan' ? 'Menyimpan...' : 'Simpan Draf'}</button>}
                  {bisaDiubah && <button type="button" className="staff-editor-save" disabled={Boolean(busy) || belumDisimpan || editor.tersimpan === null} onClick={teruskan}><Send size={13} /> {busy === 'teruskan' ? 'Meneruskan...' : 'Teruskan ke Kepala Kantor'}</button>}
                </div>
              </form>
            )}
          </section>
        </div>
      )}

      {pratinjau && <PratinjauBerkas judul={pratinjau.judul} subjudul={pratinjau.subjudul} muat={pratinjau.muat} onClose={tutupPratinjau} />}
    </>
  )
}
