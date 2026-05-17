import { useState, useRef } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase/firestore'
import { useImageUpload } from '../shared/hooks/useImageUpload'
import MediaPickerModal from '../shared/components/MediaPickerModal'
import styles from './MultiImageUploader.module.css'

/**
 * Multi-image uploader for product galleries.
 * images: { url: string, path: string }[]
 * onChange(images): called with updated array
 */
export default function MultiImageUploader({ images = [], onChange, folder = 'products' }) {
  const { upload, uploading, progress } = useImageUpload(folder)
  const [pickerOpen,   setPickerOpen]   = useState(false)
  const [uploadingIdx, setUploadingIdx] = useState(null)
  const inputRef = useRef(null)

  async function handleFiles(files) {
    const arr = [...files]
    for (let i = 0; i < arr.length; i++) {
      const file = arr[i]
      setUploadingIdx(i + 1)
      const result = await upload(file)
      if (result) {
        try {
          await addDoc(collection(db, 'media'), {
            url: result.url, path: result.path, folder,
            name: file.name, altText: '',
            size: file.size, mimeType: 'image/webp',
            usedBy: [], refCount: 0,
            createdAt: serverTimestamp(),
          })
        } catch { /* best-effort */ }
        onChange([...images, { url: result.url, path: result.path }])
        images = [...images, { url: result.url, path: result.path }]
      }
    }
    setUploadingIdx(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleRemove(idx) {
    onChange(images.filter((_, i) => i !== idx))
  }

  function moveLeft(idx) {
    if (idx === 0) return
    const next = [...images]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    onChange(next)
  }

  function moveRight(idx) {
    if (idx === images.length - 1) return
    const next = [...images]
    ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    onChange(next)
  }

  function handlePickerSelect(picked) {
    setPickerOpen(false)
    onChange([...images, { url: picked.url, path: picked.path || '' }])
  }

  const busy = uploading && uploadingIdx !== null

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.label}>Galería del producto</span>
        <span className={styles.count}>{images.length} imagen{images.length !== 1 ? 'es' : ''}</span>
      </div>

      <div className={styles.strip}>
        {images.map((img, idx) => (
          <div key={idx} className={styles.cell}>
            <img src={img.url} alt={`imagen ${idx + 1}`} className={styles.thumb} loading="lazy" />

            {/* Position badge */}
            <span className={styles.badge}>{idx + 1}</span>

            {/* Remove */}
            <button
              type="button"
              className={styles.removeBtn}
              onClick={() => handleRemove(idx)}
              title="Quitar imagen"
            >
              ✕
            </button>

            {/* Move controls */}
            <div className={styles.moveRow}>
              <button
                type="button"
                className={styles.moveBtn}
                onClick={() => moveLeft(idx)}
                disabled={idx === 0}
                title="Mover izquierda"
              >◀</button>
              <button
                type="button"
                className={styles.moveBtn}
                onClick={() => moveRight(idx)}
                disabled={idx === images.length - 1}
                title="Mover derecha"
              >▶</button>
            </div>
          </div>
        ))}

        {/* Upload cell */}
        <button
          type="button"
          className={`${styles.addCell} ${busy ? styles.addCellBusy : ''}`}
          onClick={() => !busy && inputRef.current?.click()}
          disabled={busy}
          title="Subir imagen(es)"
        >
          {busy ? (
            <div className={styles.uploadProgress}>
              <div className={styles.progressBar} style={{ width: `${progress}%` }} />
              <span className={styles.progressLabel}>{progress}%</span>
            </div>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <span>Subir</span>
            </>
          )}
        </button>

        {/* Library cell */}
        <button
          type="button"
          className={styles.libraryCell}
          onClick={() => setPickerOpen(true)}
          disabled={busy}
          title="Elegir de la biblioteca de medios"
        >
          <span style={{ fontSize: 18 }}>📁</span>
          <span>Biblioteca</span>
        </button>
      </div>

      <p className={styles.hint}>
        Puedes subir varias a la vez · Arrastra las miniaturas con ◀▶ para reordenar
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className={styles.hidden}
        onChange={e => handleFiles([...e.target.files])}
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
