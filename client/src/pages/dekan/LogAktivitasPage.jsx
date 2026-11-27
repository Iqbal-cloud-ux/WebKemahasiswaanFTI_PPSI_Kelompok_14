import { useCallback, useState } from 'react'
import { AlertCircle, ChevronLeft, ChevronRight, RefreshCw, Search } from 'lucide-react'
import { useDataServer } from '../../hooks/useDataServer.js'
import { logAktivitasRequest } from '../../services/api.js'
import { ROLE_LABELS, normalizeRole } from '../../utils/roles.js'
import { formatWaktu } from '../../utils/statusPengajuan.js'

// Nama jenis aktivitas (log_aktivitas.action) untuk tampilan. Aksi baru yang belum ada di sini
// tetap tampil dengan nama teknisnya.
const LABEL_AKSI = {
  login: 'Masuk',
  login_uji: 'Masuk (pintasan uji)',
  login_gagal: 'Gagal masuk',
  login_ditolak: 'Masuk ditolak',
  logout: 'Keluar',
  ubah_profil: 'Ubah kontak profil',
  ubah_foto_profil: 'Ubah foto profil',
  hapus_foto_profil: 'Hapus foto profil',
  ubah_kata_sandi: 'Ganti kata sandi',
  ubah_kata_sandi_gagal: 'Gagal ganti kata sandi',
  reset_kata_sandi: 'Reset kata sandi',
  ubah_data_akun: 'Ubah data akun',
  aktifkan_akun: 'Aktifkan akun',
  tandai_lulus: 'Tandai lulus',
  ubah_status: 'Perubahan status pengajuan',
  buka_berkas: 'Buka berkas persyaratan',
  simpan_draf: 'Simpan draf surat',
  buka_draf: 'Buka draf surat',
  paraf: 'Paraf',
  kembalikan_draf: 'Kembalikan draf',
  tolak_pengajuan: 'Tolak pengajuan',
  terbitkan_surat: 'Terbitkan surat',
  lihat_surat: 'Lihat surat terbit',
  unduh_surat: 'Unduh surat',
  lihat_arsip_surat: 'Lihat arsip surat',
  lihat_kode_verifikasi: 'Lihat kode verifikasi',
  ekspor_rekap: 'Ekspor rekap',
  tambah_layanan: 'Tambah layanan',
  ubah_layanan: 'Ubah layanan',
  ubah_status_layanan: 'Ubah status layanan',
  hapus_layanan: 'Hapus layanan',
  ubah_template: 'Ubah template surat',
  ubah_nomor_urut: 'Ubah nomor urut surat',
}
const labelAksi = (aksi) => LABEL_AKSI[aksi] || aksi
const PERAN = ['mahasiswa', 'staf', 'kakor', 'wadek1', 'dekan']
const labelPeran = (role) => (role === 'wadek1' ? 'Wakil Dekan 1' : ROLE_LABELS[normalizeRole(role)] || role)
const FILTER_KOSONG = { cari: '', peran: '', aksi: '', mulai: '', sampai: '' }
const AWAL = { log: [], total: 0, halaman: 1, per_halaman: 25, daftar_aksi: [] }

