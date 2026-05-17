import { useState, useEffect } from 'react'
import { mediaService } from '@/firebase/services/mediaService'
import adminStyles from '../../admin.module.css'
import styles from './MediaPickerModal.module.css'

export default function MediaPickerModal({ onSelect, onClose }) {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    mediaService.getAll()
      .then(data => { setItems(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = search.trim()
    ? items.filter(i =>
        i.name?.toLowerCase().includes(search.toLowerCase()) ||
        i.altText?.toLowerCase().includes(search.toLowerCase())
      )
    : items

  return (
    <div className={adminStyles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={adminStyles.modalHeader}>
          <h2 className={adminStyles.modalTitle}>Elegir de la biblioteca</h2>
          <button className={adminStyles.modalClose} onClick={onClose}>✕</button>
        </div>

        <div className={styles.toolbar}>
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o alt…"
            className={adminStyles.input}
            autoFocus
          />
          <span className={styles.count}>
            {filtered.length} imagen{filtered.length !== 1 ? 'es' : ''}
          </span>
        </div>

        <div className={styles.body}>
          {loading ? (
            <div className={adminStyles.loadingRow}>Cargando biblioteca…</div>
          ) : filtered.length === 0 ? (
            <div className={adminStyles.emptyState}>
              {search ? 'Sin resultados.' : 'No hay imágenes en la biblioteca todavía.'}
            </div>
          ) : (
            <div className={styles.grid}>
              {filtered.map(item => (
                <button
                  key={item.id}
                  type="button"
                  className={styles.cell}
                  onClick={() => onSelect({ url: item.url, path: item.path, mediaId: item.id })}
                  title={item.altText || item.name}
                >
                  <img
                    src={item.thumbUrl || item.url}
                    alt={item.altText || item.name}
                    className={styles.img}
                    loading="lazy"
                  />
                  <span className={styles.name}>
                    {(item.name?.length ?? 0) > 18 ? item.name.slice(0, 16) + '…' : item.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
