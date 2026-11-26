// Semua panggilan ke server ditulis di sini agar halaman tidak menulis ulang fetch dan token.
// Alamat /api diteruskan ke server Express oleh proxy di vite.config.js.

export const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || ''}` })

export const loginRequest = (identifier, password) => fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ identifier, password }),
})

// Login pintasan per peran, KHUSUS pengujian lokal (server harus LOGIN_UJI=aktif; tombolnya hanya ada di mode dev).
export const loginUjiRequest = (role) => fetch('/api/auth/login-uji', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ role }),
})

export const logoutRequest =() => fetch('/api/auth/logout', { method: 'POST', headers: authHeader(), keepalive: true })

export const refreshRequest = () => fetch('/api/auth/refresh', { method: 'POST', headers: authHeader() })

export const sessionCheckRequest = () => fetch('/api/auth/me', { headers: authHeader() })

export const checkStaffAccess = () => fetch('/api/auth/khusus-staf', { headers: authHeader() })

// Membaca respons JSON server. Bila gagal, melempar Error berisi pesan dari server
// (status HTTP di error.status, rincian di error.rincian) agar halaman bisa menampilkannya.
export const bacaHasil = async (response) => {
  const hasil = await response.json().catch(() => null)
  if (!response.ok || !hasil?.success) {
    const galat = new Error(response.status === 401
      ? 'Sesi Anda sudah berakhir. Silakan masuk kembali.'
      : hasil?.message || 'Server tidak dapat dihubungi. Coba lagi beberapa saat lagi.')
    galat.status = response.status
    galat.rincian = hasil?.errors || null
    throw galat
  }
  return hasil.data
}

// Mahasiswa: formulir terisi data (PDF) untuk layanan yang memakai formulir unduhan. Respons berupa berkas PDF;
// bila gagal, respons JSON dibaca lewat bacaHasil.
export const unduhFormulirRequest = (layananId, dataIsian, noHp) => fetch(`/api/layanan/${encodeURIComponent(layananId)}/formulir`, {
  method: 'POST',
  headers: { ...authHeader(), 'Content-Type': 'application/json' },
  body: JSON.stringify({ data_isian: dataIsian, no_hp: noHp }),
})

// Layanan aktif beserta syarat dokumen (untuk mahasiswa juga berisi kelayakan tiap layanan).
export const daftarLayananRequest = () => fetch('/api/layanan', { headers: authHeader() })

// formData: jenis_layanan_id, keperluan, no_hp, berkas_<id syarat>. Content-Type diisi otomatis oleh peramban.
export const kirimPengajuanRequest = (formData) => fetch('/api/pengajuan', { method: 'POST', headers: authHeader(), body: formData })

export const pengajuanSayaRequest = () => fetch('/api/pengajuan/saya', { headers: authHeader() })

const kirimJson = (url, method, data) => fetch(url, {
  method,
  headers: { ...authHeader(), 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
})

// Profil milik pengguna yang login: ubah kontak (email, no_hp) dan ganti kata sandi.
export const ubahKontakRequest = ({ email, no_hp }) => kirimJson('/api/profil', 'PATCH', { email, no_hp })

export const ubahKataSandiRequest = ({ kata_sandi_lama, kata_sandi_baru }) => kirimJson('/api/profil/kata-sandi', 'PUT', { kata_sandi_lama, kata_sandi_baru })

// Staf: seluruh pengajuan, dan hasil pemeriksaan { keputusan, catatan, berkas: [{ id, status_verifikasi, catatan }] }.
export const daftarSemuaPengajuanRequest = () => fetch('/api/pengajuan', { headers: authHeader() })

export const periksaPengajuanRequest = (id, data) => kirimJson(`/api/pengajuan/${encodeURIComponent(id)}/pemeriksaan`, 'POST', data)

// Mahasiswa: kirim perbaikan (formData berisi berkas_<id syarat> pengganti dan keperluan bila diubah).
export const ajukanUlangRequest = (id, formData) => fetch(`/api/pengajuan/${encodeURIComponent(id)}/ajukan-ulang`, { method: 'PUT', headers: authHeader(), body: formData })

// Berkas persyaratan lewat endpoint yang memeriksa hak akses (bukan URL file langsung).
export const ambilBerkasRequest = (id) => fetch(`/api/berkas/${encodeURIComponent(id)}`, { headers: authHeader() })

// Notifikasi milik pengguna yang login.
export const notifikasiRequest = () => fetch('/api/notifikasi', { headers: authHeader() })

export const bacaNotifikasiRequest = (id) => fetch(`/api/notifikasi/${encodeURIComponent(id)}/baca`, { method: 'PATCH', headers: authHeader() })

export const bacaSemuaNotifikasiRequest = () => fetch('/api/notifikasi/baca-semua', { method: 'PATCH', headers: authHeader() })

// Staf: kelola jenis layanan, syarat, dan template surat (#79, #80).
export const kelolaLayananRequest = () => fetch('/api/layanan/kelola', { headers: authHeader() })

export const tambahLayananRequest = (data) => kirimJson('/api/layanan', 'POST', data)

export const ubahLayananRequest = (id, data) => kirimJson(`/api/layanan/${encodeURIComponent(id)}`, 'PUT', data)

export const statusLayananRequest = (id, aktif) => kirimJson(`/api/layanan/${encodeURIComponent(id)}/status`, 'PATCH', { is_active: aktif })

export const hapusLayananRequest = (id) => fetch(`/api/layanan/${encodeURIComponent(id)}`, { method: 'DELETE', headers: authHeader() })

export const simpanTemplateRequest = (id, data) => kirimJson(`/api/layanan/${encodeURIComponent(id)}/template`, 'PUT', data)
// Nomor urut surat terakhir tahun berjalan (satu urutan untuk semua surat). Surat berikutnya = nomor ini + 1.
export const aturNomorUrutRequest = (nomorTerakhir) => kirimJson('/api/layanan/nomor-surat', 'PUT', { nomor_terakhir: nomorTerakhir })

// Staf: draf surat (#81, #82). Pratinjau dan PDF draf mengembalikan berkas PDF, bukan JSON.
export const daftarDrafRequest = () => fetch('/api/draf', { headers: authHeader() })

export const detailDrafRequest = (pengajuanId) => fetch(`/api/draf/${encodeURIComponent(pengajuanId)}`, { headers: authHeader() })

export const simpanDrafRequest = (pengajuanId, isi) => kirimJson(`/api/draf/${encodeURIComponent(pengajuanId)}`, 'PUT', { isi_draf: isi })

export const pratinjauDrafRequest = (pengajuanId, isi) => kirimJson(`/api/draf/${encodeURIComponent(pengajuanId)}/pratinjau`, 'POST', { isi_draf: isi })

export const teruskanDrafRequest = (pengajuanId) => fetch(`/api/draf/${encodeURIComponent(pengajuanId)}/teruskan`, { method: 'POST', headers: authHeader() })

export const pdfDrafRequest = (pengajuanId) => fetch(`/api/draf/${encodeURIComponent(pengajuanId)}/pdf`, { headers: authHeader() })

// Kepala Kantor dan Wakil Dekan 1: paraf berjenjang (#88, #89).
export const antreanParafRequest = () => fetch('/api/paraf/antrean', { headers: authHeader() })

export const riwayatParafRequest = () => fetch('/api/paraf/riwayat', { headers: authHeader() })

export const detailParafRequest = (pengajuanId) => fetch(`/api/paraf/${encodeURIComponent(pengajuanId)}`, { headers: authHeader() })

export const setujuiParafRequest = (pengajuanId, catatan) => kirimJson(`/api/paraf/${encodeURIComponent(pengajuanId)}/setujui`, 'POST', { catatan })

export const kembalikanParafRequest = (pengajuanId, catatan) => kirimJson(`/api/paraf/${encodeURIComponent(pengajuanId)}/kembalikan`, 'POST', { catatan })

export const detailPengajuanRequest = (id) => fetch(`/api/pengajuan/${encodeURIComponent(id)}`, { headers: authHeader() })

// Dekan: antrean keputusan akhir, riwayat, dan tindakan penerbitan surat.
export const antreanDekanRequest = () => fetch('/api/dekan/antrean', { headers: authHeader() })

export const riwayatDekanRequest = () => fetch('/api/dekan/riwayat', { headers: authHeader() })

export const detailDekanRequest = (pengajuanId) => fetch(`/api/dekan/${encodeURIComponent(pengajuanId)}`, { headers: authHeader() })

export const setujuiKeputusanDekanRequest = (pengajuanId, catatan) => kirimJson(`/api/dekan/${encodeURIComponent(pengajuanId)}/setujui`, 'POST', { catatan })

export const kembalikanKeputusanDekanRequest = (pengajuanId, catatan) => kirimJson(`/api/dekan/${encodeURIComponent(pengajuanId)}/kembalikan`, 'POST', { catatan })

export const tolakKeputusanDekanRequest = (pengajuanId, catatan) => kirimJson(`/api/dekan/${encodeURIComponent(pengajuanId)}/tolak`, 'POST', { catatan })

// Surat final ber-QR hanya tersedia setelah persetujuan Dekan.
export const pdfSuratTerbitRequest = (pengajuanId) => fetch(`/api/surat/${encodeURIComponent(pengajuanId)}/pdf`, { headers: authHeader() })

export const pratinjauSuratTerbitRequest = (pengajuanId) => fetch(`/api/surat/${encodeURIComponent(pengajuanId)}/pdf?mode=pratinjau`, { headers: authHeader() })

// Staf: daftar arsip surat terbit dan kode QR privat untuk detail arsip.
export const daftarArsipSuratRequest = () => fetch('/api/surat/arsip', { headers: authHeader() })

export const qrSuratTerbitRequest = (pengajuanId) => fetch(`/api/surat/arsip/${encodeURIComponent(pengajuanId)}/qr`, { headers: authHeader() })

// Staf: laporan agregat dan ekspor CSV kompatibel Excel.
const parameterRekap = ({ mulai, sampai, jenisLayananId, status } = {}) => {
  const params = new URLSearchParams()
  if (mulai) params.set('mulai', mulai)
  if (sampai) params.set('sampai', sampai)
  if (jenisLayananId) params.set('jenis_layanan_id', jenisLayananId)
  if (status) params.set('status', status)
  return params.toString()
}

export const rekapRequest = (filter) => fetch(`/api/rekap?${parameterRekap(filter)}`, { headers: authHeader() })

export const eksporRekapCsvRequest = (filter) => fetch(`/api/rekap/ekspor?format=csv&${parameterRekap(filter)}`, { headers: authHeader() })

// Verifikasi keaslian surat dapat digunakan publik tanpa token login.
export const verifikasiSuratRequest = (payload) => fetch('/api/verifikasi', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
})
