// Alamat beranda tiap peran (pola rute mengikuti docs/alur-layar.md).
export const ROLE_ROUTES = {
  mahasiswa: '/mahasiswa',
  staf: '/staf',
  'kepala-kantor': '/kepala-kantor',
  'wakil-dekan': '/wakil-dekan',
  dekan: '/dekan',
}

export const ROLE_LABELS = {
  mahasiswa: 'Mahasiswa',
  staf: 'Staf Akademik',
  'kepala-kantor': 'Kepala Kantor',
  'wakil-dekan': 'Wakil Dekan',
  dekan: 'Dekan',
}

// Nilai kolom users.role di database: ENUM('mahasiswa','staf','kakor','wadek1','dekan').
const DB_ROLES = {
  mahasiswa: 'mahasiswa',
  staf: 'staf',
  kakor: 'kepala-kantor',
  wadek1: 'wakil-dekan',
  dekan: 'dekan',
}

export const normalizeRole = (role) => DB_ROLES[role] || null

export const homeRouteFor = (user) => (user ? ROLE_ROUTES[normalizeRole(user.role)] || '/' : '/')
