// Semester berjalan dari angkatan (sama dengan server/src/utils/semester.js: semester ganjil mulai Agustus).
export const hitungSemester = (angkatan, tanggal = new Date()) => {
  const tahunMasuk = Number(angkatan)
  if (!Number.isInteger(tahunMasuk) || tahunMasuk <= 0) return null
  const selisih = tanggal.getFullYear() - tahunMasuk
  const semester = tanggal.getMonth() + 1 >= 8 ? selisih * 2 + 1 : selisih * 2
  return semester > 0 ? semester : null
}

export const teksSemester = (angkatan) => {
  const semester = hitungSemester(angkatan)
  return semester ? `Semester ${semester} (angkatan ${angkatan})` : 'Belum tercatat'
}
