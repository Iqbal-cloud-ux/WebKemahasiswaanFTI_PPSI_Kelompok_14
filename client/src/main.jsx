import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Urutan impor CSS penting (aturan di file belakang menang bila sama kuat). Jangan diubah sembarangan.
import './layouts/portal.css'
import './pages/staf/staf.css'
import './styles/dasar.css'
import './pages/auth/login.css'
import './pages/mahasiswa/mahasiswa.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
