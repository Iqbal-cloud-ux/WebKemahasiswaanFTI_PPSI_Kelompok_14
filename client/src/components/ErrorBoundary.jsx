import { Component } from 'react'
import { AlertTriangle } from 'lucide-react'
import { KartuPesanPenuh, KartuPesanPortal } from './KartuPesan.jsx'

const PESAN = 'Terjadi kesalahan saat menampilkan halaman ini. Coba muat ulang halaman; bila masih terjadi, laporkan ke tim pengembang.'

const muatUlang = () => window.location.reload()

// Di dalam portal: sidebar tetap bisa dipakai untuk pindah halaman.
const GalatHalaman = () => <KartuPesanPortal ikon={AlertTriangle} pesan={PESAN} tombol="Muat ulang halaman" onTombol={muatUlang} />

// Bila seluruh aplikasi gagal (misalnya kerangka portal sendiri yang rusak).
const GalatPenuh = () => <KartuPesanPenuh alert judul="Terjadi kesalahan" pesan={PESAN} tombol="Muat ulang halaman" onTombol={muatUlang} />

// Menangkap galat saat menampilkan komponen di dalamnya, supaya satu halaman yang rusak
// tidak membuat seluruh layar putih. resetKey (misalnya alamat halaman) yang berubah
// akan mencoba menampilkan ulang, jadi pengguna bisa pindah menu setelah galat.
// Catatan: galat di event handler (onClick) dan di fetch tidak tertangkap di sini;
// tangani dengan try/catch dan tampilkan pesan di halaman masing-masing.
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, resetKey: props.resetKey }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  static getDerivedStateFromProps(props, state) {
    return props.resetKey !== state.resetKey ? { error: null, resetKey: props.resetKey } : null
  }

  componentDidCatch(error, info) {
    console.error('Galat tampilan:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return this.props.penuh ? <GalatPenuh /> : <GalatHalaman />
  }
}
