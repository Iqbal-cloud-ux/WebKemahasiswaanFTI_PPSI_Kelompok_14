import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { PenjagaPeran } from './components/PenjagaPeran.jsx'
import { useSession } from './hooks/useSession.js'
import { LoginPage } from './pages/auth/LoginPage.jsx'
import { TidakDitemukanPage } from './pages/galat/TidakDitemukanPage.jsx'
import { DekanPortal } from './pages/dekan/DekanPortal.jsx'
import { MahasiswaPortal } from './pages/mahasiswa/MahasiswaPortal.jsx'
import { PimpinanPortal } from './pages/pimpinan/PimpinanPortal.jsx'
import { PeranBelumTersediaPage } from './pages/PeranBelumTersediaPage.jsx'
import { StafPortal } from './pages/staf/StafPortal.jsx'
import { ROLE_ROUTES, homeRouteFor, normalizeRole } from './utils/roles.js'

// Kepala Kantor dan Wakil Dekan 1 memakai portal pimpinan yang sama (#89).
const PERAN_PIMPINAN = ['kepala-kantor', 'wakil-dekan']

// App hanya mendaftarkan rute. Setiap kelompok rute dijaga PenjagaPeran (#58):
// belum login -> Login, peran lain -> 403. Halaman tiap peran ada di pages/<peran>/.
function App() {
  const location = useLocation()
  const { user, sessionMessage, login, logout, updateUser } = useSession()
  const role = user ? normalizeRole(user.role) : null
  const home = homeRouteFor(user)

  // Setelah login: kembali ke alamat yang tadi dibuka (bila milik perannya), selain itu ke beranda.
  const dari = location.state?.dari
  const tujuan = dari && (dari === home || dari.startsWith(`${home}/`)) ? dari : home
  const halamanAwal = !user
    ? <LoginPage sessionMessage={sessionMessage} onLogin={login} />
    : role ? <Navigate to={tujuan} replace /> : <PeranBelumTersediaPage user={user} onLogout={logout} />

  return (
    <Routes>
      <Route path="/" element={halamanAwal} />
      <Route element={<PenjagaPeran user={user} peran="mahasiswa" />}>
        <Route path="/mahasiswa/*" element={<MahasiswaPortal user={user} onUpdateUser={updateUser} onLogout={logout} />} />
      </Route>
      <Route element={<PenjagaPeran user={user} peran="staf" />}>
        <Route path="/staf/*" element={<StafPortal user={user} onUpdateUser={updateUser} onLogout={logout} />} />
      </Route>
      {PERAN_PIMPINAN.map((peran) => (
        <Route key={peran} element={<PenjagaPeran user={user} peran={peran} />}>
          <Route path={`${ROLE_ROUTES[peran]}/*`} element={<PimpinanPortal user={user} onUpdateUser={updateUser} onLogout={logout} />} />
        </Route>
      ))}
      <Route element={<PenjagaPeran user={user} peran="dekan" />}>
        <Route path={`${ROLE_ROUTES.dekan}/*`} element={<DekanPortal user={user} onUpdateUser={updateUser} onLogout={logout} />} />
      </Route>
      {/* Alamat tidak dikenal: belum login -> Login (docs/alur-layar.md), sudah login -> 404. */}
      <Route path="*" element={user ? <TidakDitemukanPage beranda={home} /> : <Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
