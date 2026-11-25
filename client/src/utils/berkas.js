// Aturan berkas sama dengan server (AGENTS.md aturan 1): PDF/JPG/PNG, maksimal 5 MB. Server tetap memeriksa ulang.
// Syarat tertentu hanya menerima sebagian jenis (syarat_layanan.tipe_file), misalnya pas foto hanya JPG/PNG.
export const UKURAN_MAKS = 5 * 1024 * 1024
export const EKSTENSI_DITERIMA = ['.pdf', '.jpg', '.jpeg', '.png']
export const ACCEPT_BERKAS = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png'

const ACCEPT_PER_TIPE = { pdf: '.pdf,application/pdf', jpg: '.jpg,.jpeg,image/jpeg', png: '.png,image/png' }

// 'jpg,png' -> ['jpg', 'png']; kosong = semua jenis yang diterima sistem.
const daftarTipe = (tipeFile) => {
  const tipe = String(tipeFile || 'pdf,jpg,png').toLowerCase().split(',').map((t) => t.trim()).filter((t) => ACCEPT_PER_TIPE[t])
  return tipe.length ? tipe : ['pdf', 'jpg', 'png']
}

// Nilai atribut accept untuk input berkas sebuah syarat.
export const acceptUntuk = (tipeFile) => daftarTipe(tipeFile).map((t) => ACCEPT_PER_TIPE[t]).join(',')

// Teks jenis berkas untuk ditampilkan, misalnya "JPG/PNG".
export const teksTipe = (tipeFile) => daftarTipe(tipeFile).map((t) => t.toUpperCase()).join('/')

// Mengembalikan pesan galat bila berkas ditolak, atau null bila boleh diunggah.
export const periksaBerkas = (file, tipeFile) => {
  const ekstensi = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  const tipe = daftarTipe(tipeFile)
  const cocok = EKSTENSI_DITERIMA.includes(ekstensi) && tipe.includes(ekstensi === '.jpeg' ? 'jpg' : ekstensi.slice(1))
  if (!cocok) return `Berkas "${file.name}" tidak didukung. Gunakan ${tipe.map((t) => t.toUpperCase()).join(', ').replace(/, ([^,]*)$/, ' atau $1')}.`
  if (file.size > UKURAN_MAKS) return `Berkas "${file.name}" berukuran ${(file.size / 1024 / 1024).toFixed(1)} MB. Ukuran maksimal 5 MB.`
  return null
}

export const ukuranTampil = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`)
