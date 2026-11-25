import { useState } from 'react'
import { CalendarDays, CheckCircle2, Clock3, Download, FileText, X } from 'lucide-react'
import { reportServiceSeeds, initialReportRecords } from '../../data/contohStaf.js'
import { usePesanOtomatis } from '../../hooks/usePesanOtomatis.js'

export function RekapPage() {
  const [startDate, setStartDate] = useState('2026-10-01')
  const [endDate, setEndDate] = useState('2026-10-23')
  const [serviceFilter, setServiceFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [exportFormat, setExportFormat] = useState('excel')
  const [notice, setNotice] = useState('')
  usePesanOtomatis(notice, () => setNotice(''))
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
