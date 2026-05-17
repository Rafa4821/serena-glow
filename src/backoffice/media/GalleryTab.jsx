import { useState, useEffect } from 'react'
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/firebase/firestore'
import { useImageUpload } from '../shared/hooks/useImageUpload'
import ImageUploader from '../shared/components/ImageUploader'
import ConfirmModal from '../shared/components/ConfirmModal'
import { showToast } from '@/shared/components/ui/Toast'
import adminStyles from '../admin.module.css'
import styles from './MediaPage.module.css'

const EMPTY = { imageUrl: '', imagePath: '', caption: '', active: true, order: 0 }

export default function GalleryTab() {
  const [items,          setItems]          = useState([])
  const [loading,        setLoading]        = useState(true)
  const [showForm,       setShowForm]       = useState(false)
  const [editing,        setEditing]        = useState(null)
  const [form,           setForm]           = useState(EMPTY)
  const [saving,         setSaving]         = useState(false)
  const [deleteConfirm,  setDeleteConfirm]  = useState(null)
  const [editingCaption, setEditingCaption] = useState(null)
  const [captionDraft,   setCaptionDraft]   = useState('')
  const { remove } = useImageUpload()

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'gallery'), orderBy('order', 'asc')),
      snap => { setItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false) }
    )
    return unsub
  }, [])

  function openCreate() {
    setEditing(null)
    setForm({ ...EMPTY, order: items.length })
    setShowForm(true)
  }

  function openEdit(item) {
    setEditing(item.id)
    setForm({ imageUrl: item.imageUrl || '', imagePath: item.imagePath || '', caption: item.caption || '', active: item.active ?? true, order: item.order ?? 0 })
    setShowForm(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.imageUrl) { showToast('Seleccioná o subí una imagen.', 'warning'); return }
    setSaving(true)
    const data = {
      imageUrl: form.imageUrl, imagePath: form.imagePath,
      caption: form.caption, active: form.active,
      order: Number(form.order), updatedAt: serverTimestamp(),
    }
    try {
      if (editing) {
        await updateDoc(doc(db, 'gallery', editing), data)
        showToast('Imagen actualizada.', 'success')
      } else {
        await addDoc(collection(db, 'gallery'), { ...data, createdAt: serverTimestamp() })
        showToast('Imagen agregada a la galería.', 'success')
      }
      setShowForm(false)
    } catch {
      showToast('Error al guardar.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item) {
    setDeleteConfirm(null)
    try {
      if (item.imagePath) await remove(item.imagePath)
      await deleteDoc(doc(db, 'gallery', item.id))
      showToast('Imagen eliminada de la galería.', 'success')
    } catch {
      showToast('Error al eliminar.', 'error')
    }
  }

  async function toggleActive(item) {
    try {
      await updateDoc(doc(db, 'gallery', item.id), { active: !item.active, updatedAt: serverTimestamp() })
    } catch {
      showToast('Error al cambiar estado.', 'error')
    }
  }

  async function moveItem(item, dir) {
    const sorted = [...items].sort((a, b) => a.order - b.order)
    const idx    = sorted.findIndex(i => i.id === item.id)
    const other  = sorted[idx + dir]
    if (!other) return
    try {
      await Promise.all([
        updateDoc(doc(db, 'gallery', item.id),   { order: other.order, updatedAt: serverTimestamp() }),
        updateDoc(doc(db, 'gallery', other.id), { order: item.order,  updatedAt: serverTimestamp() }),
      ])
    } catch {
      showToast('Error al reordenar.', 'error')
    }
  }

  async function saveCaption(item) {
    try {
      await updateDoc(doc(db, 'gallery', item.id), { caption: captionDraft, updatedAt: serverTimestamp() })
      setEditingCaption(null)
    } catch {
      showToast('Error al guardar caption.', 'error')
    }
  }

  const visibleCount = items.filter(i => i.active).length

  return (
    <div>
      {/* Gallery header */}
      <div className={styles.galleryHeader}>
        <div className={styles.galleryStats}>
          <span className={styles.galleryStatNum}>{items.length}</span>
          <span>imagen{items.length !== 1 ? 'es' : ''} en galería</span>
          <span className={styles.galleryStatDot}>·</span>
          <span className={styles.galleryStatVisible}>{visibleCount} visible{visibleCount !== 1 ? 's' : ''}</span>
          <span className={styles.galleryStatDot}>·</span>
          <span>{items.length - visibleCount} oculta{items.length - visibleCount !== 1 ? 's' : ''}</span>
        </div>
        <button className={adminStyles.btnPrimary} onClick={openCreate}>+ Agregar imagen</button>
      </div>

      <p className={styles.galleryHint}>
        Hacé clic en el caption para editarlo directamente. Usá ◀ ▶ para reordenar. El ojo controla la visibilidad en el sitio.
      </p>

      {loading ? (
        <div className={adminStyles.loadingRow}>Cargando galería…</div>
      ) : items.length === 0 ? (
        <div className={adminStyles.emptyState}>No hay imágenes en la galería todavía.</div>
      ) : (
        <div className={styles.galleryGrid}>
          {items.map((item, idx) => (
            <div key={item.id} className={`${styles.galleryCell} ${!item.active ? styles.galleryCellInactive : ''}`}>
              {/* Image area */}
              <div className={styles.galleryCellImgWrap}>
                <img src={item.imageUrl} alt={item.caption || ''} className={styles.galleryCellImg} loading="lazy" />

                {/* Hover overlay */}
                <div className={styles.galleryCellOverlay}>
                  <div className={styles.galleryCellActions}>
                    <button className={adminStyles.btnEdit} onClick={() => openEdit(item)}>Editar</button>
                    <button className={adminStyles.btnDelete} onClick={() => setDeleteConfirm(item)}>Eliminar</button>
                  </div>
                </div>

                {/* Active badge (always visible) */}
                <button
                  className={`${styles.galleryEyeBtn} ${item.active ? styles.galleryEyeOn : styles.galleryEyeOff}`}
                  onClick={() => toggleActive(item)}
                  title={item.active ? 'Visible — clic para ocultar' : 'Oculta — clic para mostrar'}
                >
                  {item.active ? '👁' : '🚫'}
                </button>
              </div>

              {/* Caption + reorder row */}
              <div className={styles.galleryCaptionRow}>
                <div className={styles.galleryCaptionArea}>
                  {editingCaption === item.id ? (
                    <div className={styles.galleryCaptionEdit}>
                      <input
                        autoFocus
                        value={captionDraft}
                        onChange={e => setCaptionDraft(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter')  saveCaption(item)
                          if (e.key === 'Escape') setEditingCaption(null)
                        }}
                        className={styles.galleryCaptionInput}
                        placeholder="Caption de la imagen…"
                      />
                      <div className={styles.galleryCaptionBtns}>
                        <button className={adminStyles.btnSm} onClick={() => saveCaption(item)}>✓</button>
                        <button onClick={() => setEditingCaption(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <p
                      className={styles.galleryCaption}
                      onClick={() => { setEditingCaption(item.id); setCaptionDraft(item.caption || '') }}
                      title="Clic para editar caption"
                    >
                      {item.caption || <em className={styles.galleryCaptionPlaceholder}>+ caption</em>}
                    </p>
                  )}
                </div>

                <div className={styles.galleryOrderBtns}>
                  <button
                    className={styles.galleryMoveBtn}
                    onClick={() => moveItem(item, -1)}
                    disabled={idx === 0}
                    title="Mover a la izquierda"
                  >◀</button>
                  <span className={styles.galleryOrderNum}>{idx + 1}</span>
                  <button
                    className={styles.galleryMoveBtn}
                    onClick={() => moveItem(item, 1)}
                    disabled={idx === items.length - 1}
                    title="Mover a la derecha"
                  >▶</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className={adminStyles.modalOverlay} onClick={() => setShowForm(false)}>
          <div className={adminStyles.modal} style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className={adminStyles.modalHeader}>
              <h2 className={adminStyles.modalTitle}>{editing ? 'Editar imagen' : 'Agregar a galería'}</h2>
              <button className={adminStyles.modalClose} onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSave} className={adminStyles.form}>
              <div className={adminStyles.formCol}>
                <ImageUploader
                  label="Imagen"
                  folder="gallery"
                  value={form.imageUrl || null}
                  storagePath={form.imagePath || null}
                  showLibraryPicker
                  registerInLibrary
                  onChange={r => setForm(f => ({ ...f, imageUrl: r?.url ?? '', imagePath: r?.path ?? '' }))}
                />
                <div className={adminStyles.field}>
                  <label className={adminStyles.label}>Caption (opcional)</label>
                  <input
                    type="text"
                    value={form.caption}
                    onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
                    className={adminStyles.input}
                    placeholder="Ej: Colección verano 2025"
                  />
                </div>
                <div className={adminStyles.field}>
                  <label className={adminStyles.label}>Orden</label>
                  <input
                    type="number"
                    min="0"
                    value={form.order}
                    onChange={e => setForm(f => ({ ...f, order: e.target.value }))}
                    className={adminStyles.input}
                  />
                </div>
                <label className={adminStyles.checkLabel}>
                  <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
                  Visible en el sitio
                </label>
              </div>
              <div className={adminStyles.formFooter}>
                <button type="button" className={adminStyles.btnSecondary} onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" disabled={saving} className={adminStyles.btnPrimary}>
                  {saving ? 'Guardando…' : editing ? 'Actualizar' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <ConfirmModal
          title="Eliminar imagen de galería"
          message={`¿Eliminar esta imagen de la galería?${deleteConfirm.imagePath ? ' También se eliminará el archivo de almacenamiento.' : ''}`}
          confirmLabel="Sí, eliminar"
          danger
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}
