import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PERISTIWA_SESI_DITOLAK, logoutRequest, refreshRequest, sessionCheckRequest } from '../services/api.js'

// Sesi berakhir setelah 30 menit tanpa aktivitas (docs). Token server juga berlaku 30 menit
// dan diperpanjang paling sering tiap 5 menit selama pengguna aktif.
const SESSION_IDLE_MS = 30 * 60 * 1000
const SESSION_REFRESH_MS = 5 * 60 * 1000
const ACTIVITY_EVENTS = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart']

// Pesan dari server saat sesi ditolak (misalnya akun ditutup karena lulus atau lewat masa studi);
// bila tidak ada, pesan umum sesi berakhir.
const pesanSesiBerakhir = async (response) => {
  const hasil = await response.json().catch(() => null)
  return hasil?.message || 'Sesi Anda sudah berakhir. Silakan masuk kembali.'
}

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

  // Tanya server apakah token masih berlaku. Bila ditolak (401, misalnya sesudah logout di perangkat lain
  // atau kata sandi diganti), keluarkan pengguna beserta alasan dari server.
  const periksaSesi = useCallback(() => {
    sessionCheckRequest()
      .then(async (response) => {
        if (response.status === 401) endSession(await pesanSesiBerakhir(response))
      })
      .catch(() => {})
  }, [endSession])

  // Periksa sesi saat halaman dibuka.
  useEffect(() => {
    if (isLoggedIn) periksaSesi()
  }, [isLoggedIn, periksaSesi])

  // Permintaan data apa pun yang ditolak 401 (services/api.js, bacaHasil) langsung mengakhiri sesi.
  useEffect(() => {
    if (!isLoggedIn) return undefined
    const saatDitolak = (event) => endSession(event.detail || 'Sesi Anda sudah berakhir. Silakan masuk kembali.')
    window.addEventListener(PERISTIWA_SESI_DITOLAK, saatDitolak)
    return () => window.removeEventListener(PERISTIWA_SESI_DITOLAK, saatDitolak)
  }, [isLoggedIn, endSession])

  // Tab lain di peramban yang sama memakai localStorage yang sama: ikuti logout atau login di tab itu.
  useEffect(() => {
    const saatStorage = (event) => {
      if (event.key !== null && event.key !== 'user') return
      const tersimpan = loadStoredUser()
      if (tersimpan) {
        setUser(tersimpan)
      } else if (isLoggedIn) {
        setSessionMessage('Anda sudah keluar di tab atau jendela lain. Silakan masuk kembali.')
        setUser(null)
      }
    }
    window.addEventListener('storage', saatStorage)
    return () => window.removeEventListener('storage', saatStorage)
  }, [isLoggedIn])

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
            endSession(await pesanSesiBerakhir(response))
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

    // Tiap menit: keluar bila 30 menit tidak aktif; selain itu tanya server apakah sesi masih berlaku,
    // agar logout atau ganti kata sandi di perangkat lain terasa paling lama satu menit kemudian.
    const idleTimer = window.setInterval(() => {
      if (Date.now() - lastActivityRef.current >= SESSION_IDLE_MS) {
        endSession('Sesi berakhir karena tidak ada aktivitas selama 30 menit. Silakan masuk kembali.')
      } else {
        periksaSesi()
      }
    }, 60 * 1000)

    ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, handleActivity, { passive: true }))
    return () => {
      window.clearInterval(idleTimer)
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, handleActivity))
    }
  }, [isLoggedIn, endSession, periksaSesi])

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

  // Simpan data profil terbaru di peramban setelah server menyimpan perubahan (halaman Profil).
  const updateUser = (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser))
    setUser(updatedUser)
  }

  return { user, sessionMessage, login, logout, updateUser }
}
