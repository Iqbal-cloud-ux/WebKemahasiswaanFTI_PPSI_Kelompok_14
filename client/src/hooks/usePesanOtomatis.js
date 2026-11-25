import { useEffect, useRef } from 'react'

// Menutup pesan secara otomatis setelah beberapa detik (default 5 detik).
// Dipakai untuk pesan berhasil. Pesan galat sebaiknya tidak ditutup otomatis agar pengguna sempat
// membacanya; berikan aktif = false untuk pesan galat, sehingga pesan itu hanya ditutup lewat tombol X.
//
// Contoh: usePesanOtomatis(notice, () => setNotice(null), notice?.type === 'success')
export function usePesanOtomatis(pesan, tutup, aktif = true, jeda = 5000) {
  // Simpan fungsi tutup terbaru di ref, agar timer tidak diulang setiap kali halaman dirender ulang.
  const tutupRef = useRef(tutup)
  useEffect(() => { tutupRef.current = tutup })

  useEffect(() => {
    if (!pesan || !aktif) return undefined
    const timer = setTimeout(() => tutupRef.current(), jeda)
    return () => clearTimeout(timer)
  }, [pesan, aktif, jeda])
}
