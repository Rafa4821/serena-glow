import { useState, useEffect, useCallback } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase/firestore'
import { productService } from '@/firebase/services/productService'
import { useImageUpload } from '../shared/hooks/useImageUpload'
import ImageUploader from '../shared/components/ImageUploader'
import ConfirmModal from '../shared/components/ConfirmModal'
import { showToast } from '@/shared/components/ui/Toast'
import { slugify } from '@/shared/utils/slugify'
import styles from './ProductsPage.module.css'
import adminStyles from '../admin.module.css'

const STATUS_OPTIONS = [
  { value: 'published', label: 'Publicado' },
  { value: 'draft',     label: 'Borrador'  },
  { value: 'archived',  label: 'Archivado' },
]

const STATUS_TABS = [
  { value: 'all',       label: 'Todos'      },
  { value: 'published', label: 'Publicados' },
  { value: 'draft',     label: 'Borradores' },
  { value: 'archived',  label: 'Archivados' },
]

const EMPTY_FORM = {
  name: '', slug: '', shortDescription: '', description: '',
  price: '', salePrice: '', currency: '$',
  categorySlug: '', categoryName: '',
  badge: '', status: 'published', featured: false, order: 0,
  stock: '', tags: '',
  imageUrl: '', imagePath: '', images: [],
  attributes: [],
}

