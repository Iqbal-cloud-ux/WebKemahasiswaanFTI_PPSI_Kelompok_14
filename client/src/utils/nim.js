// Struktur NIM sarjana Universitas Andalas (10 digit): digit 1-2 tahun masuk, digit 3 jenjang (1 = S1),
// digit 4-5 fakultas (15 = FTI). Salinan aturan server/src/utils/nim.js; server tetap memeriksa ulang.
const JENJANG_DARI_KODE = { 1: 'S1' }

// { angkatan, jenjang } atau null bila NIM belum 10 digit angka. jenjang null = kodenya belum dikenal.
export const bacaNim = (nim) => {
  const teks = String(nim ?? '').trim()
  if (!/^\d{10}$/.test(teks)) return null
  return { angkatan: 2000 + Number(teks.slice(0, 2)), jenjang: JENJANG_DARI_KODE[teks[2]] || null }
}
