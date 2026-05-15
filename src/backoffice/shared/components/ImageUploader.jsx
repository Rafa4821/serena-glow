import { useRef } from 'react'
import { useImageUpload } from '../hooks/useImageUpload'
import styles from './ImageUploader.module.css'

export default function ImageUploader({ value, storagePath, onChange, folder = 'uploads', label = 'Imagen' }) {
  const { upload, remove, uploading, progress, error } = useImageUpload(folder)
  const inputRef = useRef(null)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (storagePath) {
      await remove(storagePath)
    }

    const result = await upload(file)
    if (result) {
      onChange({ url: result.url, path: result.path })
    }
    e.target.value = ''
  }

  async function handleRemove() {
    if (storagePath) {
      await remove(storagePath)
    }
    onChange(null)
  }

  return (
    <div className={styles.wrap}>
      <span className={styles.label}>{label}</span>

      {value ? (
        <div className={styles.preview}>
          <img src={value} alt="preview" className={styles.previewImg} />
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

      {!value && (
        <button
          type="button"
          className={styles.changeBtn}
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={value ? {} : { display: 'none' }}
        >
          Cambiar imagen
        </button>
      )}

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

      {error && <p className={styles.error}>{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className={styles.hiddenInput}
        onChange={handleFile}
      />
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
