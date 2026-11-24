import { useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, Eye, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { useDataServer } from '../../hooks/useDataServer.js'
import {
  bacaHasil, hapusLayananRequest, kelolaLayananRequest, simpanTemplateRequest, statusLayananRequest, tambahLayananRequest, ubahLayananRequest,
} from '../../services/api.js'
import { formatTanggal } from '../../utils/statusPengajuan.js'

// Contoh nilai untuk pratinjau template (data palsu).
const CONTOH_NILAI = {
  nama: 'Mahasiswa Contoh',
  nim: '9900000000',
  prodi: 'Sistem Informasi',
  keperluan: 'Pendaftaran beasiswa',
  no_surat: '001/FTI/CONTOH/2026',
  tanggal: formatTanggal(new Date()),
}
const isiContoh = (teks = '') => String(teks).replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (asli, nama) => CONTOH_NILAI[nama] ?? asli)

// Kelola jenis layanan, syarat dokumen, dan template surat (#80). Satu layanan punya satu template.
// Data dari GET /api/layanan/kelola; perubahan langsung berlaku untuk formulir pengajuan mahasiswa.
export function LayananTemplatePage() {
  const [kelola, muat] = useDataServer(kelolaLayananRequest, { layanan: [], variabel: {} })
  const [activeTab, setActiveTab] = useState('services')
  const [search, setSearch] = useState('')
  const [serviceEditor, setServiceEditor] = useState(null)
  const [templateEditor, setTemplateEditor] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [previewTemplate, setPreviewTemplate] = useState(null)
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState(null)
  const [saving, setSaving] = useState(false)
  const fokusTemplate = useRef({ field: 'body_template', el: null })

  const layanan = kelola.data.layanan
  const variabel = kelola.data.variabel
  const filtered = layanan.filter((item) => `${item.nama_layanan} ${item.kode_layanan}`.toLowerCase().includes(search.trim().toLowerCase()))
  const activeCount = layanan.filter((item) => item.is_active).length

  // Menjalankan request, menampilkan pesan, lalu memuat ulang daftar. Mengembalikan pesan galat atau null.
  const jalankan = async (request, pesanSukses, setelah) => {
    setSaving(true)
    setFormError('')
    try {
      await bacaHasil(await request())
      setNotice({ type: 'success', message: pesanSukses })
      setelah?.()
      muat()
      return null
    } catch (galat) {
      setFormError(galat.message)
      return galat.message
    } finally {
      setSaving(false)
    }
  }

  const openServiceEditor = (item = null) => {
    setFormError('')
    setServiceEditor(item
      ? { id: item.id, kode_layanan: item.kode_layanan, nama_layanan: item.nama_layanan, deskripsi: item.deskripsi || '', syarat: item.syarat.map((s) => ({ ...s })) }
      : { id: null, kode_layanan: '', nama_layanan: '', deskripsi: '', syarat: [{ nama_syarat: '', is_required: true, dipakai: 0 }] })
  }
  const ubahSyarat = (index, nilai) => setServiceEditor((current) => ({ ...current, syarat: current.syarat.map((s, i) => (i === index ? { ...s, ...nilai } : s)) }))

  const saveService = async (event) => {
    event.preventDefault()
    const data = {
      kode_layanan: serviceEditor.kode_layanan.trim().toUpperCase(),
      nama_layanan: serviceEditor.nama_layanan.trim(),
      deskripsi: serviceEditor.deskripsi.trim(),
      syarat: serviceEditor.syarat.map(({ id, nama_syarat, is_required }) => ({ id, nama_syarat: nama_syarat.trim(), is_required })),
    }
    if (!data.kode_layanan || !data.nama_layanan) return setFormError('Nama dan kode layanan wajib diisi.')
    if (data.syarat.some((s) => !s.nama_syarat)) return setFormError('Nama setiap dokumen persyaratan wajib diisi, atau hapus barisnya.')
    await jalankan(
      () => (serviceEditor.id ? ubahLayananRequest(serviceEditor.id, data) : tambahLayananRequest(data)),
      `Layanan ${data.nama_layanan} tersimpan.${serviceEditor.id ? '' : ' Template bawaan sudah dibuat; sesuaikan di tab Template Surat.'}`,
      () => setServiceEditor(null),
    )
  }

  const toggleService = (item) => {
    setNotice(null)
    jalankan(() => statusLayananRequest(item.id, !item.is_active), `Layanan ${item.nama_layanan} ${item.is_active ? 'dinonaktifkan; tidak menerima pengajuan baru' : 'diaktifkan'}.`)
      .then((galat) => { if (galat) setNotice({ type: 'error', message: galat }) })
  }

  const confirmDelete = () => jalankan(() => hapusLayananRequest(deleteTarget.id), `Layanan ${deleteTarget.nama_layanan} dihapus.`, () => setDeleteTarget(null))

  const openTemplateEditor = (item) => {
    setFormError('')
    setTemplateEditor({
      id: item.id,
      nama_layanan: item.nama_layanan,
      header_surat: item.template?.header_surat || '',
      body_template: item.template?.body_template || '',
      footer_surat: item.template?.footer_surat || '',
    })
  }

  // Menyisipkan {{variabel}} di posisi kursor pada kolom template yang terakhir difokuskan.
  const sisipkanVariabel = (nama) => {
    const { field, el } = fokusTemplate.current
    const sisip = `{{${nama}}}`
    setTemplateEditor((current) => {
      const teks = current[field] || ''
      const mulai = el?.selectionStart ?? teks.length
      const akhir = el?.selectionEnd ?? teks.length
      return { ...current, [field]: teks.slice(0, mulai) + sisip + teks.slice(akhir) }
    })
  }

  const saveTemplate = async (event) => {
    event.preventDefault()
    if (!templateEditor.body_template.trim()) return setFormError('Isi template wajib diisi.')
    await jalankan(
      () => simpanTemplateRequest(templateEditor.id, {
        header_surat: templateEditor.header_surat,
        body_template: templateEditor.body_template,
        footer_surat: templateEditor.footer_surat,
      }),
      `Template ${templateEditor.nama_layanan} tersimpan. Draf baru akan memakai template ini.`,
      () => setTemplateEditor(null),
    )
  }

  const templateField = (field, label, rows) => (
    <>
      <label htmlFor={`staff-template-${field}`}>{label}</label>
      <textarea
        id={`staff-template-${field}`}
        rows={rows}
        value={templateEditor[field]}
        onFocus={(event) => { fokusTemplate.current = { field, el: event.target } }}
        onChange={(event) => setTemplateEditor((current) => ({ ...current, [field]: event.target.value }))}
      />
    </>
  )

  return (
    <>
      <div className="staff-service-config-heading">
        <div className="staff-breadcrumb">Layanan Kemahasiswaan FTI <span>/</span> Jenis Layanan &amp; Template</div>
        <h1>Jenis Layanan &amp; Template</h1>
        <p>Kelola layanan mahasiswa, persyaratan dokumen, dan template surat fakultas.</p>
      </div>

      {notice && <div className={`staff-notice ${notice.type} staff-service-notice`} role="status">{notice.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}<span>{notice.message}</span><button type="button" onClick={() => setNotice(null)} aria-label="Tutup pesan"><X size={15} /></button></div>}
      {kelola.status === 'galat' && <div className="staff-notice error" role="alert"><AlertCircle size={16} /><span>{kelola.pesan}</span></div>}

      <div className="staff-service-tabs" role="tablist" aria-label="Pengaturan layanan dan template">
        <button type="button" role="tab" aria-selected={activeTab === 'services'} className={activeTab === 'services' ? 'active' : ''} onClick={() => setActiveTab('services')}>Jenis Layanan</button>
        <button type="button" role="tab" aria-selected={activeTab === 'templates'} className={activeTab === 'templates' ? 'active' : ''} onClick={() => setActiveTab('templates')}>Template Surat</button>
      </div>

      <div className="staff-service-toolbar">
        <label htmlFor="staff-service-search">
          <span>Cari jenis layanan</span>
          <span className="staff-service-search-control">
            <input id="staff-service-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nama atau kode layanan" />
            <Search size={16} />
          </span>
        </label>
        {activeTab === 'services' && <button type="button" className="staff-service-add-button" onClick={() => openServiceEditor()}><Plus size={15} /> Tambah Layanan</button>}
      </div>

      {activeTab === 'services' ? (
        <section className="staff-panel staff-service-config-panel">
          <div className="staff-service-panel-heading">
            <div>
              <h2>Jenis Layanan · {filtered.length} layanan</h2>
              <p>Perubahan langsung berlaku untuk formulir pengajuan mahasiswa. Layanan yang sudah punya pengajuan tidak bisa dihapus, hanya dinonaktifkan.</p>
            </div>
          </div>
          <div className="staff-table-wrap">
            <table className="staff-service-config-table">
              <thead><tr><th>Layanan / Kode</th><th>Dokumen Persyaratan</th><th>Pengajuan</th><th>Status Layanan</th><th>Aksi</th></tr></thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.nama_layanan}</strong><span>{item.kode_layanan}</span></td>
                    <td>{item.syarat.length === 0 ? 'Tidak ada' : `${item.syarat.length} dokumen (${item.syarat.filter((s) => s.is_required).length} wajib)`}</td>
                    <td>{item.jumlah_pengajuan}</td>
                    <td>
                      <div className="staff-service-state">
                        <button type="button" role="switch" aria-checked={item.is_active} disabled={saving} aria-label={`${item.is_active ? 'Nonaktifkan' : 'Aktifkan'} layanan ${item.nama_layanan}`} className={`staff-switch${item.is_active ? ' on' : ''}`} onClick={() => toggleService(item)}><i /></button>
                        <span>{item.is_active ? 'Aktif' : 'Nonaktif'}</span>
                      </div>
                      <small className="staff-service-state-note">{item.is_active ? 'Menerima pengajuan' : 'Pengajuan ditutup'}</small>
                    </td>
                    <td><div className="staff-service-row-actions">
                      <button type="button" className="staff-service-edit" onClick={() => openServiceEditor(item)}><Pencil size={13} /> Edit</button>
                      <button type="button" className="staff-service-delete" disabled={item.jumlah_pengajuan > 0} title={item.jumlah_pengajuan > 0 ? 'Sudah punya pengajuan; nonaktifkan saja' : undefined} onClick={() => { setFormError(''); setDeleteTarget(item) }}><Trash2 size={13} /> Hapus</button>
                    </div></td>
                  </tr>
                ))}
                {kelola.status === 'memuat' && <tr><td className="staff-empty-results" colSpan="5">Memuat layanan...</td></tr>}
                {kelola.status === 'siap' && filtered.length === 0 && <tr><td className="staff-empty-results" colSpan="5">Tidak ada jenis layanan yang cocok dengan pencarian.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="staff-service-config-footnote">{activeCount} dari {layanan.length} layanan aktif.</p>
        </section>
      ) : (
        <section className="staff-panel staff-service-config-panel">
          <div className="staff-service-panel-heading">
            <div>
              <h2>Template Surat · {filtered.length} template</h2>
              <p>Satu template untuk setiap layanan. Template dipakai saat staf membuat draf surat; draf yang sudah tersimpan tidak ikut berubah.</p>
            </div>
          </div>
          <div className="staff-table-wrap">
            <table className="staff-service-config-table staff-template-config-table">
              <thead><tr><th>Template / Layanan</th><th>Kode</th><th>Diperbarui</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td><strong>Template {item.nama_layanan}</strong><span>{item.template ? `${item.template.body_template.split('\n')[0]}` : 'Belum ada template'}</span></td>
                    <td>{item.kode_layanan}</td>
                    <td>{item.template ? formatTanggal(item.template.updated_at) : '-'}</td>
                    <td><span className={`staff-template-status${item.template ? '' : ' inactive'}`}>{item.template ? 'Tersedia' : 'Belum ada'}</span></td>
                    <td><div className="staff-service-row-actions">
                      {item.template && <button type="button" className="staff-template-view" onClick={() => setPreviewTemplate(item)}><Eye size={13} /> Lihat</button>}
                      <button type="button" className="staff-service-edit" onClick={() => openTemplateEditor(item)}><Pencil size={13} /> {item.template ? 'Edit' : 'Buat'}</button>
                    </div></td>
                  </tr>
                ))}
                {kelola.status === 'siap' && filtered.length === 0 && <tr><td className="staff-empty-results" colSpan="5">Tidak ada template yang cocok dengan pencarian.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className="staff-service-config-footnote">Variabel seperti {'{{nama}}'} diganti otomatis dari data pengajuan. {'{{no_surat}}'} dan {'{{tanggal}}'} baru diisi saat surat terbit.</p>
        </section>
      )}

      {serviceEditor && (
        <div className="staff-editor-overlay">
          <section className="staff-config-editor" role="dialog" aria-modal="true" aria-labelledby="staff-service-editor-title">
            <header><div><span>PENGELOLAAN LAYANAN</span><h2 id="staff-service-editor-title">{serviceEditor.id ? 'Edit Jenis Layanan' : 'Tambah Jenis Layanan'}</h2></div><button type="button" onClick={() => setServiceEditor(null)} aria-label="Tutup form layanan"><X size={18} /></button></header>
            <form onSubmit={saveService}>
              <label htmlFor="staff-service-name">Nama layanan</label>
              <input id="staff-service-name" maxLength={100} value={serviceEditor.nama_layanan} onChange={(event) => setServiceEditor((current) => ({ ...current, nama_layanan: event.target.value }))} autoFocus />
              <label htmlFor="staff-service-code">Kode layanan (huruf besar, angka, tanda hubung)</label>
              <input id="staff-service-code" maxLength={20} value={serviceEditor.kode_layanan} onChange={(event) => setServiceEditor((current) => ({ ...current, kode_layanan: event.target.value.toUpperCase() }))} placeholder="Contoh: AKTIF-PRIBADI" />
              <label htmlFor="staff-service-desc">Deskripsi untuk mahasiswa</label>
              <textarea id="staff-service-desc" rows="2" maxLength={1000} value={serviceEditor.deskripsi} onChange={(event) => setServiceEditor((current) => ({ ...current, deskripsi: event.target.value }))} />
              <fieldset className="staff-syarat-fieldset">
                <legend>Dokumen persyaratan</legend>
                {serviceEditor.syarat.length === 0 && <p className="staff-config-helper">Tidak ada dokumen yang perlu diunggah mahasiswa.</p>}
                {serviceEditor.syarat.map((s, index) => (
                  <div className="staff-syarat-row" key={s.id || `baru-${index}`}>
                    <input aria-label={`Nama dokumen ${index + 1}`} maxLength={150} value={s.nama_syarat} onChange={(event) => ubahSyarat(index, { nama_syarat: event.target.value })} placeholder="Nama dokumen" />
                    <label><input type="checkbox" checked={Boolean(s.is_required)} onChange={(event) => ubahSyarat(index, { is_required: event.target.checked })} /> Wajib</label>
                    <button type="button" disabled={s.dipakai > 0} title={s.dipakai > 0 ? 'Sudah dipakai berkas pengajuan; tidak bisa dihapus' : 'Hapus dokumen'} aria-label={`Hapus dokumen ${index + 1}`} onClick={() => setServiceEditor((current) => ({ ...current, syarat: current.syarat.filter((_, i) => i !== index) }))}><X size={14} /></button>
                  </div>
                ))}
                <button type="button" className="staff-syarat-add" onClick={() => setServiceEditor((current) => ({ ...current, syarat: [...current.syarat, { nama_syarat: '', is_required: true, dipakai: 0 }] }))}><Plus size={13} /> Tambah dokumen</button>
              </fieldset>
              {formError && <p className="staff-editor-error" role="alert">{formError}</p>}
              <div className="staff-editor-actions"><button type="button" className="staff-editor-cancel" onClick={() => setServiceEditor(null)}>Batal</button><button type="submit" className="staff-editor-save" disabled={saving}>Simpan Layanan</button></div>
            </form>
          </section>
        </div>
      )}

      {templateEditor && (
        <div className="staff-editor-overlay">
          <section className="staff-config-editor staff-template-editor" role="dialog" aria-modal="true" aria-labelledby="staff-template-editor-title">
            <header><div><span>TEMPLATE SURAT</span><h2 id="staff-template-editor-title">{templateEditor.nama_layanan}</h2></div><button type="button" onClick={() => setTemplateEditor(null)} aria-label="Tutup form template"><X size={18} /></button></header>
            <form onSubmit={saveTemplate}>
              <div className="staff-variabel-chips" aria-label="Sisipkan variabel">
                <span>Sisipkan variabel:</span>
                {Object.entries(variabel).map(([nama, arti]) => <button type="button" key={nama} title={arti} onClick={() => sisipkanVariabel(nama)}>{`{{${nama}}}`}</button>)}
              </div>
              {templateField('header_surat', 'Kepala surat (setiap baris di tengah; baris pertama tebal)', 3)}
              {templateField('body_template', 'Isi surat (baris pertama berhuruf kapital = judul)', 10)}
              {templateField('footer_surat', 'Kaki surat (sebelum baris kosong = blok tanda tangan; sesudahnya = keterangan kecil)', 5)}
              <p className="staff-config-helper">Pratinjau dengan data contoh:</p>
              <pre className="staff-template-preview-text">{[isiContoh(templateEditor.header_surat), isiContoh(templateEditor.body_template), isiContoh(templateEditor.footer_surat)].filter(Boolean).join('\n\n')}</pre>
              {formError && <p className="staff-editor-error" role="alert">{formError}</p>}
              <div className="staff-editor-actions"><button type="button" className="staff-editor-cancel" onClick={() => setTemplateEditor(null)}>Batal</button><button type="submit" className="staff-editor-save" disabled={saving}>Simpan Template</button></div>
            </form>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div className="staff-editor-overlay">
          <section className="staff-config-delete" role="alertdialog" aria-modal="true" aria-labelledby="staff-config-delete-title">
            <span className="staff-config-delete-icon"><Trash2 size={17} /></span>
            <h2 id="staff-config-delete-title">Hapus layanan?</h2>
            <p><strong>{deleteTarget.nama_layanan}</strong> beserta syarat dan templatenya akan dihapus permanen. Mahasiswa tidak bisa lagi mengajukan layanan ini.</p>
            {formError && <p className="staff-editor-error" role="alert">{formError}</p>}
            <div className="staff-editor-actions"><button type="button" className="staff-editor-cancel" onClick={() => setDeleteTarget(null)}>Batal</button><button type="button" className="staff-config-delete-confirm" disabled={saving} onClick={confirmDelete}>Hapus</button></div>
          </section>
        </div>
      )}

      {previewTemplate && (
        <div className="staff-editor-overlay">
          <section className="staff-config-editor staff-template-preview" role="dialog" aria-modal="true" aria-labelledby="staff-template-preview-title">
            <header><div><span>PRATINJAU TEMPLATE</span><h2 id="staff-template-preview-title">{previewTemplate.nama_layanan}</h2></div><button type="button" onClick={() => setPreviewTemplate(null)} aria-label="Tutup pratinjau template"><X size={18} /></button></header>
            <pre>{[previewTemplate.template.header_surat, previewTemplate.template.body_template, previewTemplate.template.footer_surat].filter(Boolean).map(isiContoh).join('\n\n')}</pre>
            <p className="staff-config-helper">Pratinjau dengan data contoh (palsu).</p>
            <div className="staff-editor-actions"><button type="button" className="staff-editor-cancel" onClick={() => setPreviewTemplate(null)}>Tutup</button><button type="button" className="staff-editor-save" onClick={() => { setPreviewTemplate(null); openTemplateEditor(previewTemplate) }}><Pencil size={13} /> Edit Template</button></div>
          </section>
        </div>
      )}
    </>
  )
}
