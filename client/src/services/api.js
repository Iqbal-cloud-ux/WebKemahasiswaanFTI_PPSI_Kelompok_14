// Semua panggilan ke server ditulis di sini agar halaman tidak menulis ulang fetch dan token.
// Alamat /api diteruskan ke server Express oleh proxy di vite.config.js.

export const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` })

export const loginRequest = (identifier, password) => fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ identifier, password }),
})

export const logoutRequest = () => fetch('/api/auth/logout', { method: 'POST', headers: authHeader(), keepalive: true })

export const refreshRequest = () => fetch('/api/auth/refresh', { method: 'POST', headers: authHeader() })

export const sessionCheckRequest = () => fetch('/api/auth/me', { headers: authHeader() })

export const checkStaffAccess = () => fetch('/api/auth/khusus-staf', { headers: authHeader() })
