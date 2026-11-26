import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
// Urutan impor CSS penting (aturan di file belakang menang bila sama kuat). Jangan diubah sembarangan.
import './layouts/portal.css'
import './pages/staf/staf.css'
import './styles/dasar.css'
import './pages/auth/login.css'
import './pages/verifikasi/verifikasi.css'
import './pages/mahasiswa/mahasiswa.css'
import './pages/pimpinan/pimpinan.css'
import App from './App.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import { pasangValidasiForm } from './utils/validasiForm.js'

// Kolom yang salah atau kosong ditandai merah dan difokuskan, tanpa gelembung bawaan browser.
pasangValidasiForm()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary penuh>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
