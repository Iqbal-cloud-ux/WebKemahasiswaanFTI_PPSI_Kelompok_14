import { AlertCircle, ChevronLeft } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { StatusMuat } from './BerandaMahasiswaPage.jsx'
import { DetailPengajuan } from './DetailPengajuan.jsx'

// Halaman detail satu pengajuan (/mahasiswa/riwayat/:noReferensi), menggantikan daftar Riwayat.
// Dibuka dari baris Riwayat, Beranda, atau Notifikasi. Pengajuan dicari dari daftar milik mahasiswa
// yang sedang login (pengajuan = { status, data, pesan } dari MahasiswaPortal); server tetap memeriksa
// hak akses saat detailnya diambil.
export function DetailRiwayatPage({ pengajuan, onPerbaiki, onKembali }) {
  const { noReferensi } = useParams()
  const submission = pengajuan.data.find((item) => item.id === noReferensi)

  return (
    <>
      <div className="breadcrumb">Layanan Kemahasiswaan FTI / Mahasiswa / Riwayat Pengajuan</div>
      <div className="submission-heading">
        <div><h1>Detail Pengajuan</h1><p>Status, berkas pendukung, dan catatan untuk pengajuan {noReferensi}.</p></div>
        <button type="button" className="submission-back-button" onClick={onKembali}><ChevronLeft size={16} /> Kembali ke Riwayat</button>
      </div>
      {!submission && pengajuan.status !== 'siap' && <StatusMuat state={pengajuan} kosong="" />}
      {!submission && pengajuan.status === 'siap' && <div className="flow-error" role="alert"><AlertCircle size={15} />Pengajuan {noReferensi} tidak ditemukan di riwayat Anda.</div>}
      {submission && <DetailPengajuan key={submission.pengajuanId} submission={submission} onPerbaiki={onPerbaiki} />}
    </>
  )
}
