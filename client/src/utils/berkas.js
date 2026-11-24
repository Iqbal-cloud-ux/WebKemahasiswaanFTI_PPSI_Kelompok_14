// Aturan berkas sama dengan server (AGENTS.md aturan 1): PDF/JPG/PNG, maksimal 5 MB. Server tetap memeriksa ulang.
export const UKURAN_MAKS = 5 * 1024 * 1024
export const EKSTENSI_DITERIMA = ['.pdf', '.jpg', '.jpeg', '.png']
export const ACCEPT_BERKAS = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png'

// Mengembalikan pesan galat bila berkas ditolak, atau null bila boleh diunggah.
export const periksaBerkas = (file) => {
  const ekstensi = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  if (!EKSTENSI_DITERIMA.includes(ekstensi)) return `Berkas "${file.name}" tidak didukung. Gunakan PDF, JPG, atau PNG.`
  if (file.size > UKURAN_MAKS) return `Berkas "${file.name}" berukuran ${(file.size / 1024 / 1024).toFixed(1)} MB. Ukuran maksimal 5 MB.`
  return null
}

export const ukuranTampil = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`)
