import { useCallback, useEffect, useState } from 'react'
import { bacaHasil } from '../services/api.js'

// Mengambil data dari server lewat fungsi request di services/api.js.
// Mengembalikan [{ status: 'memuat' | 'siap' | 'galat', data, pesan }, muat]; muat() mengambil ulang data.
// awal = nilai data sebelum dan saat gagal dimuat (default: array kosong).
export function useDataServer(request, awal = []) {
  const [state, setState] = useState({ status: 'memuat', data: awal, pesan: '' })
  const [versi, setVersi] = useState(0)

  useEffect(() => {
    let aktif = true
    request()
      .then(bacaHasil)
      .then((data) => { if (aktif) setState({ status: 'siap', data, pesan: '' }) })
      .catch((galat) => { if (aktif) setState((lama) => ({ status: 'galat', data: lama.data, pesan: galat.message })) })
    return () => { aktif = false }
  }, [request, versi])

  const muat = useCallback(() => setVersi((v) => v + 1), [])
  return [state, muat]
}
