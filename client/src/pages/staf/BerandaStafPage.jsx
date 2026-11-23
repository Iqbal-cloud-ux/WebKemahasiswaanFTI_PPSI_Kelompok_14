import { Check, FileText, LogOut, Send } from 'lucide-react'
import { serviceVolumes, staffActivities, staffSubmissions } from '../../data/contohStaf.js'

// Beranda staf. Judul dan breadcrumb-nya dirender oleh StafPortal.
export function BerandaStafPage({ onReview }) {
  return (
    <>
      <section className="staff-stats-grid" aria-label="Ringkasan layanan">
        <article className="staff-stat-card featured"><span>Pengajuan Baru</span><FileText size={17} /><strong>12</strong><b>Masuk hari ini</b><small>↗ 7 dari kemarin</small></article>
        <article className="staff-stat-card"><span>Perlu Diverifikasi</span><FileText size={17} /><strong>24</strong><b>Menunggu pemeriksaan</b><small>2 pengajuan +2 hari</small></article>
        <article className="staff-stat-card"><span>Perlu Perbaikan</span><FileText size={17} /><strong>7</strong><b>Menunggu mahasiswa</b><small>Dokumen perlu dilengkapi</small></article>
        <article className="staff-stat-card"><span>Draf Surat Belum Dibuat</span><FileText size={17} /><strong>9</strong><b>Sudah diverifikasi</b><small>Siap disusun oleh staf</small></article>
        <article className="staff-stat-card"><span>Selesai Bulan Ini</span><FileText size={17} /><strong>128</strong><b>Surat telah terbit</b><small>↗ 18 dari bulan lalu</small></article>
      </section>

      <section className="staff-panel staff-queue-panel" id="staff-queue">
        <div className="staff-panel-heading"><div><h2>Antrean Pengajuan</h2><p>5 pengajuan terbaru yang belum diproses. Dahulukan pengajuan dengan waktu tunggu lebih dari 2 hari.</p></div></div>
        <div className="staff-table-wrap">
          <table className="staff-submission-table">
            <thead><tr><th>Nomor Pengajuan</th><th>Mahasiswa / NIM</th><th>Jenis Surat</th><th>Tanggal Masuk</th><th>Status</th><th>Lama Menunggu</th><th>Aksi</th></tr></thead>
            <tbody>{staffSubmissions.slice(0, 5).map((submission) => (
              <tr key={submission.id}>
                <td>{submission.id}</td>
                <td><strong>{submission.name}</strong><span>{submission.nim}</span></td>
                <td>{submission.service}</td>
                <td>{submission.date}</td>
                <td><span className="staff-submission-status"><Send size={11} /> {submission.status}</span></td>
                <td className={submission.waiting === '3 hari' ? 'staff-waiting overdue' : 'staff-waiting'}>{submission.waiting === '3 hari' && <span>△ </span>}{submission.waiting}</td>
                <td><button type="button" className="staff-review-button" onClick={() => onReview(submission)}><LogOut size={13} /> Periksa</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <div className="staff-lower-grid">
        <section className="staff-panel staff-activity-panel">
          <h2>Aktivitas Terbaru</h2>
          <div className="staff-activity-list">{staffActivities.map((activity) => (
            <article className="staff-activity-item" key={activity.title}>
              <span className="staff-activity-check"><Check size={14} /></span>
              <div><strong>{activity.title}</strong><p>{activity.description}</p><small>{activity.time}</small></div>
            </article>
          ))}</div>
        </section>
        <section className="staff-panel staff-services-panel">
          <h2>Pengajuan per Jenis Layanan <span>(bulan ini)</span></h2>
          <div className="staff-service-chart">{serviceVolumes.map((service, index) => (
            <div className="staff-service-row" key={service.name}>
              <span>{service.name}</span><div className="staff-service-track"><i className={index === 0 ? 'primary' : ''} style={{ width: `${(service.value / serviceVolumes[0].value) * 100}%` }} /></div><strong>{service.value}</strong>
            </div>
          ))}</div>
          <p className="staff-chart-caption">1–23 Oktober 2026 · 174 pengajuan</p>
        </section>
      </div>
    </>
  )
}
