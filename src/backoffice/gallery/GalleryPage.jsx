import { useState, useEffect } from 'react'
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/firebase/firestore'
import { useImageUpload } from '../shared/hooks/useImageUpload'
import ImageUploader from '../shared/components/ImageUploader'
import { showToast } from '@/shared/components/ui/Toast'
import adminStyles from '../admin.module.css'
import styles from './GalleryPage.module.css'

export default function GalleryPage() {
  const [items,    setItems]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [form,     setForm]     = useState({ caption: '', imageUrl: '', imagePath: '', active: true, order: 0 })
  const [saving,   setSaving]   = useState(false)
  const { remove } = useImageUpload()

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'gallery'), orderBy('order', 'asc')),
      snap => { setItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false) }
    )
    return unsub
  }, [])

  function openCreate() { setEditing(null); setForm({ caption: '', imageUrl: '', imagePath: '', active: true, order: items.length }); setShowForm(true) }
  function openEdit(item) { setEditing(item.id); setForm({ ...item }); setShowForm(true) }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.imageUrl) { showToast('Subí una imagen primero.', 'warning'); return }
    setSaving(true)
    const data = {
      caption: form.caption, imageUrl: form.imageUrl, imagePath: form.imagePath,
      active: form.active, order: Number(form.order), updatedAt: serverTimestamp(),
    }
    try {
      if (editing) {
        await updateDoc(doc(db, 'gallery', editing), data)
        showToast('Imagen actualizada.', 'success')
      } else {
        await addDoc(collection(db, 'gallery'), { ...data, createdAt: serverTimestamp() })
        showToast('Imagen agregada.', 'success')
      }
      setShowForm(false)
    } catch {
      showToast('Error al guardar.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm('¿Eliminar esta imagen?')) return
    try {
      if (item.imagePath) await remove(item.imagePath)
      await deleteDoc(doc(db, 'gallery', item.id))
      showToast('Imagen eliminada.', 'success')
    } catch {
      showToast('Error al eliminar.', 'error')
    }
  }

  return (
    <div>
      <div className={adminStyles.pageHeader}>
        <div>
          <h1 className={adminStyles.pageTitle}>Galería</h1>
          <p className={adminStyles.pageSub}>{items.length} imágenes</p>
        </div>
        <button className={adminStyles.btnPrimary} onClick={openCreate}>+ Agregar imagen</button>
      </div>

      {loading ? (
        <div className={adminStyles.loadingRow}>Cargando…</div>
      ) : items.length === 0 ? (
        <div className={adminStyles.emptyState}>No hay imágenes en la galería.</div>
      ) : (
        <div className={styles.grid}>
          {items.map(item => (
            <div key={item.id} className={styles.cell}>
              <img src={item.imageUrl} alt={item.caption ?? ''} className={styles.img} />
              {!item.active && <span className={styles.hiddenTag}>Oculta</span>}
              <div className={styles.cellOverlay}>
                <button className={adminStyles.btnEdit} onClick={() => openEdit(item)}>Editar</button>
                <button className={adminStyles.btnDelete} onClick={() => handleDelete(item)}>Eliminar</button>
              </div>
              {item.caption && <p className={styles.caption}>{item.caption}</p>}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className={adminStyles.modalOverlay} onClick={() => setShowForm(false)}>
          <div className={adminStyles.modal} style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className={adminStyles.modalHeader}>
              <h2 className={adminStyles.modalTitle}>{editing ? 'Editar imagen' : 'Agregar imagen'}</h2>
              <button className={adminStyles.modalClose} onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSave} className={adminStyles.form}>
              <div className={adminStyles.formCol}>
                <ImageUploader
                  label="Imagen"
                  folder="gallery"
                  value={form.imageUrl || null}
                  storagePath={form.imagePath || null}
                  onChange={r => setForm(f => ({ ...f, imageUrl: r?.url ?? '', imagePath: r?.path ?? '' }))}
                />
                <div className={adminStyles.field}>
                  <label className={adminStyles.label}>Caption (opcional)</label>
                  <input
                    type="text"
                    value={form.caption}
                    onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
                    className={adminStyles.input}
                    placeholder="Descripción de la imagen"
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
                <button type="submit" disabled={saving} className={adminStyles.btnPrimary}>{saving ? 'Guardando…' : editing ? 'Actualizar' : 'Agregar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
