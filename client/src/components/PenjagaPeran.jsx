import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { AksesDitolakPage } from '../pages/galat/AksesDitolakPage.jsx'
import { normalizeRole } from '../utils/roles.js'

// Penjaga halaman per peran (#58), dipasang di App.jsx untuk tiap kelompok rute.
// - Belum login: ke halaman Login; alamat tujuan diingat agar bisa kembali setelah login.
// - Peran tidak sesuai: halaman 403 Akses ditolak.
// Ini hanya pengaman tampilan. Pemeriksaan sebenarnya tetap di server
// (verifyToken -> 401, checkRole -> 403), karena kode client bisa diubah pengguna.
export function PenjagaPeran({ user, peran }) {
  const location = useLocation()
  if (!user) return <Navigate to="/" replace state={{ dari: location.pathname }} />
  if (normalizeRole(user.role) !== peran) return <AksesDitolakPage user={user} />
  return <Outlet />
}
