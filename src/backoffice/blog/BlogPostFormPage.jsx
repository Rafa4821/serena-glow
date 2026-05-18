import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { blogService, BLOG_STATUS, BLOG_CATEGORIES } from '@/firebase/services/blogService'
import { slugify } from '@/shared/utils/dataUtils'
import { calcReadTime, parseMarkdown } from '@/shared/utils/markdownUtils'
import { showToast } from '@/shared/components/ui/Toast'
import adminStyles from '../admin.module.css'
import styles from './BlogPostFormPage.module.css'

const EMPTY = {
  title: '', slug: '', excerpt: '', content: '',
  coverImage: '', category: '', tags: '',
  status: BLOG_STATUS.DRAFT, featured: false, author: '',
  readTime: '', seo: { metaTitle: '', metaDescription: '' },
}

export default function BlogPostFormPage() {
  const { id }        = useParams()
  const navigate      = useNavigate()
  const isEdit        = Boolean(id)
  const contentRef    = useRef(null)

  const [form,        setForm]        = useState(EMPTY)
  const [saving,      setSaving]      = useState(false)
  const [loading,     setLoading]     = useState(isEdit)
  const [preview,     setPreview]     = useState(false)
  const [wasPublished, setWasPublished] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    blogService.getById(id).then(post => {
      if (!post) { navigate('/admin/blog'); return }
      setForm({
        ...EMPTY,
        ...post,
        tags: Array.isArray(post.tags) ? post.tags.join(', ') : (post.tags ?? ''),
        seo:  { metaTitle: post.seo?.metaTitle ?? '', metaDescription: post.seo?.metaDescription ?? '' },
      })
      setWasPublished(post.status === BLOG_STATUS.PUBLISHED)
      setLoading(false)
    }).catch(() => { showToast('Error al cargar entrada', 'error'); navigate('/admin/blog') })
  }, [id, isEdit, navigate])

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  function setSeo(key, val) {
    setForm(f => ({ ...f, seo: { ...f.seo, [key]: val } }))
  }

  function onTitleChange(val) {
    setForm(f => ({
      ...f,
      title: val,
      slug: f.slug || '',
      seo:  { ...f.seo, metaTitle: f.seo.metaTitle || val.slice(0, 60) },
    }))
  }

  function genSlug() {
    set('slug', slugify(form.title))
  }

  function insertAtCursor(prefix, suffix = '') {
    const el = contentRef.current
    if (!el) return
    const { selectionStart: s, selectionEnd: e, value: v } = el
    const newVal = v.slice(0, s) + prefix + v.slice(s, e) + suffix + v.slice(e)
    set('content', newVal)
    requestAnimationFrame(() => {
      el.focus()
      el.selectionStart = s + prefix.length
      el.selectionEnd   = e + prefix.length
    })
  }

  async function handleSave(publishNow = false) {
    if (!form.title.trim()) { showToast('El título es obligatorio.', 'error'); return }
    setSaving(true)
    try {
      const tags     = typeof form.tags === 'string'
        ? form.tags.split(',').map(t => t.trim()).filter(Boolean)
        : (form.tags ?? [])
      const slug     = form.slug.trim() || slugify(form.title)
      const readTime = Number(form.readTime) || calcReadTime(form.content)
      const status   = publishNow ? BLOG_STATUS.PUBLISHED : form.status
      const payload  = { ...form, slug, tags, readTime, status, seo: form.seo }

      if (isEdit) {
        await blogService.update(id, payload, wasPublished)
        showToast('Entrada actualizada.', 'success')
        if (publishNow && !wasPublished) setWasPublished(true)
      } else {
        await blogService.create(payload)
        showToast('Entrada creada.', 'success')
        navigate('/admin/blog')
      }
    } catch { showToast('Error al guardar.', 'error') }
    finally { setSaving(false) }
  }

  const autoReadTime = calcReadTime(form.content)

  if (loading) return (
    <div className={styles.page}>
      <div className={`skeleton ${styles.skPage}`} />
    </div>
  )

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={adminStyles.pageHeader}>
        <div>
          <h1 className={adminStyles.pageTitle}>{isEdit ? 'Editar entrada' : 'Nueva entrada'}</h1>
          <p className={adminStyles.pageSub}>
            <Link to="/admin/blog" className={styles.breadLink}>Blog</Link> › {form.title || 'Sin título'}
          </p>
        </div>
        <div className={styles.headerActions}>
          <button className={adminStyles.btnSecondary} onClick={() => handleSave(false)} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar borrador'}
          </button>
          <button className={adminStyles.btnPrimary} onClick={() => handleSave(true)} disabled={saving}>
            {wasPublished ? 'Actualizar' : 'Publicar'}
          </button>
        </div>
      </div>

      <div className={styles.layout}>
        {/* ── Left: Editor ── */}
        <div className={styles.editor}>

          {/* Title */}
          <div className={styles.field}>
            <label className={styles.label}>Título *</label>
            <input
              className={styles.titleInput}
              value={form.title}
              onChange={e => onTitleChange(e.target.value)}
              placeholder="Escribe un título atractivo…"
              type="text"
            />
          </div>

          {/* Slug */}
          <div className={styles.field}>
            <label className={styles.label}>Slug (URL)</label>
            <div className={styles.slugRow}>
              <span className={styles.slugPrefix}>/blog/</span>
              <input
                className={styles.slugInput}
                value={form.slug}
                onChange={e => set('slug', e.target.value)}
                placeholder="mi-articulo"
                type="text"
              />
              <button className={adminStyles.btnSecondary} onClick={genSlug} type="button">Generar</button>
            </div>
          </div>

          {/* Excerpt */}
          <div className={styles.field}>
            <label className={styles.label}>
              Extracto
              <span className={styles.charCount}>{form.excerpt.length}/200</span>
            </label>
            <textarea
              className={styles.textarea}
              value={form.excerpt}
              onChange={e => set('excerpt', e.target.value.slice(0, 200))}
              placeholder="Breve descripción del artículo (aparece en la lista del blog)…"
              rows={3}
            />
          </div>

          {/* Content editor */}
          <div className={styles.field}>
            <div className={styles.contentHeader}>
              <label className={styles.label}>Contenido</label>
              <button
                type="button"
                className={`${styles.previewToggle} ${preview ? styles.previewToggleActive : ''}`}
                onClick={() => setPreview(v => !v)}
              >
                {preview ? 'Editar' : 'Vista previa'}
              </button>
            </div>
            {!preview ? (
              <>
                <div className={styles.toolbar}>
                  <button type="button" className={styles.tbBtn} onClick={() => insertAtCursor('\n## ', '\n')} title="Título H2">H2</button>
                  <button type="button" className={styles.tbBtn} onClick={() => insertAtCursor('\n### ', '\n')} title="Título H3">H3</button>
                  <button type="button" className={`${styles.tbBtn} ${styles.tbBold}`} onClick={() => insertAtCursor('**', '**')} title="Negrita">B</button>
                  <button type="button" className={`${styles.tbBtn} ${styles.tbItalic}`} onClick={() => insertAtCursor('*', '*')} title="Cursiva">I</button>
                  <button type="button" className={styles.tbBtn} onClick={() => insertAtCursor('\n- ')} title="Lista">— Lista</button>
                  <button type="button" className={styles.tbBtn} onClick={() => insertAtCursor('\n> ')} title="Cita">&ldquo; Cita</button>
                  <button type="button" className={styles.tbBtn} onClick={() => insertAtCursor('\n---\n')} title="Separador">― HR</button>
                </div>
                <textarea
                  ref={contentRef}
                  className={styles.contentTextarea}
                  value={form.content}
                  onChange={e => set('content', e.target.value)}
                  placeholder={'Escribe aquí tu artículo…\n\n# Título principal\n## Subtítulo\n\nUsa **negrita**, *cursiva*, - listas y > citas.'}
                  rows={22}
                />
                <p className={styles.hint}>
                  {form.content.trim().split(/\s+/).filter(Boolean).length} palabras · lectura estimada: {autoReadTime} min
                </p>
              </>
            ) : (
              <div
                className={styles.previewBox}
                dangerouslySetInnerHTML={{ __html: parseMarkdown(form.content) || '<p class="empty-preview">Sin contenido todavía…</p>' }}
              />
            )}
          </div>
        </div>

        {/* ── Right: Settings ── */}
        <aside className={styles.settings}>

          {/* Status */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}><StatusIcon /> Estado</h3>
            <select className={styles.select} value={form.status} onChange={e => set('status', e.target.value)}>
              <option value={BLOG_STATUS.DRAFT}>Borrador</option>
              <option value={BLOG_STATUS.PUBLISHED}>Publicado</option>
              <option value={BLOG_STATUS.ARCHIVED}>Archivado</option>
            </select>
            <label className={styles.checkRow}>
              <input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)} />
              Marcar como destacado
            </label>
          </div>

          {/* Cover image */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}><ImageIcon /> Imagen de portada</h3>
            <input
              type="url"
              className={styles.input}
              value={form.coverImage}
              onChange={e => set('coverImage', e.target.value)}
              placeholder="https://…"
            />
            {form.coverImage && (
              <div className={styles.coverPreview}>
                <img src={form.coverImage} alt="preview" onError={e => { e.target.style.display='none' }} />
              </div>
            )}
          </div>

          {/* Category & Author */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}><TagIcon /> Categoría y autor</h3>
            <label className={styles.fieldLabel}>Categoría</label>
            <select className={styles.select} value={form.category} onChange={e => set('category', e.target.value)}>
              <option value="">Sin categoría</option>
              {BLOG_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <label className={styles.fieldLabel}>Autor</label>
            <input
              type="text"
              className={styles.input}
              value={form.author}
              onChange={e => set('author', e.target.value)}
              placeholder="Nombre del autor"
            />
            <label className={styles.fieldLabel}>Etiquetas (separadas por coma)</label>
            <input
              type="text"
              className={styles.input}
              value={form.tags}
              onChange={e => set('tags', e.target.value)}
              placeholder="rutina, piel seca, verano"
            />
            <label className={styles.fieldLabel}>Tiempo de lectura (min)</label>
            <input
              type="number"
              className={styles.input}
              value={form.readTime}
              onChange={e => set('readTime', e.target.value)}
              placeholder={`Auto: ${autoReadTime} min`}
              min={1}
            />
          </div>

          {/* SEO */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}><SeoIcon /> SEO</h3>
            <label className={styles.fieldLabel}>
              Meta título
              <span className={styles.charCount}>{form.seo.metaTitle.length}/60</span>
            </label>
            <input
              type="text"
              className={styles.input}
              value={form.seo.metaTitle}
              onChange={e => setSeo('metaTitle', e.target.value.slice(0, 60))}
              placeholder="Título para motores de búsqueda"
            />
            <label className={styles.fieldLabel}>
              Meta descripción
              <span className={styles.charCount}>{form.seo.metaDescription.length}/160</span>
            </label>
            <textarea
              className={styles.textarea}
              value={form.seo.metaDescription}
              onChange={e => setSeo('metaDescription', e.target.value.slice(0, 160))}
              placeholder="Descripción que aparece en Google…"
              rows={3}
            />
          </div>

        </aside>
      </div>
    </div>
  )
}

function StatusIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> }
function ImageIcon()  { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> }
function TagIcon()    { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg> }
function SeoIcon()    { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> }
