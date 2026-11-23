import { useSession } from './hooks/useSession.js'
import { LoginPage } from './pages/auth/LoginPage.jsx'
import { MahasiswaPortal } from './pages/mahasiswa/MahasiswaPortal.jsx'
import { PeranBelumTersediaPage } from './pages/PeranBelumTersediaPage.jsx'
import { StafPortal } from './pages/staf/StafPortal.jsx'
import { ROLE_LABELS, normalizeRole } from './utils/roles.js'

// App hanya memilih portal sesuai peran pengguna yang sedang login.
// Halaman tiap peran ada di pages/<peran>/, kerangka sidebar di layouts/.
function App() {
  const { user, sessionMessage, login, logout, updateUser } = useSession()

  if (!user) return <LoginPage sessionMessage={sessionMessage} onLogin={login} />

  const role = normalizeRole(user.role)
  if (role === 'mahasiswa') return <MahasiswaPortal user={user} onUpdateUser={updateUser} onLogout={logout} />
  if (role === 'staf') return <StafPortal user={user} onLogout={logout} />
  return <PeranBelumTersediaPage user={user} roleLabel={ROLE_LABELS[role]} onLogout={logout} />
}

export default App
