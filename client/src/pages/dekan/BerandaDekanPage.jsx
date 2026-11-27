import { AlertCircle, ArrowRight, ClipboardCheck, Clock3, Eye, PenLine, ShieldCheck, Undo2, X } from 'lucide-react'
import { useDataServer } from '../../hooks/useDataServer.js'
import { antreanDekanRequest, riwayatDekanRequest } from '../../services/api.js'
import { formatWaktu, hariSejak } from '../../utils/statusPengajuan.js'

const BATAS_TUNGGU_HARI = 2
const JUMLAH_RINGKAS = 5
const KEPUTUSAN = {
  approved: { label: 'Disetujui', kelas: 'selesai' },
  returned: { label: 'Dikembalikan', kelas: 'perlu-perbaikan' },
  rejected: { label: 'Ditolak', kelas: 'ditolak' },
}

const bulanIni = (nilai) => {
  const tanggal = new Date(nilai)
  const sekarang = new Date()
  return tanggal.getFullYear() === sekarang.getFullYear() && tanggal.getMonth() === sekarang.getMonth()
}

// Beranda Dekan (docs/alur-layar.md): statistik permohonan, metode pengesahan, dan surat yang menunggu
// keputusan. Data diambil dari endpoint antrean dan riwayat Dekan yang sudah ada.
// Status penyedia TTE menyusul bersama Pengaturan TTE (#92).
export function BerandaDekanPage({ onTinjau, onBukaAntrean, onBukaRiwayat }) {
  const [antrean] = useDataServer(antreanDekanRequest)
  const [riwayat] = useDataServer(riwayatDekanRequest, { statistik: {}, riwayat: [] })

  const siapAntrean = antrean.status === 'siap'
  const siapRiwayat = riwayat.status === 'siap'
  const lewat = antrean.data.filter((item) => hariSejak(item.masuk_tahap_at) > BATAS_TUNGGU_HARI).length
  const keputusanBulanIni = riwayat.data.riwayat.filter((item) => bulanIni(item.created_at))
  const hitungBulanIni = (kode) => (siapRiwayat ? keputusanBulanIni.filter((item) => item.keputusan === kode).length : '-')
  const namaBulan = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

  return (
    <>
      <div className="staff-breadcrumb">Layanan Kemahasiswaan FTI <span>/</span> Beranda</div>
      <div className="staff-dashboard-heading"><h1>Beranda</h1><p>Ringkasan permohonan dan surat yang menunggu keputusan Anda.</p></div>

      {antrean.status === 'galat' && <div className="staff-notice error" role="alert"><AlertCircle size={16} /><span>{antrean.pesan}</span></div>}
      {riwayat.status === 'galat' && <div className="staff-notice error" role="alert"><AlertCircle size={16} /><span>{riwayat.pesan}</span></div>}

      <section className="staff-stats-grid pimpinan-stats" aria-label="Statistik permohonan">
        <article className="staff-stat-card featured"><span>Menunggu Keputusan</span><ClipboardCheck size={17} /><strong>{siapAntrean ? antrean.data.length : '-'}</strong><b>Antrean Dekan</b><small>Sudah diparaf lengkap</small></article>
        <article className="staff-stat-card"><span>Menunggu &gt; {BATAS_TUNGGU_HARI} Hari</span><Clock3 size={17} /><strong>{siapAntrean ? lewat : '-'}</strong><b>Perlu didahulukan</b><small>Sejak masuk tahap Dekan</small></article>
        <article className="staff-stat-card"><span>Disetujui</span><PenLine size={17} /><strong>{hitungBulanIni('approved')}</strong><b>Surat diterbitkan</b><small>{namaBulan}</small></article>
        <article className="staff-stat-card"><span>Dikembalikan</span><Undo2 size={17} /><strong>{hitungBulanIni('returned')}</strong><b>Untuk direvisi</b><small>{namaBulan}</small></article>
        <article className="staff-stat-card"><span>Ditolak</span><X size={17} /><strong>{hitungBulanIni('rejected')}</strong><b>Keputusan akhir</b><small>{namaBulan}</small></article>
      </section>

      <div className="staff-notice info dekan-pengesahan" role="note">
        <span><ShieldCheck size={16} /> Metode pengesahan saat ini: persetujuan elektronik beserta kode verifikasi (QR berisi nomor surat dan sidik jari SHA-256).</span>
      </div>

      <section className="staff-panel staff-queue-panel">
        <div className="staff-panel-heading">
          <div><h2>Surat Menunggu Keputusan</h2><p>Paling lama menunggu ditampilkan lebih dulu.</p></div>
          {antrean.data.length > JUMLAH_RINGKAS && <button type="button" className="staff-review-button dekan-lihat-semua" onClick={onBukaAntrean}>Lihat semua ({antrean.data.length}) <ArrowRight size={13} /></button>}
        </div>
        <div className="staff-table-wrap">
          <table className="staff-submission-table">
            <thead><tr><th>Nomor Pengajuan</th><th>Mahasiswa / NIM</th><th>Jenis Surat</th><th>Lama Menunggu</th><th>Aksi</th></tr></thead>
            <tbody>
              {antrean.data.slice(0, JUMLAH_RINGKAS).map((item) => {
                const hari = hariSejak(item.masuk_tahap_at)
                return (
                  <tr key={item.pengajuan_id}>
                    <td>{item.no_referensi}</td>
                    <td><strong>{item.mahasiswa.nama}</strong><span>{item.mahasiswa.nim}</span></td>
                    <td>{item.nama_layanan}</td>
                    <td className={hari > BATAS_TUNGGU_HARI ? 'staff-waiting overdue' : 'staff-waiting'}>{hari > BATAS_TUNGGU_HARI && <span>△ </span>}{hari === 0 ? 'Hari ini' : `${hari} hari`}</td>
                    <td><button type="button" className="staff-review-button" onClick={() => onTinjau(item.pengajuan_id)}><Eye size={13} /> Tinjau</button></td>
                  </tr>
                )
              })}
              {antrean.status === 'memuat' && <tr><td className="staff-empty-results" colSpan="5">Memuat antrean...</td></tr>}
              {siapAntrean && antrean.data.length === 0 && <tr><td className="staff-empty-results" colSpan="5">Tidak ada surat yang menunggu keputusan Anda.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="staff-panel staff-queue-panel">
        <div className="staff-panel-heading">
          <div><h2>Keputusan Terakhir</h2><p>Lima keputusan terbaru Anda.</p></div>
          {riwayat.data.riwayat.length > 0 && <button type="button" className="staff-review-button dekan-lihat-semua" onClick={onBukaRiwayat}>Riwayat lengkap <ArrowRight size={13} /></button>}
        </div>
        <div className="staff-table-wrap">
          <table className="staff-submission-table">
            <thead><tr><th>Waktu Keputusan</th><th>Mahasiswa / NIM</th><th>Pengajuan</th><th>Keputusan</th></tr></thead>
            <tbody>
              {riwayat.data.riwayat.slice(0, JUMLAH_RINGKAS).map((item) => (
                <tr key={item.id}>
                  <td>{formatWaktu(item.created_at)}</td>
                  <td><strong>{item.mahasiswa.nama}</strong><span>{item.mahasiswa.nim}</span></td>
                  <td>{item.no_referensi}<small className="pimpinan-sub">{item.nama_layanan}</small></td>
                  <td><span className={`staff-submission-status status-${KEPUTUSAN[item.keputusan]?.kelas}`}>{KEPUTUSAN[item.keputusan]?.label || item.keputusan}</span></td>
                </tr>
              ))}
              {riwayat.status === 'memuat' && <tr><td className="staff-empty-results" colSpan="4">Memuat riwayat...</td></tr>}
              {siapRiwayat && riwayat.data.riwayat.length === 0 && <tr><td className="staff-empty-results" colSpan="4">Belum ada keputusan.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
