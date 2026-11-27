import { useState } from 'react'
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, KeyRound, Pencil, RefreshCw, Search, UserCheck, X } from 'lucide-react'
import { useDataServer } from '../../hooks/useDataServer.js'
import { usePesanOtomatis } from '../../hooks/usePesanOtomatis.js'
import { aktifkanAkunRequest, bacaHasil, daftarAkunRequest, resetSandiAkunRequest, ubahAkunRequest } from '../../services/api.js'
import { bacaNim } from '../../utils/nim.js'
import { ROLE_LABELS, normalizeRole } from '../../utils/roles.js'

const PAGE_SIZE = 10
// Sama dengan daftar di server/src/services/akunService.js dan server/src/utils/statusStudi.js.
const JENJANG = ['D3', 'D4', 'S1', 'S2', 'S3']
const MAKS_SEMESTER = 14
// Status akun (status_studi.kode dari server) -> label filter dan warna lencana.
const STATUS_AKUN = {
  aktif: { label: 'Aktif', kelas: 'status-selesai' },
  masa_tenggang: { label: 'Lulus (masa tenggang)', kelas: 'status-menunggu-persetujuan' },
  lulus: { label: 'Lulus', kelas: 'status-diproses' },
  lewat_masa_studi: { label: 'Lewat masa studi', kelas: 'status-perlu-perbaikan' },
  nonaktif: { label: 'Nonaktif', kelas: 'status-ditolak' },
}

