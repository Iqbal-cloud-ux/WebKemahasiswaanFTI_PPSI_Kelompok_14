import { AlertCircle, CheckCircle2, ChevronRight, Clock3, FilePlus2, FileText, Files } from 'lucide-react'
import { sedangDiproses } from '../../utils/statusPengajuan.js'

const JUMLAH_TERBARU = 5

// Beranda mahasiswa: ringkasan pengajuan, peringatan perbaikan, pengajuan terbaru, dan katalog layanan.
// pengajuan dan layanan berbentuk { status: 'memuat' | 'siap' | 'galat', data, pesan } dari MahasiswaPortal.
export function BerandaMahasiswaPage({ user, pengajuan, layanan, onApply, onOpenSubmission, onPerbaiki }) {
  const submissions = pengajuan.data
  const perluPerbaikan = submissions.filter((item) => item.statusKode === 'perlu_perbaikan')
  const hitung = (cek) => (pengajuan.status === 'siap' ? String(submissions.filter(cek).length) : '-')

  return (
    <>
      <div className="breadcrumb">Layanan Kemahasiswaan FTI / Mahasiswa</div>
      <div className="welcome-row"><div><h1>Halo, {user.nama || 'Mahasiswa'}!</h1><p>Pantau pengajuan surat akademik Anda</p></div><button type="button" className="primary-button" onClick={() => onApply()}><FilePlus2 size={16} /> Ajukan Layanan Baru</button></div>
      <section className="stats-grid" aria-label="Ringkasan pengajuan">
        <StatCard label="Sedang Diproses" value={hitung((item) => sedangDiproses(item.statusKode))} icon={<Clock3 size={15} />} tone="biru" />
        <StatCard label="Perlu Perbaikan" value={hitung((item) => item.statusKode === 'perlu_perbaikan')} icon={<AlertCircle size={15} />} tone="oranye" />
        <StatCard label="Selesai" value={hitung((item) => item.statusKode === 'disetujui')} icon={<CheckCircle2 size={15} />} tone="hijau" />
        <StatCard label="Total Pengajuan" value={hitung(() => true)} icon={<Files size={15} />} tone="ungu" />
      </section>
      {perluPerbaikan.length > 0 && (
        <section className="notice-panel">
          <span className="section-kicker">Perlu Perbaikan</span>
          <div className="repair-alert"><span className="alert-mark">!</span><div><strong>{perluPerbaikan.length} pengajuan perlu diperbaiki</strong><p>{perluPerbaikan[0].id} ({perluPerbaikan[0].title}){perluPerbaikan[0].catatan ? `: ${perluPerbaikan[0].catatan}` : ''}</p></div></div>
          <button type="button" className="outline-button" onClick={() => onPerbaiki(perluPerbaikan[0].pengajuanId)}>Perbaiki Sekarang</button>
        </section>
      )}
      <section className="dashboard-section" id="pengajuan">
        <div className="section-heading"><h2>Pengajuan Terbaru</h2></div>
        <StatusMuat state={pengajuan} kosong="Belum ada pengajuan. Pilih layanan di bawah untuk mulai mengajukan." />
        {pengajuan.status === 'siap' && submissions.length > 0 && (
          <div className="submission-list">{submissions.slice(0, JUMLAH_TERBARU).map((submission) => <article className="submission-item" key={submission.id}><span className={`status-pill ${submission.tone}`}><span />{submission.status}</span><small>{submission.id}</small><h3>{submission.title}</h3><p>{submission.date} · {user.nama || 'Mahasiswa'}</p><div className="item-footer"><button type="button" className="small-button" onClick={() => onOpenSubmission(submission.id)}>Lihat Detail <ChevronRight size={14} /></button></div></article>)}</div>
        )}
      </section>
      <section className="dashboard-section" id="layanan">
        <div className="section-heading"><h2>Layanan Tersedia</h2></div>
        <StatusMuat state={layanan} kosong="Belum ada layanan yang dibuka." />
        {layanan.status === 'siap' && (
          <div className="service-list">{layanan.data.map((item) => <article className="service-item" key={item.id}><div className="service-icon"><FileText size={17} /></div><div className="service-copy"><h3>{item.nama_layanan}</h3><p>{item.deskripsi}</p></div><span className="audience">Mahasiswa</span><button type="button" className="service-button" onClick={() => onApply(item.id)}>Ajukan</button></article>)}</div>
        )}
      </section>
    </>
  )
}

// Pesan saat data masih dimuat, gagal dimuat, atau kosong.
export function StatusMuat({ state, kosong }) {
  if (state.status === 'memuat') return <p className="muted-copy" role="status">Memuat data...</p>
  if (state.status === 'galat') return <div className="flow-error" role="alert"><AlertCircle size={15} />{state.pesan}</div>
  if (state.data.length === 0) return <p className="muted-copy">{kosong}</p>
  return null
}

// tone = warna kartu (biru, oranye, hijau, ungu; lihat .stat-card.<tone> di mahasiswa.css).
function StatCard({ label, value, icon, tone }) {
  return <article className={`stat-card ${tone}`}><span>{label}</span><div className="stat-icon">{icon}</div><strong>{value}</strong><h3>{label}</h3><p>{label === 'Total Pengajuan' ? 'Semua pengajuan Anda.' : `${label} pengajuan Anda.`}</p></article>
}