// Log Aktivitas seluruh sistem, khusus Dekan. Hanya baca:
// tidak ada tombol ubah atau hapus (AGENTS.md aturan 5). Alamat IP tidak ditampilkan.
export function LogAktivitasPage() {
  const [isian, setIsian] = useState(FILTER_KOSONG) // isian formulir
  const [terapan, setTerapan] = useState(FILTER_KOSONG) // filter yang sedang dipakai
  const [halaman, setHalaman] = useState(1)
  const request = useCallback(() => logAktivitasRequest({ ...terapan, halaman }), [terapan, halaman])
  const [hasil, muatUlang] = useDataServer(request, AWAL)
  const { log, total, per_halaman: perHalaman, daftar_aksi: daftarAksi } = hasil.data
  const jumlahHalaman = Math.max(1, Math.ceil(total / perHalaman))

  const ubah = (kunci) => (event) => setIsian((lama) => ({ ...lama, [kunci]: event.target.value }))
  const terapkan = (event) => {
    event.preventDefault()
    setTerapan(isian)
    setHalaman(1)
  }
  const aturUlang = () => {
    setIsian(FILTER_KOSONG)
    setTerapan(FILTER_KOSONG)
    setHalaman(1)
  }

  return (
    <>
      <div className="staff-breadcrumb">Layanan Kemahasiswaan FTI <span>/</span> Log Aktivitas</div>
      <div className="staff-dashboard-heading"><h1>Log Aktivitas</h1><p>Catatan aktivitas seluruh pengguna sistem. Catatan ini hanya bisa dibaca dan tidak dapat diubah atau dihapus.</p></div>

      <form className="staff-panel staff-filters-panel log-filter" onSubmit={terapkan} aria-label="Filter log aktivitas">
        <label className="staff-filter-field staff-search-field" htmlFor="log-cari">
          <span>Cari</span>
          <span className="staff-search-control"><input id="log-cari" type="search" maxLength={100} value={isian.cari} onChange={ubah('cari')} placeholder="Nama, NIM/NIP, atau isi keterangan" /><Search size={16} /></span>
        </label>
        <label className="staff-filter-field" htmlFor="log-peran">
          <span>Peran</span>
          <select id="log-peran" value={isian.peran} onChange={ubah('peran')}>
            <option value="">Semua peran</option>
            {PERAN.map((role) => <option key={role} value={role}>{labelPeran(role)}</option>)}
          </select>
        </label>
        <label className="staff-filter-field" htmlFor="log-aksi">
          <span>Jenis aktivitas</span>
          <select id="log-aksi" value={isian.aksi} onChange={ubah('aksi')}>
            <option value="">Semua aktivitas</option>
            {[...daftarAksi].sort((a, b) => labelAksi(a).localeCompare(labelAksi(b), 'id')).map((aksi) => <option key={aksi} value={aksi}>{labelAksi(aksi)}</option>)}
          </select>
        </label>
        <label className="staff-filter-field" htmlFor="log-mulai">
          <span>Dari tanggal</span>
          <input id="log-mulai" type="date" value={isian.mulai} onChange={ubah('mulai')} />
        </label>
        <label className="staff-filter-field" htmlFor="log-sampai">
          <span>Sampai tanggal</span>
          <input id="log-sampai" type="date" value={isian.sampai} onChange={ubah('sampai')} />
        </label>
        <div className="log-filter-aksi">
          <button type="submit" className="staff-profile-save">Terapkan</button>
          <button type="button" className="staff-clear-filters" onClick={aturUlang}>Atur ulang</button>
        </div>
      </form>

      <section className="staff-panel staff-all-submissions">
        <div className="staff-panel-heading">
          <h2>Catatan Aktivitas · {total}</h2>
          <button type="button" className="staff-review-button log-muat-ulang" onClick={muatUlang}><RefreshCw size={13} /> Muat ulang</button>
        </div>
        {hasil.status === 'galat' && <div className="staff-notice error" role="alert"><AlertCircle size={16} /><span>{hasil.pesan}</span></div>}
        <div className="staff-table-wrap">
          <table className="staff-submission-table log-tabel">
            <thead><tr><th>Waktu</th><th>Pengguna</th><th>Peran</th><th>Aktivitas</th><th>Keterangan</th></tr></thead>
            <tbody>
              {log.map((item) => (
                <tr key={item.id}>
                  <td>{formatWaktu(item.waktu)}</td>
                  <td>{item.pengguna ? <><strong>{item.pengguna.nama}</strong><span>{item.pengguna.identifier}</span></> : <span className="log-tanpa-pengguna">Tidak dikenal</span>}</td>
                  <td>{item.pengguna ? labelPeran(item.pengguna.role) : '-'}</td>
                  <td>{labelAksi(item.aksi)}</td>
                  <td className="log-keterangan">{item.keterangan}</td>
                </tr>
              ))}
              {hasil.status === 'memuat' && <tr><td className="staff-empty-results" colSpan="5">Memuat log...</td></tr>}
              {hasil.status === 'siap' && log.length === 0 && <tr><td className="staff-empty-results" colSpan="5">Tidak ada aktivitas yang cocok dengan filter ini.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="staff-pagination">
          <span>Halaman {halaman} dari {jumlahHalaman}</span>
          <div>
            <button type="button" aria-label="Halaman sebelumnya" disabled={halaman <= 1 || hasil.status === 'memuat'} onClick={() => setHalaman(halaman - 1)}><ChevronLeft size={15} /></button>
            <button type="button" aria-label="Halaman selanjutnya" disabled={halaman >= jumlahHalaman || hasil.status === 'memuat'} onClick={() => setHalaman(halaman + 1)}><ChevronRight size={15} /></button>
          </div>
        </div>
      </section>
    </>
  )
}
