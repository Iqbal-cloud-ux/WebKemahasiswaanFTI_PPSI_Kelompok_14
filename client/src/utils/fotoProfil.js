export const perkecilFotoProfil = (file) => new Promise((resolve, reject) => {
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    reject(new Error('Foto profil harus berformat JPG atau PNG.'));
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    reject(new Error('Ukuran foto profil maksimal 2 MB.'));
    return
  }

  const pembaca = new FileReader()
  pembaca.onerror = () => reject(new Error('Foto profil gagal dibaca.'))
  pembaca.onload = () => {
    const gambar = new Image()
    gambar.onerror = () => reject(new Error('Foto profil tidak valid.'))
    gambar.onload = () => {
      const skala = Math.min(1, 800 / Math.max(gambar.width, gambar.height))
      const kanvas = document.createElement('canvas')
      kanvas.width = Math.max(1, Math.round(gambar.width * skala))
      kanvas.height = Math.max(1, Math.round(gambar.height * skala))
      kanvas.getContext('2d').drawImage(gambar, 0, 0, kanvas.width, kanvas.height)
      resolve(kanvas.toDataURL('image/jpeg', 0.82))
    }
    gambar.src = pembaca.result
  }
  pembaca.readAsDataURL(file)
})
