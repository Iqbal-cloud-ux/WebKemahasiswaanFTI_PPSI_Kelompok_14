import { ChevronRight, Clock3, FilePlus2, FileText } from 'lucide-react'
import { services } from '../../data/contohMahasiswa.js'

export function BerandaMahasiswaPage({ user, submissions, onApply }) {
  return (
    <>
      <div className="breadcrumb">Layanan Kemahasiswaan FTI / Mahasiswa</div>
      <div className="welcome-row"><div><h1>Halo, {user.nama || 'Mahasiswa'}!</h1><p>Pantau pengajuan surat akademik Anda · Ganjil 2026/2027</p></div><button type="button" className="primary-button" onClick={() => onApply()}><FilePlus2 size={16} /> Ajukan Layanan Baru</button></div>
      <section className="stats-grid" aria-label="Ringkasan pengajuan">
        <StatCard label="Sedang Diproses" value="3" icon={<Clock3 size={15} />} />
        <StatCard label="Perlu Perbaikan" value="1" icon={<Clock3 size={15} />} warning />
        <StatCard label="Selesai" value="1" icon={<Clock3 size={15} />} />
        <StatCard label="Total Pengajuan" value="5" icon={<Clock3 size={15} />} />
      </section>
      <section className="notice-panel"><span className="section-kicker">Perlu Perbaikan</span><div className="repair-alert"><span className="alert-mark">!</span><div><strong>Perlu Perbaikan</strong><p>Pengajuan Anda memerlukan perbaikan dokumen.</p></div></div><button type="button" className="outline-button">Perbaiki Sekarang</button></section>
      <section className="dashboard-section" id="pengajuan"><div className="section-heading"><h2>Pengajuan Terbaru</h2></div><div className="submission-list">{submissions.map((submission) => <article className="submission-item" key={submission.id}><span className={`status-pill ${submission.tone}`}><span />{submission.status}</span><small>{submission.id}</small><h3>{submission.title}</h3><p>{submission.date} · {user.nama || 'Mahasiswa'}</p><div className="item-footer"><button type="button" className="small-button">{submission.status === 'Selesai' ? 'Unduh Surat' : 'Lihat Detail'} <ChevronRight size={14} /></button></div></article>)}</div></section>
      <section className="dashboard-section" id="layanan"><div className="section-heading"><h2>Layanan Tersedia</h2></div><div className="service-list">{services.map((service) => <article className="service-item" key={service.title}><div className="service-icon"><FileText size={17} /></div><div className="service-copy"><h3>{service.title}</h3><p>{service.description}</p></div><span className="audience">Mahasiswa</span><button type="button" className="service-button" onClick={() => onApply(service.title)}>Ajukan</button></article>)}</div></section>
    </>
  )
}

function StatCard({ label, value, icon, warning = false }) {
  return <article className={`stat-card${warning ? ' warning' : ''}`}><span>{label}</span><div className="stat-icon">{icon}</div><strong>{value}</strong><h3>{label}</h3><p>{label === 'Total Pengajuan' ? 'Semua pengajuan Anda.' : `${label} pengajuan Anda.`}</p></article>
}
