import { CalendarDays } from 'lucide-react'
import { hariIni, rapikanAngka } from '../utils/isian.js'

// Satu kolom isian tambahan layanan (definisi dari server: nama, label, jenis, maks, petunjuk).
// jenis 'tanggal' = kalender (terbuka saat kolom diklik, tidak bisa memilih tanggal setelah hari ini);
// 'angka' dan 'desimal' = hanya angka yang bisa diketik; selain itu teks biasa.
export function InputIsian({ item, id, value, onChange }) {
  if (item.jenis === 'tanggal') {
    const bukaKalender = (event) => { try { event.currentTarget.showPicker?.() } catch { /* peramban lama: pakai ikon bawaan */ } }
    return (
      <span className="isian-tanggal">
        <input id={id} type="date" max={hariIni()} value={value} onClick={bukaKalender} onChange={(event) => onChange(event.target.value)} />
        <CalendarDays size={15} aria-hidden="true" />
      </span>
    )
  }
  const angka = item.jenis === 'angka' || item.jenis === 'desimal'
  return (
    <input
      id={id}
      type="text"
      inputMode={item.jenis === 'angka' ? 'numeric' : item.jenis === 'desimal' ? 'decimal' : undefined}
      maxLength={item.maks}
      value={value}
      onChange={(event) => onChange(angka ? rapikanAngka(item.jenis, event.target.value) : event.target.value)}
      placeholder={item.petunjuk || ''}
    />
  )
}