const labelPeran = (role) => ROLE_LABELS[normalizeRole(role)] || role
const hariIni = () => {
  const sekarang = new Date()
  return `${sekarang.getFullYear()}-${String(sekarang.getMonth() + 1).padStart(2, '0')}-${String(sekarang.getDate()).padStart(2, '0')}`
}
const formatTanggal = (nilai) => (nilai
  ? new Date(`${nilai}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  : '-')

const isianDari = (akun) => ({
  identifier: akun.identifier || '',
  nama: akun.nama || '',
  email: akun.email || '',
  no_hp: akun.no_hp || '',
  prodi: akun.prodi || '',
  jenjang: akun.jenjang || '',
  tgl_lulus: akun.tgl_lulus || '',
  tambahan_semester: String(akun.tambahan_semester || 0),
})

// Keterangan kecil di bawah lencana status: semester berjalan atau tanggal akun ditutup.
const keteranganStatus = (status) => {
  if (status.kode === 'masa_tenggang') return `Ditutup ${formatTanggal(status.tutup_pada)}`
  if (status.kode === 'lulus') return `Ditutup sejak ${formatTanggal(status.tutup_pada)}`
  if (status.semester) return `Semester ${status.semester} dari ${status.batas_semester}`
  return null
}

// Manajemen Data dan Akun (#131): daftar akun beserta status studi, perbaikan data identitas mahasiswa,
// tanda lulus, perpanjangan masa studi karena cuti, dan pengaktifan kembali akun yang dinonaktifkan manual.
// Status akun mahasiswa dihitung server (utils/statusStudi.js). Akun peran lain hanya ditampilkan.
export function ManajemenAkunPage() {
  const [akun, muatAkun] = useDataServer(daftarAkunRequest)
  const [cari, setCari] = useState('')
  const [peran, setPeran] = useState('mahasiswa')
  const [status, setStatus] = useState('semua')
  const [page, setPage] = useState(1)
  const [sunting, setSunting] = useState(null) // { id, isian }
  const [menyimpan, setMenyimpan] = useState(false)
  const [pesan, setPesan] = useState(null) // { jenis: 'success' | 'error', teks }
  const [sandiSementara, setSandiSementara] = useState(null) // { nama, identifier, sandi }; hanya di memori halaman
  usePesanOtomatis(pesan, () => setPesan(null), pesan?.jenis === 'success')

  const kataKunci = cari.trim().toLowerCase()
  const tersaring = akun.data
    .filter((item) => peran === 'semua' || item.role === peran)
    .filter((item) => status === 'semua' || item.status_studi.kode === status)
    .filter((item) => `${item.nama} ${item.identifier} ${item.email}`.toLowerCase().includes(kataKunci))
  const pageCount = Math.max(1, Math.ceil(tersaring.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const tampil = tersaring.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const jumlahTertutup = akun.data.filter((item) => item.role === 'mahasiswa' && !['aktif', 'masa_tenggang'].includes(item.status_studi.kode)).length
  const dariNim = sunting ? bacaNim(sunting.isian.identifier) : null

  const ubahFilter = (setter) => (event) => { setter(event.target.value); setPage(1) }
  const ubahIsian = (kolom) => (event) => setSunting((lama) => ({ ...lama, isian: { ...lama.isian, [kolom]: event.target.value } }))

  const mulaiSunting = (item) => {
    setPesan(null)
    setSunting({ id: item.id, isian: isianDari(item) })
  }

  const simpan = async (event) => {
    event.preventDefault()
    setMenyimpan(true)
    setPesan(null)
    try {
      const hasil = await bacaHasil(await ubahAkunRequest(sunting.id, sunting.isian))
      setPesan({
        jenis: 'success',
        teks: hasil.berubah.length ? `Data ${hasil.akun.nama} disimpan (${hasil.berubah.join(', ')}).` : 'Tidak ada data yang berubah.',
      })
      setSunting(null)
      muatAkun()
    } catch (galat) {
      setPesan({ jenis: 'error', teks: galat.message })
    } finally {
      setMenyimpan(false)
    }
  }

  const aktifkan = async (item) => {
    if (!window.confirm(`Aktifkan kembali akun ${item.nama} (${item.identifier})? Mahasiswa ini akan bisa masuk lagi.`)) return
    setMenyimpan(true)
    setPesan(null)
    try {
      await bacaHasil(await aktifkanAkunRequest(item.id))
      setPesan({ jenis: 'success', teks: `Akun ${item.nama} sudah aktif kembali.` })
      muatAkun()
    } catch (galat) {
      setPesan({ jenis: 'error', teks: galat.message })
    } finally {
      setMenyimpan(false)
    }
  }

  const resetSandi = async (item) => {
    if (!window.confirm(`Reset kata sandi ${item.nama} (${item.identifier})? Semua sesinya langsung berakhir, dan ia harus masuk dengan kata sandi sementara lalu menggantinya.`)) return
    setMenyimpan(true)
    setPesan(null)
    setSandiSementara(null)
    try {
      const hasil = await bacaHasil(await resetSandiAkunRequest(item.id))
      setSandiSementara({ nama: item.nama, identifier: item.identifier, sandi: hasil.kata_sandi_sementara })
    } catch (galat) {
      setPesan({ jenis: 'error', teks: galat.message })
    } finally {
      setMenyimpan(false)
    }
  }

  const akunDisunting = sunting && akun.data.find((item) => item.id === sunting.id)

  return (
    <>
      <div className="staff-submissions-heading">
        <div className="staff-breadcrumb">Layanan Kemahasiswaan FTI <span>/</span> Manajemen Akun</div>
        <h1>Manajemen Data dan Akun</h1>
        <p>Periksa dan perbaiki data mahasiswa. Akun mahasiswa ditutup otomatis 30 hari setelah lulus, atau bila masa studi melewati {MAKS_SEMESTER} semester tanpa perpanjangan.</p>
      </div>

      {pesan && (
        <div className={`staff-notice ${pesan.jenis}`} role={pesan.jenis === 'error' ? 'alert' : 'status'}>
          {pesan.jenis === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{pesan.teks}</span>
          <button type="button" className="staff-akun-tutup" onClick={() => setPesan(null)} aria-label="Tutup pesan"><X size={15} /></button>
        </div>
      )}

      {sandiSementara && (
        <section className="staff-panel staff-akun-form-panel staff-akun-sandi" aria-label="Kata sandi sementara" role="status">
          <div className="staff-panel-heading">
            <div>
              <h2><KeyRound size={15} /> Kata sandi sementara untuk {sandiSementara.nama} ({sandiSementara.identifier})</h2>
              <p>Sampaikan langsung kepada mahasiswa (tatap muka atau pesan pribadi). Kata sandi ini tidak akan ditampilkan lagi dan wajib diganti saat ia masuk.</p>
            </div>
            <button type="button" className="staff-akun-tutup" onClick={() => setSandiSementara(null)} aria-label="Tutup kata sandi sementara"><X size={15} /></button>
          </div>
          <code className="staff-akun-sandi-teks">{sandiSementara.sandi}</code>
        </section>
      )}

      {sunting && (
        <section className="staff-panel staff-akun-form-panel" aria-label="Ubah data mahasiswa">
          <div className="staff-panel-heading">
            <div>
              <h2>Ubah Data Mahasiswa</h2>
              <p>{akunDisunting ? `${akunDisunting.nama} · ${akunDisunting.identifier}` : ''}. Kata sandi dan peran akun tidak diubah di sini.</p>
            </div>
          </div>
          <form onSubmit={simpan}>
            <div className="staff-akun-form-grid">
              <label className="staff-profile-input" htmlFor="akun-nim">
                <span>NIM</span>
                <input id="akun-nim" inputMode="numeric" required maxLength={10} pattern="[0-9]{3}15[0-9]{5}" title="NIM FTI: 10 digit angka, digit ke-4 dan ke-5 = 15" value={sunting.isian.identifier} onChange={ubahIsian('identifier')} />
              </label>
              <label className="staff-profile-input" htmlFor="akun-nama">
                <span>Nama</span>
                <input id="akun-nama" required maxLength={100} value={sunting.isian.nama} onChange={ubahIsian('nama')} />
              </label>
              <label className="staff-profile-input" htmlFor="akun-email">
                <span>Email</span>
                <input id="akun-email" type="email" required maxLength={100} value={sunting.isian.email} onChange={ubahIsian('email')} />
              </label>
              <label className="staff-profile-input" htmlFor="akun-hp">
                <span>Nomor telepon (opsional)</span>
                <input id="akun-hp" type="tel" maxLength={20} value={sunting.isian.no_hp} onChange={ubahIsian('no_hp')} />
              </label>
              <label className="staff-profile-input" htmlFor="akun-prodi">
                <span>Program studi</span>
                <input id="akun-prodi" maxLength={100} value={sunting.isian.prodi} onChange={ubahIsian('prodi')} />
              </label>
              <label className="staff-profile-input" htmlFor="akun-jenjang">
                <span>Jenjang{dariNim?.jenjang ? ' (dari NIM)' : ''}</span>
                {dariNim?.jenjang ? (
                  <input id="akun-jenjang" value={dariNim.jenjang} readOnly />
                ) : (
                  <select id="akun-jenjang" value={sunting.isian.jenjang} onChange={ubahIsian('jenjang')}>
                    <option value="">Belum diisi</option>
                    {JENJANG.map((jenjang) => <option key={jenjang} value={jenjang}>{jenjang}</option>)}
                  </select>
                )}
              </label>
              <label className="staff-profile-input" htmlFor="akun-angkatan">
                <span>Angkatan (dari NIM)</span>
                <input id="akun-angkatan" value={dariNim ? dariNim.angkatan : '-'} readOnly />
              </label>
              <label className="staff-profile-input" htmlFor="akun-lulus">
                <span>Tanggal lulus (kosongkan bila belum lulus)</span>
                <input id="akun-lulus" type="date" max={hariIni()} value={sunting.isian.tgl_lulus} onChange={ubahIsian('tgl_lulus')} />
              </label>
              <label className="staff-profile-input" htmlFor="akun-perpanjangan">
                <span>Perpanjangan semester (cuti)</span>
                <input id="akun-perpanjangan" type="number" min="0" max={MAKS_SEMESTER} step="1" value={sunting.isian.tambahan_semester} onChange={ubahIsian('tambahan_semester')} />
              </label>
            </div>
            <p className="staff-akun-catatan">
              Angkatan dan jenjang diambil dari NIM, lalu dipakai untuk menghitung masa studi dan syarat Permohonan Penyesuaian UKT.
              Akun ditutup 30 hari setelah tanggal lulus; tanggal ini terisi otomatis saat Surat Keterangan Lulus terbit.
              Perpanjangan semester menambah batas {MAKS_SEMESTER} semester, misalnya untuk mahasiswa yang pernah cuti.
            </p>
            <div className="staff-akun-aksi">
              <button type="submit" className="staff-profile-save" disabled={menyimpan}>{menyimpan ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
              <button type="button" className="staff-clear-filters" onClick={() => setSunting(null)} disabled={menyimpan}>Batal</button>
            </div>
          </form>
        </section>
      )}

      <section className="staff-panel staff-filters-panel" aria-label="Filter akun">
        <div className="staff-filter-grid">
          <label className="staff-filter-field staff-search-field" htmlFor="akun-cari">
            <span>Cari akun</span>
            <span className="staff-search-control"><input id="akun-cari" type="search" value={cari} onChange={ubahFilter(setCari)} placeholder="Cari nama, NIM/NIP, atau email" /><Search size={16} /></span>
          </label>
          <label className="staff-filter-field" htmlFor="akun-peran">
            <span>Peran</span>
            <select id="akun-peran" value={peran} onChange={ubahFilter(setPeran)}>
              <option value="semua">Semua peran</option>
              {['mahasiswa', 'staf', 'kakor', 'wadek1', 'dekan'].map((role) => <option key={role} value={role}>{labelPeran(role)}</option>)}
            </select>
          </label>
          <label className="staff-filter-field" htmlFor="akun-status">
            <span>Status akun</span>
            <select id="akun-status" value={status} onChange={ubahFilter(setStatus)}>
              <option value="semua">Semua status</option>
              {Object.entries(STATUS_AKUN).map(([kode, { label }]) => <option key={kode} value={kode}>{label}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section className="staff-panel staff-all-submissions">
        <div className="staff-panel-heading">
          <h2>Daftar Akun · {tersaring.length}</h2>
          {jumlahTertutup > 0 && <p>{jumlahTertutup} akun mahasiswa tertutup (lulus, lewat masa studi, atau nonaktif).</p>}
        </div>
        {akun.status === 'memuat' && <div className="staff-access-message" role="status"><RefreshCw size={15} /> Memuat akun...</div>}
        {akun.status === 'galat' && <div className="staff-notice error" role="alert"><AlertCircle size={16} /><span>{akun.pesan}</span></div>}
        <div className="staff-table-wrap">
          <table className="staff-submission-table">
            <thead><tr>
              <th>Peran</th><th>Nama / NIM-NIP</th><th>Email</th><th>Program Studi</th><th>Jenjang · Angkatan</th><th>Status</th><th>Aksi</th>
            </tr></thead>
            <tbody>
              {tampil.map((item) => (
                <tr key={item.id}>
                  <td>{labelPeran(item.role)}</td>
                  <td><strong>{item.nama}</strong><span>{item.identifier}</span></td>
                  <td>{item.email}</td>
                  <td>{item.prodi || '-'}</td>
                  <td>{item.role === 'mahasiswa' ? `${item.jenjang || '-'} · ${item.angkatan || '-'}` : '-'}</td>
                  <td>
                    <span className={`staff-submission-status ${STATUS_AKUN[item.status_studi.kode]?.kelas || ''}`}>{item.status_studi.label}</span>
                    {item.role === 'mahasiswa' && keteranganStatus(item.status_studi) && <small className="staff-akun-keterangan">{keteranganStatus(item.status_studi)}</small>}
                  </td>
                  <td>
                    {item.role === 'mahasiswa' ? (
                      <span className="staff-akun-tombol">
                        <button type="button" className="staff-review-button staff-akun-ubah" onClick={() => mulaiSunting(item)} disabled={menyimpan}><Pencil size={13} /> Ubah</button>
                        <button type="button" className="staff-review-button staff-akun-ubah" onClick={() => resetSandi(item)} disabled={menyimpan}><KeyRound size={13} /> Reset Sandi</button>
                        {item.status_studi.kode === 'nonaktif' && <button type="button" className="staff-review-button staff-akun-ubah" onClick={() => aktifkan(item)} disabled={menyimpan}><UserCheck size={13} /> Aktifkan</button>}
                      </span>
                    ) : '-'}
                  </td>
                </tr>
              ))}
              {akun.status === 'siap' && tampil.length === 0 && <tr><td className="staff-empty-results" colSpan="7">Tidak ada akun yang cocok dengan pencarian atau filter ini.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="staff-pagination">
          <span>Menampilkan {tersaring.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–{Math.min(currentPage * PAGE_SIZE, tersaring.length)} dari {tersaring.length} akun</span>
          <div>
            <button type="button" aria-label="Halaman sebelumnya" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={15} /></button>
            <span className="staff-akun-halaman">{currentPage} / {pageCount}</span>
            <button type="button" aria-label="Halaman selanjutnya" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><ChevronRight size={15} /></button>
          </div>
        </div>
      </section>
    </>
  )
}
