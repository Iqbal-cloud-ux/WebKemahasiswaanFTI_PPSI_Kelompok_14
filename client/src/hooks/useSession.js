import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logoutRequest, refreshRequest, sessionCheckRequest } from '../services/api.js'

// Sesi berakhir setelah 30 menit tanpa aktivitas (docs). Token server juga berlaku 30 menit
// dan diperpanjang paling sering tiap 5 menit selama pengguna aktif.
const SESSION_IDLE_MS = 30 * 60 * 1000
const SESSION_REFRESH_MS = 5 * 60 * 1000
const ACTIVITY_EVENTS = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart']

const loadStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'))
  } catch {
    return null
  }
}

// Menyimpan data login, memeriksa sesi ke server, dan mengakhiri sesi bila perlu.
export function useSession() {
  const navigate = useNavigate()
  const [user, setUser] = useState(loadStoredUser)
  const [sessionMessage, setSessionMessage] = useState(null)
  const isLoggedIn = Boolean(user)

  // Akhiri sesi di peramban (token dihapus) dan kembali ke halaman Login.
  const endSession = useCallback((message = null) => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setSessionMessage(message)
    setUser(null)
  }, [])

  // Periksa sesi ke server saat halaman dibuka. Bila token tidak berlaku lagi (401), keluarkan pengguna.
  useEffect(() => {
    if (!isLoggedIn) return undefined
    let active = true
    sessionCheckRequest()
      .then((response) => {
        if (active && response.status === 401) endSession('Sesi Anda sudah berakhir. Silakan masuk kembali.')
      })
      .catch(() => {})
    return () => { active = false }
  }, [isLoggedIn, endSession])

  // Selama pengguna aktif, perpanjang token. Setelah 30 menit tanpa aktivitas, keluar otomatis.
  const lastActivityRef = useRef(0)
  const lastRefreshRef = useRef(0)
  useEffect(() => {
    if (!isLoggedIn) return undefined
    lastActivityRef.current = Date.now()
    lastRefreshRef.current = Date.now()

    const refreshSession = () => {
      lastRefreshRef.current = Date.now()
      refreshRequest()
        .then(async (response) => {
          if (response.status === 401) {
            endSession('Sesi Anda sudah berakhir. Silakan masuk kembali.')
            return
          }
          const result = await response.json().catch(() => null)
          if (response.ok && result?.data?.token) localStorage.setItem('token', result.data.token)
        })
        .catch(() => {})
    }

    const handleActivity = () => {
      const now = Date.now()
      lastActivityRef.current = now
      if (now - lastRefreshRef.current >= SESSION_REFRESH_MS) refreshSession()
    }

    const idleTimer = window.setInterval(() => {
      if (Date.now() - lastActivityRef.current >= SESSION_IDLE_MS) {
        endSession('Sesi berakhir karena tidak ada aktivitas selama 30 menit. Silakan masuk kembali.')
      }
    }, 60 * 1000)

    ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, handleActivity, { passive: true }))
    return () => {
      window.clearInterval(idleTimer)
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, handleActivity))
    }
  }, [isLoggedIn, endSession])

  // Dipanggil halaman Login setelah server menerima NIM/email dan kata sandi.
  const login = (token, profile) => {
    // Token disimpan terpisah agar bisa diperpanjang tanpa mengubah data profil.
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(profile))
    // Pindah halaman diatur App.jsx: setelah user terisi, "/" dialihkan ke beranda peran.
    setSessionMessage(null)
    setUser(profile)
  }

  // Beri tahu server (untuk log_aktivitas), lalu hapus sesi di peramban tanpa menunggu balasan.
  // Keluar sendiri langsung ke Login tanpa mengingat halaman terakhir (beda dengan sesi berakhir,
  // yang mengingat halaman agar pengguna bisa melanjutkan setelah login lagi).
  const logout = () => {
    logoutRequest().catch(() => {})
    navigate('/', { replace: true })
    endSession()
  }

  // Simpan perubahan data profil di peramban (belum tersinkron ke server).
  const updateUser = (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser))
    setUser(updatedUser)
  }

  return { user, sessionMessage, login, logout, updateUser }
}
