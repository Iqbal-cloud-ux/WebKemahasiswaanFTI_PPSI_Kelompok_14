import { useCallback, useState } from 'react'
import { CalendarDays, CheckCircle2, Clock3, Download, FileText, X } from 'lucide-react'
import { eksporRekapCsvRequest, rekapRequest } from '../../services/api.js'
import { useDataServer } from '../../hooks/useDataServer.js'
import { usePesanOtomatis } from '../../hooks/usePesanOtomatis.js'

const formatAngka = (nilai) => new Intl.NumberFormat('id-ID').format(nilai || 0)

const labelPeriode = (periode) => {
  const [tahun, bulan] = periode.split('-')
  return `${bulan}/${tahun.slice(-2)}`
}

export function RekapPage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [serviceFilter, setServiceFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [exportFormat, setExportFormat] = useState('excel')
  const [exporting, setExporting] = useState(false)
  const [notice, setNotice] = useState('')
  const [noticeType, setNoticeType] = useState('success')
  usePesanOtomatis(notice, () => setNotice(''))

  const request = useCallback(() => rekapRequest({
    mulai: startDate,
    sampai: endDate,
    jenisLayananId: serviceFilter,
    status: statusFilter,
  }), [startDate, endDate, serviceFilter, statusFilter])
  const [laporan, muatUlang] = useDataServer(request, null)
  const data = laporan.data
  const ringkasan = data?.ringkasan
  const total = ringkasan?.total || 0
  const selesai = ringkasan?.selesai || 0
  const diproses = ringkasan?.diproses || 0
  const ditolak = ringkasan?.ditolak || 0
  const selesaiPersen = total ? (selesai / total) * 100 : 0
  const diprosesPersen = total ? (diproses / total) * 100 : 0
  const ditolakPersen = total ? (ditolak / total) * 100 : 0
  const semuaLayanan = data?.per_jenis_layanan || []
  const serviceRows = semuaLayanan.filter((service) => !serviceFilter || String(service.id) === serviceFilter)
  const maxServiceCount = Math.max(1, ...serviceRows.map((service) => service.total))
  const trendRows = data?.tren || []
  const maxTrendCount = Math.max(1, ...trendRows.map((period) => Math.max(period.masuk, period.selesai)))
  const chartX = trendRows.map((_, index) => trendRows.length < 2
    ? 180
    : 30 + (index * 300) / (trendRows.length - 1))
  const chartY = (value) => 118 - (value / maxTrendCount) * 100
  const incomingPoints = trendRows.map((period, index) => `${chartX[index]},${chartY(period.masuk)}`).join(' ')
  const completedPoints = trendRows.map((period, index) => `${chartX[index]},${chartY(period.selesai)}`).join(' ')
  const distributionStyle = total
    ? { background: `conic-gradient(#146e3a 0deg ${selesaiPersen * 3.6}deg, #7185a3 ${selesaiPersen * 3.6}deg ${(selesaiPersen + diprosesPersen) * 3.6}deg, #d9533f ${(selesaiPersen + diprosesPersen) * 3.6}deg 360deg)` }
    : { background: 'conic-gradient(#e7edf1 0deg 360deg)' }

  const handleExport = async () => {
    if (laporan.status !== 'siap') return
    if (exportFormat === 'pdf') {
      setNoticeType('info')
      setNotice('Pilih “Simpan sebagai PDF” pada dialog cetak browser untuk mengunduh laporan.')
      window.print()
      return
    }

    setExporting(true)
    try {
      const response = await eksporRekapCsvRequest({
        mulai: startDate,
        sampai: endDate,
        jenisLayananId: serviceFilter,
        status: statusFilter,
      })
      if (!response.ok) {
        const hasil = await response.json().catch(() => null)
        throw new Error(hasil?.message || 'Laporan gagal diekspor. Coba lagi.')
      }

      const fileUrl = URL.createObjectURL(await response.blob())
      const link = document.createElement('a')
      link.href = fileUrl
      link.download = `rekapitulasi_${startDate || 'semua'}_${endDate || 'semua'}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1000)
      setNoticeType('success')
      setNotice('Laporan Excel (CSV) berhasil diunduh menggunakan filter yang dipilih.')
    } catch (error) {
      setNoticeType('error')
      setNotice(error.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <div className="staff-reports-heading">
        <div className="staff-breadcrumb">Layanan Kemahasiswaan FTI <span>/</span> Rekapitulasi &amp; Laporan</div>
        <h1>Rekapitulasi &amp; Laporan</h1>
        <p>Pantau volume pengajuan, penyelesaian surat, dan kinerja layanan akademik.</p>
      </div>

      {notice && <div className={`staff-notice ${noticeType} staff-report-notice`} role={noticeType === 'error' ? 'alert' : 'status'}>{noticeType === 'error' ? <X size={16} /> : <CheckCircle2 size={16} />}<span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Tutup notifikasi"><X size={15} /></button></div>}

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
            {semuaLayanan.map((service) => <option value={service.id} key={service.id}>{service.nama_layanan}</option>)}
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
        <button type="button" className="staff-report-export" onClick={handleExport} disabled={laporan.status !== 'siap' || exporting}>
          <Download size={14} /> {exporting ? 'Mengekspor...' : 'Ekspor'}
        </button>
      </section>

      {laporan.status === 'memuat' && <div className="staff-panel staff-report-state" role="status">Memuat data rekapitulasi...</div>}
      {laporan.status === 'galat' && <div className="staff-panel staff-report-state staff-report-state-error" role="alert">
        <span>{laporan.pesan}</span>
        <button type="button" onClick={muatUlang}>Coba lagi</button>
      </div>}

      {laporan.status === 'siap' && (
        <>
          <section className="staff-report-stats" aria-label="Ringkasan kinerja">
            <article className="staff-report-stat">
              <span>Total Pengajuan</span><FileText size={15} /><strong>{formatAngka(total)}</strong><b>Seluruh layanan</b><small>{startDate || 'Semua tanggal'} – {endDate || 'Semua tanggal'}</small>
            </article>
            <article className="staff-report-stat">
              <span>Surat Selesai</span><CheckCircle2 size={15} /><strong>{formatAngka(selesai)}</strong><b>{selesaiPersen.toFixed(1)}% dari pengajuan</b><small>Persetujuan akhir Dekan</small>
            </article>
            <article className="staff-report-stat">
              <span>Masih Diproses</span><Clock3 size={15} /><strong>{formatAngka(diproses)}</strong><b>Termasuk perbaikan</b><small>Pengajuan belum selesai</small>
            </article>
            <article className="staff-report-stat">
              <span>Rata-rata Penyelesaian</span><CalendarDays size={15} />
              <strong>{ringkasan.rata_rata_hari === null ? '—' : `${Number(ringkasan.rata_rata_hari).toLocaleString('id-ID', { maximumFractionDigits: 1 })} hari`}</strong>
              <b>Dari pengajuan hingga surat terbit</b><small>{ringkasan.rata_rata_hari === null ? 'Belum ada surat selesai' : 'Rata-rata hari kalender'}</small>
            </article>
          </section>

          <div className="staff-report-chart-grid">
            <section className="staff-panel staff-report-panel">
              <h2>Pengajuan per Jenis Layanan</h2>
              <div className="staff-report-bars">
                {serviceRows.map((service) => (
                  <div className="staff-report-bar-row" key={service.id}>
                    <span>{service.nama_layanan}</span><div className="staff-report-bar-track"><i style={{ width: `${(service.total / maxServiceCount) * 100}%` }} /></div><strong>{formatAngka(service.total)}</strong>
                  </div>
                ))}
                {serviceRows.length === 0 && <p className="staff-report-empty">Tidak ada jenis layanan untuk ditampilkan.</p>}
              </div>
              <p className="staff-report-chart-caption">{startDate || 'Semua tanggal'} – {endDate || 'Semua tanggal'} · {formatAngka(total)} pengajuan</p>
            </section>

            <section className="staff-panel staff-report-panel">
              <h2>Tren Pengajuan &amp; Penyelesaian per Bulan</h2>
              <div className="staff-report-legend"><span><i /> Pengajuan</span><span><i /> Selesai</span></div>
              {trendRows.length > 0 ? (
                <svg className="staff-report-line-chart" viewBox="0 0 360 160" role="img" aria-label="Grafik tren pengajuan dan surat selesai per bulan">
                  {[18, 43, 68, 93, 118].map((y) => <line key={y} x1="15" x2="345" y1={y} y2={y} />)}
                  <polyline className="incoming" points={incomingPoints} />
                  <polyline className="completed" points={completedPoints} />
                  {trendRows.map((period, index) => (
                    <g key={period.periode}>
                      <circle className="incoming-dot" cx={chartX[index]} cy={chartY(period.masuk)} r="2.5"><title>{period.masuk} pengajuan masuk</title></circle>
                      <circle className="completed-dot" cx={chartX[index]} cy={chartY(period.selesai)} r="2.5"><title>{period.selesai} surat selesai</title></circle>
                      <text x={chartX[index]} y="145" textAnchor="middle">{labelPeriode(period.periode)}</text>
                    </g>
                  ))}
                </svg>
              ) : <p className="staff-report-empty">Belum ada pengajuan pada rentang tanggal ini.</p>}
              <p className="staff-report-chart-caption">{formatAngka(total)} pengajuan masuk · {formatAngka(selesai)} surat selesai</p>
            </section>
          </div>

          <div className="staff-report-detail-grid">
            <section className="staff-panel staff-report-panel staff-report-distribution">
              <h2>Distribusi Status</h2>
              <div className="staff-report-donut" style={distributionStyle} role="img" aria-label={`${selesai} selesai, ${diproses} diproses, ${ditolak} ditolak`}>
                <div><strong>{formatAngka(total)}</strong><span>pengajuan</span></div>
              </div>
              <div className="staff-report-status-legend">
                <div><span className="complete-dot" /> <span>Selesai</span><strong>{formatAngka(selesai)} · {selesaiPersen.toFixed(1)}%</strong></div>
                <div><span className="processing-dot" /> <span>Diproses</span><strong>{formatAngka(diproses)} · {diprosesPersen.toFixed(1)}%</strong></div>
                <div><span className="rejected-dot" /> <span>Ditolak</span><strong>{formatAngka(ditolak)} · {ditolakPersen.toFixed(1)}%</strong></div>
              </div>
            </section>

            <section className="staff-panel staff-report-panel staff-report-breakdown">
              <h2>Rincian per Jenis Layanan</h2>
              <div className="staff-table-wrap">
                <table className="staff-report-table">
                  <thead><tr><th>Jenis Layanan</th><th>Masuk</th><th>Selesai</th><th>Diproses</th><th>Ditolak</th></tr></thead>
                  <tbody>
                    {serviceRows.map((service) => (
                      <tr key={service.id}><td>{service.nama_layanan}</td><td>{formatAngka(service.total)}</td><td>{formatAngka(service.selesai)}</td><td>{formatAngka(service.diproses)}</td><td>{formatAngka(service.ditolak)}</td></tr>
                    ))}
                    {serviceRows.length === 0 && <tr><td className="staff-report-empty" colSpan="5">Tidak ada jenis layanan untuk ditampilkan.</td></tr>}
                  </tbody>
                </table>
              </div>
              <p className="staff-report-chart-caption">Total: {formatAngka(total)} masuk · {formatAngka(selesai)} selesai · {formatAngka(diproses)} diproses · {formatAngka(ditolak)} ditolak</p>
            </section>
          </div>
        </>
      )}
    </>
  )
}
