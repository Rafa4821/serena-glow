import { useState, useRef } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase/firestore'
import { useImageUpload } from '../hooks/useImageUpload'
import MediaPickerModal from './MediaPickerModal'
import styles from './ImageUploader.module.css'

export default function ImageUploader({
  value, storagePath, onChange,
  folder = 'uploads', label = 'Imagen',
  showLibraryPicker = false,
  registerInLibrary = false,
}) {
  const { upload, remove, uploading, progress, error } = useImageUpload(folder)
  const [pickerOpen, setPickerOpen] = useState(false)
  const inputRef = useRef(null)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (storagePath) await remove(storagePath)

    const result = await upload(file)
    if (result) {
      if (registerInLibrary) {
        try {
          await addDoc(collection(db, 'media'), {
            url: result.url, path: result.path, folder,
            name: file.name, altText: '',
            size: file.size, mimeType: 'image/webp',
            usedBy: [], refCount: 0,
            createdAt: serverTimestamp(),
          })
        } catch { /* best-effort */ }
      }
      onChange({ url: result.url, path: result.path })
    }
    e.target.value = ''
  }

  async function handleRemove() {
    if (storagePath) await remove(storagePath)
    onChange(null)
  }

  function handlePickerSelect(picked) {
    setPickerOpen(false)
    onChange({ url: picked.url, path: picked.path })
  }

  return (
    <div className={styles.wrap}>
      <span className={styles.label}>{label}</span>

      {value ? (
        <div className={styles.preview}>
          <img src={value} alt="preview" className={styles.previewImg} loading="lazy" decoding="async" />
          <button type="button" onClick={handleRemove} className={styles.removeBtn} aria-label="Eliminar imagen">
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={styles.uploadArea}
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <div className={styles.progressWrap}>
              <div className={styles.progressBar} style={{ width: `${progress}%` }} />
              <span>{progress}%</span>
            </div>
          ) : (
            <>
              <UploadIcon />
              <span>Subir imagen</span>
              <small>JPG, PNG, WEBP · máx. 5MB</small>
            </>
          )}
        </button>
      )}

      <div className={styles.actions}>
        {value && (
          <button
            type="button"
            className={styles.changeBtn}
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? `Subiendo ${progress}%…` : 'Cambiar imagen'}
          </button>
        )}
        {showLibraryPicker && (
          <button
            type="button"
            className={styles.libraryBtn}
            onClick={() => setPickerOpen(true)}
            disabled={uploading}
          >
            📁 Elegir de biblioteca
          </button>
        )}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className={styles.hiddenInput}
        onChange={handleFile}
      />

      {pickerOpen && (
        <MediaPickerModal
          onSelect={handlePickerSelect}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  )
}

function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  )
}