export default function ProductsPage() {
  const [products,     setProducts]     = useState([])
  const [categories,   setCategories]   = useState([])
  const [loading,      setLoading]      = useState(true)
  const [showForm,     setShowForm]     = useState(false)
  const [editing,      setEditing]      = useState(null)
  const [form,         setForm]         = useState(EMPTY_FORM)
  const [saving,       setSaving]       = useState(false)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [quickActing,  setQuickActing]  = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null) // product to hard-delete

  const { remove } = useImageUpload()

  useEffect(() => {
    const unsubProd = onSnapshot(
      query(collection(db, 'products'), orderBy('order', 'asc')),
      snap => { setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false) }
    )
    const unsubCat = onSnapshot(
      query(collection(db, 'categories'), orderBy('order', 'asc')),
      snap => setCategories(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    )
    return () => { unsubProd(); unsubCat() }
  }, [])

  /* ── Open form ───────────────────────────────────────── */
  const openCreate = useCallback(() => {
    setEditing(null)
    setForm({ ...EMPTY_FORM, order: products.length })
    setShowForm(true)
  }, [products.length])

  const openEdit = useCallback((p) => {
    setEditing(p.id)
    setForm({ ...EMPTY_FORM, ...p, tags: Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags ?? '') })
    setShowForm(true)
  }, [])

  /* ── Form field handler ──────────────────────────────── */
  function handleField(e) {
    const { name, value, type, checked } = e.target
    setForm(f => {
      const updated = { ...f, [name]: type === 'checkbox' ? checked : value }
      if (name === 'name' && !editing) updated.slug = slugify(value)
      if (name === 'categorySlug') {
        const cat = categories.find(c => c.slug === value)
        updated.categoryName = cat?.name ?? ''
      }
      return updated
    })
  }

  function handleImageChange(result) {
    setForm(f => ({ ...f, imageUrl: result?.url ?? '', imagePath: result?.path ?? '' }))
  }

  /* ── Attributes ──────────────────────────────────────── */
  function addAttribute() {
    setForm(f => ({ ...f, attributes: [...f.attributes, { key: '', value: '' }] }))
  }

  function updateAttribute(i, field, val) {
    setForm(f => {
      const attrs = [...f.attributes]
      attrs[i] = { ...attrs[i], [field]: val }
      return { ...f, attributes: attrs }
    })
  }

  function removeAttribute(i) {
    setForm(f => ({ ...f, attributes: f.attributes.filter((_, idx) => idx !== i) }))
  }

  /* ── Save (create / update) ──────────────────────────── */
  async function handleSave(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)

    const tagsArray = typeof form.tags === 'string'
      ? form.tags.split(',').map(t => t.trim()).filter(Boolean)
      : (form.tags ?? [])

    const data = {
      name:             form.name.trim(),
      slug:             form.slug || slugify(form.name),
      shortDescription: form.shortDescription,
      description:      form.description,
      price:            form.price     ? Number(form.price)     : null,
      salePrice:        form.salePrice ? Number(form.salePrice) : null,
      currency:         form.currency,
      categorySlug:     form.categorySlug,
      categoryName:     form.categoryName,
      badge:            form.badge,
      status:           form.status,
      featured:         form.featured,
      order:            Number(form.order),
      stock:            form.stock !== '' ? Number(form.stock) : null,
      tags:             tagsArray,
      imageUrl:         form.imageUrl,
      imagePath:        form.imagePath,
      images:           form.images,
      attributes:       form.attributes,
    }

    try {
      if (editing) {
        await productService.update(editing, data)
        showToast('Producto actualizado.', 'success')
      } else {
        await productService.create(data)
        showToast('Producto creado.', 'success')
      }
      setShowForm(false)
    } catch {
      showToast('Error al guardar. Intentá nuevamente.', 'error')
    } finally {
      setSaving(false)
    }
  }

  /* ── Quick actions (inline, no form) ────────────────── */
  async function quickSetStatus(product, status) {
    setQuickActing(product.id)
    try {
      await productService.update(product.id, { status })
      const msg = {
        published: 'Producto publicado.',
        draft:     'Producto vuelto a borrador.',
        archived:  'Producto archivado.',
      }[status] ?? 'Estado actualizado.'
      showToast(msg, 'success')
    } catch {
      showToast('Error al actualizar estado.', 'error')
    } finally {
      setQuickActing(null)
    }
  }

  async function quickToggleFeatured(product) {
    setQuickActing(product.id)
    try {
      await productService.update(product.id, { featured: !product.featured })
      showToast(!product.featured ? 'Marcado como destacado.' : 'Quitado de destacados.', 'success')
    } catch {
      showToast('Error al actualizar.', 'error')
    } finally {
      setQuickActing(null)
    }
  }

  /* ── Hard delete (only after ConfirmModal) ───────────── */
  async function executeDelete(product) {
    setDeleteConfirm(null)
    setQuickActing(product.id)
    try {
      if (product.imagePath) await remove(product.imagePath)
      if (product.images?.length) {
        await Promise.allSettled(
          product.images.filter(img => img?.path).map(img => remove(img.path))
        )
      }
      await productService.delete(product.id)
      showToast('Producto eliminado permanentemente.', 'success')
    } catch {
      showToast('Error al eliminar.', 'error')
    } finally {
      setQuickActing(null)
    }
  }

  /* ── Filter ──────────────────────────────────────────── */
  const tabCounts = STATUS_TABS.reduce((acc, tab) => {
    acc[tab.value] = tab.value === 'all'
      ? products.length
      : products.filter(p => p.status === tab.value).length
    return acc
  }, {})

  const filtered = products
    .filter(p => statusFilter === 'all' || p.status === statusFilter)
    .filter(p =>
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.categoryName?.toLowerCase().includes(search.toLowerCase())
    )

  /* ── Render ──────────────────────────────────────────── */
  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={adminStyles.pageHeader}>
        <div>
          <h1 className={adminStyles.pageTitle}>Productos</h1>
          <p className={adminStyles.pageSub}>{products.length} productos registrados</p>
        </div>
        <button className={adminStyles.btnPrimary} onClick={openCreate}>
          + Nuevo producto
        </button>
      </div>

      {/* Status tabs */}
      <div className={styles.tabs}>
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            className={`${styles.tab} ${statusFilter === tab.value ? styles.tabActive : ''}`}
            onClick={() => setStatusFilter(tab.value)}
          >
            {tab.label}
            <span className={styles.tabCount}>{tabCounts[tab.value]}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="search"
        placeholder="Buscar por nombre o categoría…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className={adminStyles.searchInput}
      />

      {/* Table */}
      {loading ? (
        <div className={adminStyles.loadingRow}>Cargando…</div>
      ) : filtered.length === 0 ? (
        <div className={adminStyles.emptyState}>
          {search
            ? 'Sin resultados para esa búsqueda.'
            : statusFilter !== 'all'
              ? `No hay productos ${STATUS_TABS.find(t => t.value === statusFilter)?.label.toLowerCase()}.`
              : 'No hay productos todavía. ¡Creá el primero!'}
        </div>
      ) : (
        <div className={adminStyles.tableWrap}>
          <table className={adminStyles.table}>
            <thead>
              <tr>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Orden</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const busy = quickActing === p.id
                return (
                  <tr key={p.id} className={p.status === 'archived' ? styles.rowArchived : ''}>
                    <td>
                      {p.imageUrl
                        ? <img src={p.imageUrl} alt={p.name} className={adminStyles.tableThumb} />
                        : <div className={adminStyles.tableThumbEmpty} />
                      }
                    </td>
                    <td>
                      <span className={adminStyles.tablePrimary}>{p.name}</span>
                      {p.featured && <span className={adminStyles.badge}>★ Destacado</span>}
                    </td>
                    <td>{p.categoryName || '—'}</td>
                    <td>
                      {p.salePrice
                        ? <><s className={styles.oldPrice}>{p.currency}{Number(p.price).toLocaleString('es-VE')}</s> {p.currency}{Number(p.salePrice).toLocaleString('es-VE')}</>
                        : p.price ? `${p.currency}${Number(p.price).toLocaleString('es-VE')}` : '—'
                      }
                    </td>
                    <td>{p.order ?? '—'}</td>
                    <td>
                      <span className={
                        p.status === 'published' ? adminStyles.statusActive :
                        p.status === 'archived'  ? styles.statusArchived :
                        adminStyles.statusInactive
                      }>
                        {STATUS_OPTIONS.find(o => o.value === p.status)?.label ?? p.status}
                      </span>
                    </td>
                    <td>
                      <div className={adminStyles.actions}>
                        {/* Edit — always visible */}
                        <button
                          className={adminStyles.btnEdit}
                          onClick={() => openEdit(p)}
                          disabled={busy}
                        >
                          Editar
                        </button>

                        {/* Featured toggle — always visible */}
                        <button
                          className={`${styles.btnFeatured} ${p.featured ? styles.featuredOn : ''}`}
                          onClick={() => quickToggleFeatured(p)}
                          disabled={busy}
                          title={p.featured ? 'Quitar de destacados' : 'Marcar como destacado'}
                        >
                          {p.featured ? '★' : '☆'}
                        </button>

                        {/* Published → Archivar */}
                        {p.status === 'published' && (
                          <button
                            className={styles.btnArchive}
                            onClick={() => quickSetStatus(p, 'archived')}
                            disabled={busy}
                          >
                            {busy ? '…' : 'Archivar'}
                          </button>
                        )}

                        {/* Draft → Publicar + Archivar */}
                        {p.status === 'draft' && (
                          <>
                            <button
                              className={styles.btnPublish}
                              onClick={() => quickSetStatus(p, 'published')}
                              disabled={busy}
                            >
                              {busy ? '…' : 'Publicar'}
                            </button>
                            <button
                              className={styles.btnArchive}
                              onClick={() => quickSetStatus(p, 'archived')}
                              disabled={busy}
                            >
                              Archivar
                            </button>
                          </>
                        )}

                        {/* Archived → Restaurar + Borrar definitivo */}
                        {p.status === 'archived' && (
                          <>
                            <button
                              className={styles.btnPublish}
                              onClick={() => quickSetStatus(p, 'draft')}
                              disabled={busy}
                            >
                              {busy ? '…' : 'Restaurar'}
                            </button>
                            <button
                              className={adminStyles.btnDelete}
                              onClick={() => setDeleteConfirm(p)}
                              disabled={busy}
                            >
                              Borrar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Form Modal ─────────────────────────────────── */}
      {showForm && (
        <div className={adminStyles.modalOverlay} onClick={() => setShowForm(false)}>
          <div className={adminStyles.modal} onClick={e => e.stopPropagation()}>
            <div className={adminStyles.modalHeader}>
              <h2 className={adminStyles.modalTitle}>
                {editing ? 'Editar producto' : 'Nuevo producto'}
              </h2>
              <button className={adminStyles.modalClose} onClick={() => setShowForm(false)}>✕</button>
            </div>

            <form onSubmit={handleSave} className={adminStyles.form}>
              <div className={adminStyles.formGrid}>

                {/* ── Left column ── */}
                <div className={adminStyles.formCol}>

                  <div className={adminStyles.field}>
                    <label className={adminStyles.label}>Nombre *</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleField}
                      required
                      className={adminStyles.input}
                      placeholder="Nombre del producto"
                    />
                  </div>

                  <div className={adminStyles.field}>
                    <label className={adminStyles.label}>Slug (URL)</label>
                    <input
                      name="slug"
                      value={form.slug}
                      onChange={handleField}
                      className={adminStyles.input}
                      placeholder="nombre-del-producto"
                    />
                  </div>

                  <div className={adminStyles.field}>
                    <label className={adminStyles.label}>Descripción corta</label>
                    <input
                      name="shortDescription"
                      value={form.shortDescription}
                      onChange={handleField}
                      className={adminStyles.input}
                      placeholder="Una línea de descripción"
                    />
                  </div>

                  <div className={adminStyles.field}>
                    <label className={adminStyles.label}>Descripción completa</label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleField}
                      rows={4}
                      className={adminStyles.textarea}
                      placeholder="Descripción detallada…"
                    />
                  </div>

                  <div className={adminStyles.row}>
                    <div className={adminStyles.field}>
                      <label className={adminStyles.label}>Precio</label>
                      <input
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.price}
                        onChange={handleField}
                        className={adminStyles.input}
                        placeholder="0.00"
                      />
                    </div>
                    <div className={adminStyles.field}>
                      <label className={adminStyles.label}>Precio oferta</label>
                      <input
                        name="salePrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.salePrice}
                        onChange={handleField}
                        className={adminStyles.input}
                        placeholder="Opcional"
                      />
                    </div>
                  </div>

                  <div className={adminStyles.row}>
                    <div className={adminStyles.field}>
                      <label className={adminStyles.label}>Moneda</label>
                      <select
                        name="currency"
                        value={form.currency}
                        onChange={handleField}
                        className={adminStyles.select}
                      >
                        <option value="$">Bs. (VES)</option>
                        <option value="USD">USD</option>
                        <option value="€">EUR</option>
                      </select>
                    </div>
                    <div className={adminStyles.field}>
                      <label className={adminStyles.label}>Stock</label>
                      <input
                        name="stock"
                        type="number"
                        min="0"
                        value={form.stock}
                        onChange={handleField}
                        className={adminStyles.input}
                        placeholder="Opcional"
                      />
                    </div>
                  </div>

                  <div className={adminStyles.row}>
                    <div className={adminStyles.field}>
                      <label className={adminStyles.label}>Categoría</label>
                      <select
                        name="categorySlug"
                        value={form.categorySlug}
                        onChange={handleField}
                        className={adminStyles.select}
                      >
                        <option value="">Sin categoría</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.slug}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className={adminStyles.field}>
                      <label className={adminStyles.label}>Orden</label>
                      <input
                        name="order"
                        type="number"
                        min="0"
                        value={form.order}
                        onChange={handleField}
                        className={adminStyles.input}
                      />
                    </div>
                  </div>

                  <div className={adminStyles.row}>
                    <div className={adminStyles.field}>
                      <label className={adminStyles.label}>Badge / etiqueta</label>
                      <input
                        name="badge"
                        value={form.badge}
                        onChange={handleField}
                        className={adminStyles.input}
                        placeholder="Ej: Nuevo, Oferta…"
                      />
                    </div>
                    <div className={adminStyles.field}>
                      <label className={adminStyles.label}>Estado</label>
                      <select
                        name="status"
                        value={form.status}
                        onChange={handleField}
                        className={adminStyles.select}
                      >
                        {STATUS_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={adminStyles.field}>
                    <label className={adminStyles.label}>Tags (separados por coma)</label>
                    <input
                      name="tags"
                      value={form.tags}
                      onChange={handleField}
                      className={adminStyles.input}
                      placeholder="Ej: verano, hidratante, oferta"
                    />
                  </div>

                  <div className={adminStyles.checkRow}>
                    <label className={adminStyles.checkLabel}>
                      <input
                        type="checkbox"
                        name="featured"
                        checked={form.featured}
                        onChange={handleField}
                      />
                      Destacado en inicio
                    </label>
                  </div>

                  {/* Attributes */}
                  <div className={adminStyles.field}>
                    <div className={adminStyles.fieldHeader}>
                      <label className={adminStyles.label}>Atributos</label>
                      <button type="button" className={adminStyles.btnSm} onClick={addAttribute}>
                        + Agregar
                      </button>
                    </div>
                    {form.attributes.map((attr, i) => (
                      <div key={i} className={adminStyles.attrRow}>
                        <input
                          value={attr.key}
                          onChange={e => updateAttribute(i, 'key', e.target.value)}
                          placeholder="Propiedad"
                          className={adminStyles.input}
                        />
                        <input
                          value={attr.value}
                          onChange={e => updateAttribute(i, 'value', e.target.value)}
                          placeholder="Valor"
                          className={adminStyles.input}
                        />
                        <button
                          type="button"
                          className={adminStyles.btnIconDelete}
                          onClick={() => removeAttribute(i)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Right column – image ── */}
                <div className={adminStyles.formCol}>
                  <ImageUploader
                    label="Imagen principal"
                    folder="products"
                    value={form.imageUrl || null}
                    storagePath={form.imagePath || null}
                    onChange={handleImageChange}
                  />
                </div>
              </div>

              <div className={adminStyles.formFooter}>
                <button
                  type="button"
                  className={adminStyles.btnSecondary}
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={adminStyles.btnPrimary}
                >
                  {saving ? 'Guardando…' : editing ? 'Actualizar producto' : 'Crear producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Hard-delete confirmation ────────────────────── */}
      {deleteConfirm && (
        <ConfirmModal
          title="Eliminar producto"
          message={`¿Eliminar permanentemente "${deleteConfirm.name}"? Esta acción no se puede deshacer y borrará las imágenes asociadas.`}
          confirmLabel="Sí, eliminar"
          danger
          onConfirm={() => executeDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}
