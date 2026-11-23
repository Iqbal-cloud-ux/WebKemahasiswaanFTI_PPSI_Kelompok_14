import { SearchX } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { KartuPesanPenuh, KartuPesanPortal } from '../../components/KartuPesan.jsx'

// 404: alamat tidak ada (#58). dalamPortal = tampil di dalam kerangka portal (sidebar tetap ada).
export function TidakDitemukanPage({ beranda, dalamPortal = false }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const pesan = `Halaman ${pathname} tidak ditemukan (404). Periksa kembali alamatnya atau kembali ke Beranda.`
  const kembali = () => navigate(beranda, { replace: true })

  return dalamPortal
    ? <KartuPesanPortal ikon={SearchX} pesan={pesan} tombol="Kembali ke Beranda" onTombol={kembali} />
    : <KartuPesanPenuh judul="Halaman tidak ditemukan" pesan={pesan} tombol="Kembali ke Beranda" onTombol={kembali} />
}
