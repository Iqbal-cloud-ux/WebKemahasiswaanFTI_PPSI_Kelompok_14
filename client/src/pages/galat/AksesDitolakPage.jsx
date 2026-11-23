import { useNavigate } from 'react-router-dom'
import { KartuPesanPenuh } from '../../components/KartuPesan.jsx'
import { ROLE_LABELS, homeRouteFor, normalizeRole } from '../../utils/roles.js'

// 403: pengguna sudah login tetapi membuka halaman milik peran lain (#58).
export function AksesDitolakPage({ user }) {
  const navigate = useNavigate()
  const label = ROLE_LABELS[normalizeRole(user.role)]
  return (
    <KartuPesanPenuh
      alert
      judul="Akses ditolak (403)"
      pesan={`Halaman ini tidak dapat dibuka dengan akun ${label || 'Anda'}. Setiap pengguna hanya dapat membuka halaman sesuai perannya.`}
      tombol="Kembali ke Beranda"
      onTombol={() => navigate(homeRouteFor(user), { replace: true })}
    />
  )
}
