import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { blogCategoryService } from '@/firebase/services/blogCategoryService'
import { BLOG_CATEGORIES } from '@/firebase/services/blogService'
import { slugify } from '@/shared/utils/dataUtils'
import { showToast } from '@/shared/components/ui/Toast'
import adminStyles from '../admin.module.css'
import styles from './BlogCategoriesPage.module.css'

export default function BlogCategoriesPage() {
  const [cats,     setCats]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [addOpen,  setAddOpen]  = useState(false)
  const [addName,  setAddName]  = useState('')
  const [addSlug,  setAddSlug]  = useState('')
  const [editId,   setEditId]   = useState(null)
  const [editName, setEditName] = useState('')
  const [editSlug, setEditSlug] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { setCats(await blogCategoryService.getAll()) }
    catch { showToast('Error al cargar categorías', 'error') }
    finally { setLoading(false) }
  }

  async function handleCreate() {
    const name = addName.trim()
    if (!name) { showToast('El nombre es obligatorio', 'error'); return }
    if (cats.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      showToast('Ya existe una categoría con ese nombre', 'error'); return
    }
    setSaving(true)
    try {
      await blogCategoryService.create({ name, slug: addSlug.trim() || slugify(name) })
      showToast('Categoría creada', 'success')
      setAddName(''); setAddSlug(''); setAddOpen(false)
      await load()
    } catch { showToast('Error al crear', 'error') }
    finally { setSaving(false) }
  }

  function startEdit(cat) {
    setEditId(cat.id); setEditName(cat.name); setEditSlug(cat.slug)
  }
  function cancelEdit() { setEditId(null); setEditName(''); setEditSlug('') }

  async function handleUpdate() {
    const name = editName.trim()
    if (!name) { showToast('El nombre es obligatorio', 'error'); return }
    setSaving(true)
    try {
      await blogCategoryService.update(editId, { name, slug: editSlug.trim() || slugify(name) })
      showToast('Categoría actualizada', 'success')
      cancelEdit(); await load()
    } catch { showToast('Error al actualizar', 'error') }
    finally { setSaving(false) }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`¿Eliminar la categoría "${name}"?\nLas entradas que la usen quedarán sin categoría.`)) return
    try {
      await blogCategoryService.delete(id)
      setCats(c => c.filter(x => x.id !== id))
      showToast('Categoría eliminada', 'success')
    } catch { showToast('Error al eliminar', 'error') }
  }

  async function handleMigrateDefaults() {
    if (!window.confirm('Esto creará las categorías predeterminadas en la base de datos. ¿Continuar?')) return
    setSaving(true)
    try {
      const existing = cats.map(c => c.name.toLowerCase())
      const toCreate = BLOG_CATEGORIES.filter(n => !existing.includes(n.toLowerCase()))
      await Promise.all(toCreate.map(name => blogCategoryService.create({ name, slug: slugify(name) })))
      showToast(`${toCreate.length} categoría${toCreate.length !== 1 ? 's' : ''} importada${toCreate.length !== 1 ? 's' : ''}`, 'success')
      await load()
    } catch { showToast('Error al importar', 'error') }
    finally { setSaving(false) }
  }

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.topBar}>
        <Link to="/admin/blog" className={styles.backBtn}>
          <BackIcon /> Volver al Blog
        </Link>
      </div>
      <div className={adminStyles.pageHeader}>
        <div>
          <h1 className={adminStyles.pageTitle}>Categorías del Blog</h1>
          <p className={adminStyles.pageSub}>
            {cats.length} categoría{cats.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          className={adminStyles.btnPrimary}
          onClick={() => { setAddOpen(v => !v); setAddName(''); setAddSlug('') }}
        >
          {addOpen ? 'Cancelar' : '+ Nueva categoría'}
        </button>
      </div>

      {/* Create form */}
      {addOpen && (
        <div className={styles.createCard}>
          <p className={styles.createTitle}>Nueva categoría</p>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.fieldLabel}>Nombre *</label>
              <input
                className={adminStyles.input}
                value={addName}
                onChange={e => { setAddName(e.target.value); if (!addSlug) setAddSlug(slugify(e.target.value)) }}
                placeholder="ej. Cuidado de la piel"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.fieldLabel}>Slug (URL)</label>
              <input
                className={adminStyles.input}
                value={addSlug}
                onChange={e => setAddSlug(e.target.value)}
                placeholder="cuidado-de-la-piel"
              />
            </div>
            <div className={styles.formActions}>
              <button className={adminStyles.btnPrimary} onClick={handleCreate} disabled={saving}>
                {saving ? 'Guardando…' : 'Crear categoría'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className={styles.listBox}>
          {[1, 2, 3].map(i => <div key={i} className={`skeleton ${styles.skRow}`} />)}
        </div>
      ) : cats.length === 0 ? (
        <div className={styles.emptyWrap}>
          <div className={adminStyles.emptyState}>
            No hay categorías todavía. Crea la primera con el botón de arriba.
          </div>
          <div className={styles.migrateWrap}>
            <button className={styles.migrateBtn} onClick={handleMigrateDefaults} disabled={saving}>
              <MigrateIcon /> Importar categorías predeterminadas ({BLOG_CATEGORIES.length})
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.listBox}>
            {cats.map(cat => (
              <div key={cat.id} className={styles.catRow}>
                {editId === cat.id ? (
                  <div className={styles.editRowInner}>
                    <div className={styles.editFields}>
                      <input
                        className={`${adminStyles.input} ${styles.editInput}`}
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleUpdate(); if (e.key === 'Escape') cancelEdit() }}
                        autoFocus
                        placeholder="Nombre"
                      />
                      <input
                        className={`${adminStyles.input} ${styles.editInput}`}
                        value={editSlug}
                        onChange={e => setEditSlug(e.target.value)}
                        placeholder="slug"
                      />
                    </div>
                    <div className={styles.editActions}>
                      <button className={adminStyles.btnPrimary}   onClick={handleUpdate} disabled={saving}>Guardar</button>
                      <button className={adminStyles.btnSecondary} onClick={cancelEdit}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.catInfo}>
                      <div className={styles.catDot} />
                      <div>
                        <p className={styles.catName}>{cat.name}</p>
                        <p className={styles.catSlug}>{cat.slug}</p>
                      </div>
                    </div>
                    <div className={styles.catActions}>
                      <button className={adminStyles.btnEdit}   onClick={() => startEdit(cat)}>Editar</button>
                      <button className={adminStyles.btnDelete} onClick={() => handleDelete(cat.id, cat.name)}>Eliminar</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          <p className={styles.hint}>
            Los cambios de nombre no se aplican retroactivamente a las entradas existentes. Edita las entradas afectadas si es necesario.
          </p>
        </>
      )}

    </div>
  )
}

function MigrateIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline',verticalAlign:'middle',marginRight:'6px'}}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> }
function BackIcon()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg> }
