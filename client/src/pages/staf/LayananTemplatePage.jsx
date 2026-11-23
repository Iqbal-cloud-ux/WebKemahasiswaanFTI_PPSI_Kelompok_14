import { useState } from 'react'
import { CheckCircle2, Eye, LogOut, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { initialStaffServices, initialStaffTemplates } from '../../data/contohStaf.js'

export function LayananTemplatePage() {
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
