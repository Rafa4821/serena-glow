import { useState } from 'react'
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '@/firebase/storage'
import { convertImage } from '@/shared/utils/imageConverter'

const MAX_SIZE_MB = 20

export function useImageUpload(folder = 'uploads') {
  const [uploading, setUploading] = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [error,     setError]     = useState(null)

  async function upload(file) {
    if (!file) return null
    setError(null)

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`El archivo supera los ${MAX_SIZE_MB}MB permitidos.`)
      return null
    }

    setUploading(true)
    setProgress(0)

    try {
      const { catalog: blob, ext, mimeType } = await convertImage(file)

      const filename   = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const storageRef = ref(storage, filename)

      return await new Promise((resolve, reject) => {
        const task = uploadBytesResumable(storageRef, blob, {
          contentType: mimeType,
          customMetadata: { originalName: file.name, uploadedAt: new Date().toISOString() },
        })

        task.on(
          'state_changed',
          snap => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
          err => { setError(err.message); setUploading(false); reject(err) },
          async () => {
            const url = await getDownloadURL(task.snapshot.ref)
            setUploading(false)
            setProgress(100)
            resolve({ url, path: filename })
          },
        )
      })
    } catch (err) {
      setError('Error al convertir o subir la imagen.')
      setUploading(false)
      return null
    }
  }

  async function remove(storagePath) {
    if (!storagePath) return
    try {
      await deleteObject(ref(storage, storagePath))
    } catch (err) {
      if (err.code !== 'storage/object-not-found') throw err
    }
  }

  return { upload, remove, uploading, progress, error }
}
