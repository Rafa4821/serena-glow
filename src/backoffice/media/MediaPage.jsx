import { useState, useEffect, useRef, useCallback } from 'react'
import { mediaService } from '@/firebase/services/mediaService'
import { convertImage, formatBytes } from '@/shared/utils/imageConverter'
import ConfirmModal from '../shared/components/ConfirmModal'
import { showToast } from '@/shared/components/ui/Toast'
import adminStyles from '../admin.module.css'
import styles from './MediaPage.module.css'

const FOLDERS = ['products', 'categories', 'banners', 'gallery', 'uploads']

const UPLOAD_STATUS = { IDLE: 'idle', CONVERTING: 'converting', UPLOADING: 'uploading' }

export default function MediaPage() {
  const [items,         setItems]         = useState([])
  const [loading,       setLoading]       = useState(true)
  const [uploadStatus,  setUploadStatus]  = useState(UPLOAD_STATUS.IDLE)
  const [progress,      setProgress]      = useState(0)
  const [currentFile,   setCurrentFile]   = useState('')
  const [folder,        setFolder]        = useState('uploads')
  const [filter,        setFilter]        = useState('all')
  const [search,        setSearch]        = useState('')
  const [selected,      setSelected]      = useState(null)
  const [altText,       setAltText]       = useState('')
  const [savingAlt,     setSavingAlt]     = useState(false)
  const [isDragOver,    setIsDragOver]    = useState(false)
  const [bulkConfirm,   setBulkConfirm]   = useState(false)
  const [bulkDeleting,  setBulkDeleting]  = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    mediaService.getAll()
      .then(data => { setItems(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  /* ── Upload pipeline ─────────────────────────────────── */
  const processFiles = useCallback(async (files) => {
    const validFiles = files.filter(f => f.type.startsWith('image/'))
    if (!validFiles.length) return
    let successCount = 0

    for (const file of validFiles) {
      setCurrentFile(file.name)
      try {
        setUploadStatus(UPLOAD_STATUS.CONVERTING)
        setProgress(0)
        const { catalog, thumb, ext, mimeType, width, height } = await convertImage(file)

        setUploadStatus(UPLOAD_STATUS.UPLOADING)
        setProgress(0)
        const result = await mediaService.uploadConverted(
          { catalogBlob: catalog, thumbBlob: thumb, folder, originalName: file.name, ext, mimeType, width, height },
          pct => setProgress(pct),
        )

        setItems(prev => [{
          id:        result.id,
          url:       result.url,
          thumbUrl:  result.thumbUrl,
          path:      result.path,
          thumbPath: result.thumbPath,
          folder,
          name:      file.name,
          altText:   '',
          usedBy:    [],
          refCount:  0,
          size:      catalog.size,
          mimeType,
          width,
          height,
        }, ...prev])
        successCount++
      } catch (err) {
        console.error(err)
        showToast(`Error al procesar "${file.name}".`, 'error')
      }
    }

    setUploadStatus(UPLOAD_STATUS.IDLE)
    setProgress(0)
    setCurrentFile('')
    if (successCount > 0) {
      showToast(`${successCount} imagen${successCount > 1 ? 'es' : ''} subida${successCount > 1 ? 's' : ''} como WebP.`, 'success')
    }
  }, [folder])

  function handleInputChange(e) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    processFiles(files)
  }

  /* ── Drag & drop ─────────────────────────────────────── */
  function onDragOver(e)  { e.preventDefault(); setIsDragOver(true)  }
  function onDragLeave()  { setIsDragOver(false) }
  function onDrop(e) {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files ?? [])
    processFiles(files)
  }

  /* ── Alt text ────────────────────────────────────────── */
  async function handleSaveAlt() {
    if (!selected) return
    setSavingAlt(true)
    try {
      await mediaService.updateAltText(selected.id, altText)
      setItems(prev => prev.map(i => i.id === selected.id ? { ...i, altText } : i))
      setSelected(s => ({ ...s, altText }))
      showToast('Alt text guardado.', 'success')
    } catch {
      showToast('Error al guardar.', 'error')
    } finally {
      setSavingAlt(false)
    }
  }

  /* ── Single delete ───────────────────────────────────── */
  async function handleDelete(item) {
    const result = await mediaService.safeDelete(item.id)
    if (!result.deleted) {
      showToast(
        result.reason === 'still referenced'
          ? `En uso (${item.refCount ?? item.usedBy?.length} referencia/s) — no se puede eliminar.`
          : 'Imagen no encontrada.',
        'warning',
      )
      return
    }
    setItems(prev => prev.filter(i => i.id !== item.id))
    if (selected?.id === item.id) setSelected(null)
    showToast('Imagen eliminada.', 'success')
  }

  /* ── Bulk orphan delete ──────────────────────────────── */
  async function handleBulkDelete() {
    setBulkConfirm(false)
    setBulkDeleting(true)
    try {
      const count = await mediaService.deleteOrphans()
      setItems(prev => prev.filter(i => (i.refCount ?? 0) > 0 || (i.usedBy?.length ?? 0) > 0))
      if (selected && orphans.some(o => o.id === selected.id)) setSelected(null)
      showToast(`${count} imagen${count !== 1 ? 'es' : ''} eliminada${count !== 1 ? 's' : ''}.`, 'success')
    } catch {
      showToast('Error al eliminar imágenes sin uso.', 'error')
    } finally {
      setBulkDeleting(false)
    }
  }

  function copyUrl(url) {
    navigator.clipboard?.writeText(url).then(() => showToast('URL copiada.', 'success'))
  }

  function openItem(item) { setSelected(item); setAltText(item.altText ?? '') }

  /* ── Filter / search ─────────────────────────────────── */
  const isOrphan = i => (i.refCount ?? 0) === 0 && (!i.usedBy || i.usedBy.length === 0)
  const orphans  = items.filter(isOrphan)

  const base = filter === 'orphans' ? orphans
    : filter === 'all'              ? items
    : items.filter(i => i.folder === filter)

  const filtered = search.trim()
    ? base.filter(i =>
        i.name?.toLowerCase().includes(search.toLowerCase()) ||
        i.altText?.toLowerCase().includes(search.toLowerCase())
      )
    : base

  const busy = uploadStatus !== UPLOAD_STATUS.IDLE

  /* ── Render ──────────────────────────────────────────── */
  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={adminStyles.pageHeader}>
        <div>
          <h1 className={adminStyles.pageTitle}>Biblioteca de medios</h1>
          <p className={adminStyles.pageSub}>
            {items.length} archivo{items.length !== 1 ? 's' : ''} ·{' '}
            {orphans.length} sin uso ·{' '}
            <span className={styles.webpNote}>auto WebP</span>
          </p>
        </div>
        <button
          className={adminStyles.btnPrimary}
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? statusLabel(uploadStatus, progress, currentFile) : '+ Subir imágenes'}
        </button>
      </div>

      {/* Upload options */}
      <div className={styles.uploadBar}>
        <span className={styles.uploadLabel}>Carpeta:</span>
        <select
          value={folder}
          onChange={e => setFolder(e.target.value)}
          className={adminStyles.select}
          style={{ width: 'auto' }}
          disabled={busy}
        >
          {FOLDERS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>

        {busy && (
          <div className={styles.statusPill}>
            {uploadStatus === UPLOAD_STATUS.CONVERTING && <SpinnerIcon />}
            <span>{statusLabel(uploadStatus, progress, currentFile)}</span>
            {uploadStatus === UPLOAD_STATUS.UPLOADING && (
              <div className={styles.progressWrap}>
                <div className={styles.progressBar} style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        )}

        {orphans.length > 0 && !busy && (
          <button
            className={styles.btnOrphanDelete}
            onClick={() => setBulkConfirm(true)}
            disabled={bulkDeleting}
          >
            {bulkDeleting ? 'Eliminando…' : `Limpiar sin uso (${orphans.length})`}
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className={styles.hiddenInput}
          onChange={handleInputChange}
        />
      </div>

      {/* Filter tabs + search */}
      <div className={styles.controlRow}>
        <div className={styles.filterTabs}>
          {[
            { value: 'all',     label: `Todas (${items.length})` },
            { value: 'orphans', label: `Sin uso (${orphans.length})` },
            ...FOLDERS.map(f => ({ value: f, label: f })),
          ].map(tab => (
            <button
              key={tab.value}
              className={`${styles.filterTab} ${filter === tab.value ? styles.filterTabActive : ''}`}
              onClick={() => setFilter(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          type="search"
          placeholder="Buscar por nombre o alt…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Drop zone + grid */}
      <div className={styles.layout}>
        <div
          className={`${styles.gridWrap} ${isDragOver ? styles.dragOver : ''}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          {isDragOver && (
            <div className={styles.dropOverlay}>
              <UploadIcon />
              <span>Soltar para subir</span>
            </div>
          )}

          {loading ? (
            <div className={adminStyles.loadingRow}>Cargando…</div>
          ) : filtered.length === 0 ? (
            <div className={adminStyles.emptyState}>
              {search
                ? 'Sin resultados para esa búsqueda.'
                : 'No hay imágenes aquí todavía. Arrastrá o usá el botón para subir.'
              }
            </div>
          ) : (
            <div className={styles.grid}>
              {filtered.map(item => (
                <div
                  key={item.id}
                  className={[
                    styles.cell,
                    selected?.id === item.id ? styles.cellSelected : '',
                    isOrphan(item) ? styles.cellOrphan : '',
                  ].join(' ')}
                  onClick={() => openItem(item)}
                  title={item.name}
                >
                  <img
                    src={item.thumbUrl || item.url}
                    alt={item.altText ?? ''}
                    className={styles.cellImg}
                    loading="lazy"
                  />
                  <div className={styles.cellOverlay}>
                    {item.mimeType === 'image/webp' && <span className={styles.webpBadge}>WebP</span>}
                    {isOrphan(item) && <span className={styles.orphanTag}>Sin uso</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className={styles.detail}>
            <button className={styles.closeDetail} onClick={() => setSelected(null)} aria-label="Cerrar">✕</button>

            <img
              src={selected.url}
              alt={selected.altText ?? ''}
              className={styles.detailImg}
            />

            <div className={styles.detailMeta}>
              <p className={styles.detailName}>{selected.name}</p>
              <p className={styles.detailInfo}>
                {selected.folder}
                {selected.width ? ` · ${selected.width}×${selected.height}` : ''}
                {selected.size  ? ` · ${formatBytes(selected.size)}`        : ''}
              </p>
              {selected.mimeType === 'image/webp' && (
                <span className={styles.webpBadgeLg}>WebP optimizado</span>
              )}
              {(selected.refCount ?? 0) > 0 || (selected.usedBy?.length ?? 0) > 0
                ? <p className={styles.usedBy}>Usada en {selected.refCount ?? selected.usedBy?.length} lugar(es)</p>
                : <p className={styles.notUsed}>Sin referencias activas</p>
              }
            </div>

            <div className={adminStyles.field}>
              <label className={adminStyles.label}>Alt text (SEO / accesibilidad)</label>
              <input
                type="text"
                value={altText}
                onChange={e => setAltText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveAlt()}
                className={adminStyles.input}
                placeholder="Ej: Crema hidratante Serena Glow"
              />
              <button
                className={adminStyles.btnSm}
                onClick={handleSaveAlt}
                disabled={savingAlt}
                style={{ marginTop: '4px' }}
              >
                {savingAlt ? 'Guardando…' : 'Guardar alt'}
              </button>
            </div>

            <div className={styles.detailActions}>
              <button className={adminStyles.btnSecondary} onClick={() => copyUrl(selected.url)}>
                Copiar URL
              </button>
              {selected.thumbUrl && (
                <button className={adminStyles.btnSecondary} onClick={() => copyUrl(selected.thumbUrl)}>
                  Copiar thumb
                </button>
              )}
              <button
                className={adminStyles.btnDelete}
                onClick={() => handleDelete(selected)}
                disabled={(selected.refCount ?? selected.usedBy?.length ?? 0) > 0}
                title={
                  (selected.refCount ?? selected.usedBy?.length ?? 0) > 0
                    ? 'En uso — no se puede eliminar'
                    : 'Eliminar permanentemente'
                }
              >
                Eliminar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk delete confirm */}
      {bulkConfirm && (
        <ConfirmModal
          title="Eliminar imágenes sin uso"
          message={`¿Eliminar ${orphans.length} imagen${orphans.length !== 1 ? 'es' : ''} que no están referenciadas en ningún producto, banner ni galería? Esta acción no se puede deshacer.`}
          confirmLabel="Sí, limpiar"
          danger
          onConfirm={handleBulkDelete}
          onCancel={() => setBulkConfirm(false)}
        />
      )}
    </div>
  )
}

function statusLabel(status, progress, filename) {
  const short = filename.length > 22 ? `${filename.slice(0, 20)}…` : filename
  if (status === UPLOAD_STATUS.CONVERTING) return `Convirtiendo ${short}…`
  if (status === UPLOAD_STATUS.UPLOADING)  return `Subiendo ${progress}%`
  return 'Procesando…'
}

function SpinnerIcon() {
  return (
    <svg className={styles.spinner} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  )
}
