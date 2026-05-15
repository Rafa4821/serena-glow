import { useState, useEffect } from 'react'
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
  getDocs, where,
} from 'firebase/firestore'
import { db } from '@/firebase/firestore'
import { useImageUpload } from '../shared/hooks/useImageUpload'
import ImageUploader from '../shared/components/ImageUploader'
import ConfirmModal from '../shared/components/ConfirmModal'
import { showToast } from '@/shared/components/ui/Toast'
import { slugify } from '@/shared/utils/slugify'
import adminStyles from '../admin.module.css'

const EMPTY = { name: '', slug: '', tagline: '', description: '', imageUrl: '', imagePath: '', active: true, order: 0 }

export default function CategoriesPage() {
  const [categories,    setCategories]    = useState([])
  const [loading,       setLoading]       = useState(true)
  const [showForm,      setShowForm]      = useState(false)
  const [editing,       setEditing]       = useState(null)
  const [form,          setForm]          = useState(EMPTY)
  const [saving,        setSaving]        = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const { remove } = useImageUpload()

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'categories'), orderBy('order', 'asc')),
      snap => { setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false) }
    )
    return unsub
  }, [])

  function openCreate() { setEditing(null); setForm({ ...EMPTY, order: categories.length }); setShowForm(true) }
  function openEdit(c)  { setEditing(c.id); setForm({ ...EMPTY, ...c }); setShowForm(true) }

  function handleField(e) {
    const { name, value, type, checked } = e.target
    setForm(f => {
      const updated = { ...f, [name]: type === 'checkbox' ? checked : value }
      if (name === 'name' && !editing) updated.slug = slugify(value)
      return updated
    })
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.name) return
    setSaving(true)
    const data = {
      name: form.name, slug: form.slug || slugify(form.name),
      tagline: form.tagline,
      description: form.description, imageUrl: form.imageUrl,
      imagePath: form.imagePath, active: form.active,
      order: Number(form.order), updatedAt: serverTimestamp(),
    }
    try {
      if (editing) {
        await updateDoc(doc(db, 'categories', editing), data)
        showToast('Categoría actualizada.', 'success')
      } else {
        await addDoc(collection(db, 'categories'), { ...data, createdAt: serverTimestamp() })
        showToast('Categoría creada.', 'success')
      }
      setShowForm(false)
    } catch {
      showToast('Error al guardar.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function requestDelete(cat) {
    const prodSnap = await getDocs(query(collection(db, 'products'), where('categorySlug', '==', cat.slug)))
    if (!prodSnap.empty) {
      showToast(`Esta categoría tiene ${prodSnap.size} producto(s). Reasignálos antes de eliminar.`, 'warning')
      return
    }
    setDeleteConfirm(cat)
  }

  async function executeDelete(cat) {
    setDeleteConfirm(null)
    try {
      if (cat.imagePath) await remove(cat.imagePath)
      await deleteDoc(doc(db, 'categories', cat.id))
      showToast('Categoría eliminada.', 'success')
    } catch {
      showToast('Error al eliminar.', 'error')
    }
  }

  return (
    <div>
      <div className={adminStyles.pageHeader}>
        <div>
          <h1 className={adminStyles.pageTitle}>Categorías</h1>
          <p className={adminStyles.pageSub}>{categories.length} categorías</p>
        </div>
        <button className={adminStyles.btnPrimary} onClick={openCreate}>+ Nueva categoría</button>
      </div>

      {loading ? (
        <div className={adminStyles.loadingRow}>Cargando…</div>
      ) : categories.length === 0 ? (
        <div className={adminStyles.emptyState}>No hay categorías todavía.</div>
      ) : (
        <div className={adminStyles.tableWrap}>
          <table className={adminStyles.table}>
            <thead><tr><th>Imagen</th><th>Nombre</th><th>Tagline</th><th>Slug</th><th>Orden</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.id}>
                  <td>{c.imageUrl ? <img src={c.imageUrl} alt={c.name} className={adminStyles.tableThumb} /> : <div className={adminStyles.tableThumbEmpty} />}</td>
                  <td><span className={adminStyles.tablePrimary}>{c.name}</span></td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>{c.tagline || '—'}</td>
                  <td><code style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{c.slug}</code></td>
                  <td>{c.order}</td>
                  <td><span className={c.active ? adminStyles.statusActive : adminStyles.statusInactive}>{c.active ? 'Activa' : 'Inactiva'}</span></td>
                  <td>
                    <div className={adminStyles.actions}>
                      <button className={adminStyles.btnEdit} onClick={() => openEdit(c)}>Editar</button>
                      <button className={adminStyles.btnDelete} onClick={() => requestDelete(c)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className={adminStyles.modalOverlay} onClick={() => setShowForm(false)}>
          <div className={adminStyles.modal} onClick={e => e.stopPropagation()}>
            <div className={adminStyles.modalHeader}>
              <h2 className={adminStyles.modalTitle}>{editing ? 'Editar categoría' : 'Nueva categoría'}</h2>
              <button className={adminStyles.modalClose} onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSave} className={adminStyles.form}>
              <div className={adminStyles.formGrid}>
                <div className={adminStyles.formCol}>
                  <div className={adminStyles.field}>
                    <label className={adminStyles.label}>Nombre *</label>
                    <input name="name" value={form.name} onChange={handleField} required className={adminStyles.input} />
                  </div>
                  <div className={adminStyles.field}>
                    <label className={adminStyles.label}>Slug</label>
                    <input name="slug" value={form.slug} onChange={handleField} className={adminStyles.input} />
                  </div>
                  <div className={adminStyles.field}>
                    <label className={adminStyles.label}>Tagline</label>
                    <input name="tagline" value={form.tagline} onChange={handleField} className={adminStyles.input} placeholder="Ej: Cuida tu piel cada día" />
                  </div>
                  <div className={adminStyles.field}>
                    <label className={adminStyles.label}>Descripción</label>
                    <textarea name="description" value={form.description} onChange={handleField} rows={3} className={adminStyles.textarea} />
                  </div>
                  <div className={adminStyles.row}>
                    <div className={adminStyles.field}>
                      <label className={adminStyles.label}>Orden</label>
                      <input name="order" type="number" min="0" value={form.order} onChange={handleField} className={adminStyles.input} />
                    </div>
                  </div>
                  <label className={adminStyles.checkLabel}>
                    <input type="checkbox" name="active" checked={form.active} onChange={handleField} />
                    Activa (visible en el sitio)
                  </label>
                </div>
                <div className={adminStyles.formCol}>
                  <ImageUploader
                    label="Imagen de categoría"
                    folder="categories"
                    value={form.imageUrl || null}
                    storagePath={form.imagePath || null}
                    onChange={r => setForm(f => ({ ...f, imageUrl: r?.url ?? '', imagePath: r?.path ?? '' }))}
                  />
                </div>
              </div>
              <div className={adminStyles.formFooter}>
                <button type="button" className={adminStyles.btnSecondary} onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" disabled={saving} className={adminStyles.btnPrimary}>{saving ? 'Guardando…' : editing ? 'Actualizar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <ConfirmModal
          title="Eliminar categoría"
          message={`¿Eliminar "${deleteConfirm.name}"? Esta acción no se puede deshacer.`}
          confirmLabel="Sí, eliminar"
          danger
          onConfirm={() => executeDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}
