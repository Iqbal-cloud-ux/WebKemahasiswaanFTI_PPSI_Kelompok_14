// Bantuan untuk isian tambahan layanan (definisi dari server: nama, label, jenis, maks, petunjuk).
// Aturannya sama dengan server/src/utils/templateSurat.js; server tetap memeriksa ulang.

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

// Hari ini dalam format YYYY-MM-DD (zona waktu perangkat), untuk batas atas kalender.
export const hariIni = () => {
  const kini = new Date()
  return `${kini.getFullYear()}-${String(kini.getMonth() + 1).padStart(2, '0')}-${String(kini.getDate()).padStart(2, '0')}`
}

// Membuang karakter yang tidak boleh diketik. angka: hanya digit. desimal: digit dengan satu titik
// (koma diubah menjadi titik) dan paling banyak dua angka di belakang titik.
export const rapikanAngka = (jenis, teks) => {
  if (jenis === 'angka') return teks.replace(/\D/g, '')
  if (jenis === 'desimal') {
    const [depan, ...belakang] = teks.replace(/,/g, '.').replace(/[^\d.]/g, '').split('.')
    return belakang.length ? `${depan}.${belakang.join('').slice(0, 2)}` : depan
  }
  return teks
}

// Nilai isian untuk ditampilkan: tanggal "2002-04-24" menjadi "24 April 2002"; kosong menjadi "-".
export const tampilIsian = (item, nilai) => {
  const teks = String(nilai || '').trim()
  if (!teks) return '-'
  const cocok = item.jenis === 'tanggal' && /^(\d{4})-(\d{2})-(\d{2})$/.exec(teks)
  return cocok ? `${Number(cocok[3])} ${BULAN[Number(cocok[2]) - 1]} ${cocok[1]}` : teks
}
