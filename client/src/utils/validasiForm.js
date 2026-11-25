// Penanda kolom isian yang salah atau belum diisi.
// Kolom yang salah diberi aria-invalid="true" (tampil merah lewat CSS di styles/dasar.css), lalu layar
// digulir ke kolom itu dan kursor diletakkan di sana. Gelembung bawaan browser
// ("Please fill out this field") tidak dipakai.

const PENANDA = 'data-ditandai-salah'

// Tandai satu kolom sebagai salah. Bila fokus = true, gulir ke kolom itu dan letakkan kursor di sana.
export function tandaiSalah(kolom, fokus = true) {
  if (!kolom) return
  kolom.setAttribute('aria-invalid', 'true')
  kolom.setAttribute(PENANDA, '')
  if (fokus) {
    kolom.scrollIntoView({ behavior: 'smooth', block: 'center' })
    kolom.focus({ preventScroll: true })
  }
}

// Hapus tanda merah dari kolom yang sebelumnya ditandai lewat tandaiSalah().
// Tanda aria-invalid yang diatur sendiri oleh halaman (tanpa penanda) tidak disentuh.
export function hapusTandaSalah(kolom) {
  if (!kolom?.hasAttribute?.(PENANDA)) return
  kolom.removeAttribute('aria-invalid')
  kolom.removeAttribute(PENANDA)
}

// Dipasang sekali di main.jsx. Berlaku untuk semua formulir yang memakai atribut HTML seperti
// required atau type="email": gelembung browser dimatikan, kolom pertama yang salah diberi warna merah
// dan difokuskan. Tanda merah hilang sendiri begitu isi kolom sudah benar.
export function pasangValidasiForm() {
  let sudahFokus = false

  document.addEventListener('invalid', (event) => {
    event.preventDefault() // matikan gelembung "Please fill out this field"
    tandaiSalah(event.target, !sudahFokus)
    if (!sudahFokus) {
      sudahFokus = true
      // Satu kali kirim formulir memicu beberapa event invalid sekaligus; fokus hanya ke kolom pertama.
      setTimeout(() => { sudahFokus = false }, 0)
    }
  }, true)

  const periksaUlang = (event) => {
    const kolom = event.target
    if (kolom?.hasAttribute?.(PENANDA) && (!kolom.validity || kolom.validity.valid)) hapusTandaSalah(kolom)
  }
  document.addEventListener('input', periksaUlang, true)
  document.addEventListener('change', periksaUlang, true)
}
