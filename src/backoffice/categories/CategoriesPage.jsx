import { useState, useEffect } from 'react'
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
  getDocs,
} from 'firebase/firestore'
import { db } from '@/firebase/firestore'
import { useImageUpload } from '../shared/hooks/useImageUpload'
import ImageUploader from '../shared/components/ImageUploader'
import ConfirmModal from '../shared/components/ConfirmModal'
import { showToast } from '@/shared/components/ui/Toast'
import { slugify } from '@/shared/utils/slugify'
import adminStyles from '../admin.module.css'
import FieldHint from '../help/FieldHint'
import styles from './CategoriesPage.module.css'

const EMPTY = {
  name: '', slug: '', tagline: '', description: '',
  imageUrl: '', imagePath: '', imageObjectFit: 'cover',
  accentColor: '#B7A4C7', active: true, order: 0,
}

export default function CategoriesPage() {
  const [categories,    setCategories]    = useState([])
  const [loading,       setLoading]       = useState(true)
  const [productCounts, setProductCounts] = useState({})
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

  useEffect(() => {
    getDocs(collection(db, 'products')).then(snap => {
      const counts = {}
      snap.docs.forEach(d => {
        const s = d.data().categorySlug
        if (s) counts[s] = (counts[s] || 0) + 1
      })
      setProductCounts(counts)
    }).catch(() => {})
  }, [categories.length])

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
      tagline: form.tagline, description: form.description,
      imageUrl: form.imageUrl, imagePath: form.imagePath,
      imageObjectFit: form.imageObjectFit || 'cover',
      accentColor: form.accentColor || '#B7A4C7',
      active: form.active, order: Number(form.order),
      updatedAt: serverTimestamp(),
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

  async function toggleActive(cat) {
    try {
      await updateDoc(doc(db, 'categories', cat.id), { active: !cat.active, updatedAt: serverTimestamp() })
    } catch {
      showToast('Error al cambiar estado.', 'error')
    }
  }

  async function moveCategory(cat, dir) {
    const sorted = [...categories].sort((a, b) => a.order - b.order)
    const idx    = sorted.findIndex(c => c.id === cat.id)
    const other  = sorted[idx + dir]
    if (!other) return
    try {
      await Promise.all([
        updateDoc(doc(db, 'categories', cat.id),   { order: other.order, updatedAt: serverTimestamp() }),
        updateDoc(doc(db, 'categories', other.id), { order: cat.order,   updatedAt: serverTimestamp() }),
      ])
    } catch {
      showToast('Error al reordenar.', 'error')
    }
  }

  async function requestDelete(cat) {
    const count = productCounts[cat.slug] ?? 0
    if (count > 0) {
      showToast(`Esta categoría tiene ${count} producto(s). Reasignálos antes de eliminar.`, 'warning')
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

  const totalProducts = Object.values(productCounts).reduce((a, b) => a + b, 0)

  return (
    <div>
      <div className={adminStyles.pageHeader}>
        <div>
          <h1 className={adminStyles.pageTitle}>Categorías</h1>
          <p className={adminStyles.pageSub}>{categories.length} categorías · {totalProducts} productos asignados</p>
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
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Tagline</th>
                <th>Slug</th>
                <th>Productos</th>
                <th>Orden</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c, idx) => (
                <tr key={c.id}>
                  <td>
                    {c.imageUrl ? (
                      <div className={styles.thumb} style={{ backgroundColor: c.accentColor ?? '#f0e8f0' }}>
                        <img src={c.imageUrl} alt={c.name} className={styles.thumbImg} style={{ objectFit: c.imageObjectFit || 'cover' }} loading="lazy" decoding="async" />
                      </div>
                    ) : (
                      <div className={styles.thumbEmpty} style={{ backgroundColor: c.accentColor ?? '#ede6f0' }}>
                        <span style={{ fontSize: '1.2rem' }}>✨</span>
                      </div>
                    )}
                  </td>
                  <td><span className={adminStyles.tablePrimary}>{c.name}</span></td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>{c.tagline || '—'}</td>
                  <td><code style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{c.slug}</code></td>
                  <td>
                    <span className={`${styles.countBadge} ${(productCounts[c.slug] ?? 0) > 0 ? styles.countBadgeHasItems : ''}`}>
                      {productCounts[c.slug] ?? 0}
                    </span>
                  </td>
                  <td>
                    <div className={styles.orderBtns}>
                      <button className={styles.moveBtn} onClick={() => moveCategory(c, -1)} disabled={idx === 0} title="Subir">▲</button>
                      <span className={styles.orderNum}>{c.order}</span>
                      <button className={styles.moveBtn} onClick={() => moveCategory(c, 1)} disabled={idx === categories.length - 1} title="Bajar">▼</button>
                    </div>
                  </td>
                  <td>
                    <button
                      onClick={() => toggleActive(c)}
                      className={`${styles.toggleBtn} ${c.active ? styles.toggleActive : styles.toggleInactive}`}
                      title={c.active ? 'Clic para desactivar' : 'Clic para activar'}
                    >
                      {c.active ? 'Activa' : 'Inactiva'}
                    </button>
                  </td>
                  <td>
                    <div className={adminStyles.actions}>
                      <button className={adminStyles.btnEdit} onClick={() => openEdit(c)}>Editar</button>
                      <a href={`/catalogo?categoria=${c.slug}`} target="_blank" rel="noopener noreferrer" className={adminStyles.btnEdit} title="Ver en el sitio">Ver ↗</a>
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
                    <label className={adminStyles.label}>Nombre * <FieldHint text="Nombre de la categoría. Aparece en la grilla de inicio, como filtro del catálogo y como título de la tarjeta. Usa nombres cortos y descriptivos: 'Maquillaje', 'Perfumes', 'Body Care'." /></label>
                    <input name="name" value={form.name} onChange={handleField} required className={adminStyles.input} />
                  </div>
                  <div className={adminStyles.field}>
                    <label className={adminStyles.label}>Slug <FieldHint text="Identificador único de la URL. Se genera automáticamente desde el nombre. Define el filtro del catálogo: /catalogo?categoria=body-care. Evita cambiarlo después de publicar." /></label>
                    <input name="slug" value={form.slug} onChange={handleField} className={adminStyles.input} />
                    <span className={styles.hint}>URL: /catalogo?categoria={form.slug || '…'}</span>
                  </div>
                  <div className={adminStyles.field}>
                    <label className={adminStyles.label}>Tagline <FieldHint text="Texto corto que aparece DEBAJO del nombre en la tarjeta de categoría en la home. Le da personalidad y contexto. Ej: 'Para tu rutina diaria', 'Aromas que te definen'." /></label>
                    <input name="tagline" value={form.tagline} onChange={handleField} className={adminStyles.input} placeholder="Ej: Cuida tu piel cada día" />
                  </div>
                  <div className={adminStyles.field}>
                    <label className={adminStyles.label}>Descripción <FieldHint text="Descripción extendida de la categoría. Puede usarse para SEO o mostrarse como texto introductorio cuando se filtra por esta categoría en el catálogo." /></label>
                    <textarea name="description" value={form.description} onChange={handleField} rows={3} className={adminStyles.textarea} />
                  </div>
                  <div className={adminStyles.row}>
                    <div className={adminStyles.field}>
                      <label className={adminStyles.label}>Orden <FieldHint text="Define la posición de la categoría en la grilla de inicio. Las categorías con menor número aparecen primero. Usar saltos de 10 (10, 20, 30...) facilita reordenar." /></label>
                      <input name="order" type="number" min="0" value={form.order} onChange={handleField} className={adminStyles.input} />
                    </div>
                    <div className={adminStyles.field}>
                      <label className={adminStyles.label}>Color de acento <FieldHint text="Color de fondo de la tarjeta cuando no hay imagen, o como capa de color de marca sobre la imagen. Usa el selector para elegir un tono que combine con tu paleta." /></label>
                      <div className={styles.colorRow}>
                        <input name="accentColor" type="color" value={form.accentColor || '#B7A4C7'} onChange={handleField} className={styles.colorPicker} />
                        <span className={styles.colorVal}>{form.accentColor || '#B7A4C7'}</span>
                      </div>
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
                  {form.imageUrl && (
                    <div className={adminStyles.field}>
                      <label className={adminStyles.label}>Modo de imagen <FieldHint text="Cover: recorta y llena el área de la tarjeta (ideal para fotos de productos o ambientes). Contain: muestra la imagen completa sin recortar (ideal para logos o gráficos con fondo transparente)." /></label>
                      <div className={styles.fitOptions}>
                        <label className={styles.fitOption}>
                          <input type="radio" name="imageObjectFit" value="cover" checked={(form.imageObjectFit || 'cover') === 'cover'} onChange={handleField} />
                          <div className={styles.fitPreview} style={{ backgroundColor: form.accentColor ?? '#ede6f0' }}>
                            <img src={form.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" decoding="async" />
                          </div>
                          <span>Cover</span>
                          <small>Recorta y llena (fotos)</small>
                        </label>
                        <label className={styles.fitOption}>
                          <input type="radio" name="imageObjectFit" value="contain" checked={form.imageObjectFit === 'contain'} onChange={handleField} />
                          <div className={styles.fitPreview} style={{ backgroundColor: form.accentColor ?? '#ede6f0' }}>
                            <img src={form.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }} loading="lazy" decoding="async" />
                          </div>
                          <span>Contain</span>
                          <small>Muestra completa (logos)</small>
                        </label>
                      </div>
                    </div>
                  )}
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
