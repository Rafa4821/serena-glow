import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { blogService, BLOG_STATUS, BLOG_CATEGORIES } from '@/firebase/services/blogService'
import { blogCategoryService } from '@/firebase/services/blogCategoryService'
import { slugify } from '@/shared/utils/dataUtils'
import { calcReadTime, parseMarkdown } from '@/shared/utils/markdownUtils'
import { showToast } from '@/shared/components/ui/Toast'
import MediaPickerModal from '@/backoffice/shared/components/MediaPickerModal'
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
  const [editorMode,          setEditorMode]          = useState('edit')
  const [wasPublished,        setWasPublished]        = useState(false)
  const [categories,          setCategories]          = useState(BLOG_CATEGORIES)
  const [coverPickerOpen,     setCoverPickerOpen]     = useState(false)
  const [contentImgOpen,      setContentImgOpen]      = useState(false)
  const [linkPanel,           setLinkPanel]           = useState(false)
  const [linkUrl,             setLinkUrl]             = useState('')
  const [linkText,            setLinkText]            = useState('')

  useEffect(() => {
    blogCategoryService.getAll()
      .then(list => { if (list.length) setCategories(list.map(c => c.name)) })
      .catch(() => {})
  }, [])

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

  function wrapSelection(prefix, suffix = '') {
    const el = contentRef.current
    if (!el) return
    const { selectionStart: s, selectionEnd: e, value: v } = el
    const selected = v.slice(s, e)
    const newVal   = v.slice(0, s) + prefix + selected + suffix + v.slice(e)
    set('content', newVal)
    requestAnimationFrame(() => {
      el.focus()
      el.selectionStart = s + prefix.length
      el.selectionEnd   = s + prefix.length + selected.length
    })
  }

  function insertLink() {
    if (!linkUrl.trim()) return
    const text = linkText.trim() || linkUrl.trim()
    insertAtCursor(`[${text}](${linkUrl.trim()})`)
    setLinkPanel(false); setLinkUrl(''); setLinkText('')
  }

  function handleContentImage({ url, path }) {
    const alt = path?.split('/').pop()?.split('.')[0] ?? 'imagen'
    insertAtCursor(`\n![${alt}](${url})\n`)
    setContentImgOpen(false)
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
              <div className={styles.viewModes}>
                <button type="button" className={`${styles.viewBtn} ${editorMode==='edit'    ? styles.viewBtnActive:''}`} onClick={() => setEditorMode('edit')}><EditModeIcon /> Editar</button>
                <button type="button" className={`${styles.viewBtn} ${editorMode==='split'   ? styles.viewBtnActive:''}`} onClick={() => setEditorMode('split')}><SplitModeIcon /> Dividir</button>
                <button type="button" className={`${styles.viewBtn} ${editorMode==='preview' ? styles.viewBtnActive:''}`} onClick={() => setEditorMode('preview')}><EyeModeIcon /> Vista previa</button>
              </div>
            </div>

            <div className={`${styles.editorWrap} ${editorMode==='split' ? styles.editorSplit : ''}`}>

              {/* ── Write panel ── */}
              {editorMode !== 'preview' && (
                <div className={styles.writePanel}>
                  <div className={styles.toolbar}>
                    <div className={styles.tbGroup}>
                      <button type="button" className={`${styles.tbBtn} ${styles.tbBold}`}   onClick={() => wrapSelection('**','**')} title="Negrita"><BoldIcon /><span>Negrita</span></button>
                      <button type="button" className={`${styles.tbBtn} ${styles.tbItalic}`} onClick={() => wrapSelection('*','*')}   title="Cursiva"><ItalicIcon /><span>Cursiva</span></button>
                      <button type="button" className={styles.tbBtn}                          onClick={() => wrapSelection('~~','~~')} title="Tachado"><StrikeIcon /><span>Tachado</span></button>
                    </div>
                    <div className={styles.tbDivider} />
                    <div className={styles.tbGroup}>
                      <button type="button" className={styles.tbBtn} onClick={() => insertAtCursor('\n## ',  '\n')} title="Título"><TitleIcon size="lg" /><span>Título</span></button>
                      <button type="button" className={styles.tbBtn} onClick={() => insertAtCursor('\n### ', '\n')} title="Subtítulo"><TitleIcon size="sm" /><span>Subtítulo</span></button>
                    </div>
                    <div className={styles.tbDivider} />
                    <div className={styles.tbGroup}>
                      <button type="button" className={styles.tbBtn} onClick={() => insertAtCursor('\n- ')}  title="Lista con viñetas"><ListIcon /><span>Lista</span></button>
                      <button type="button" className={styles.tbBtn} onClick={() => insertAtCursor('\n1. ')} title="Lista numerada"><OListIcon /><span>Numerada</span></button>
                    </div>
                    <div className={styles.tbDivider} />
                    <div className={styles.tbGroup}>
                      <button type="button" className={styles.tbBtn}                                         onClick={() => insertAtCursor('\n> ')}    title="Cita"><QuoteIcon /><span>Cita</span></button>
                      <button type="button" className={styles.tbBtn}                                         onClick={() => insertAtCursor('\n---\n')}  title="Separador"><HrIcon /><span>Separador</span></button>
                      <button type="button" className={`${styles.tbBtn} ${linkPanel ? styles.tbBtnActive:''}`} onClick={() => setLinkPanel(v => !v)}  title="Enlace"><LinkBtnIcon /><span>Enlace</span></button>
                      <button type="button" className={styles.tbBtn}                                         onClick={() => setContentImgOpen(true)}   title="Insertar imagen"><ImgIcon /><span>Imagen</span></button>
                    </div>
                  </div>

                  {linkPanel && (
                    <div className={styles.linkPanel}>
                      <input className={styles.linkInput} value={linkText} onChange={e => setLinkText(e.target.value)} placeholder="Texto del enlace…" />
                      <input className={styles.linkInput} value={linkUrl}  onChange={e => setLinkUrl(e.target.value)}  placeholder="https://…" type="url" />
                      <button type="button" className={styles.linkInsertBtn} onClick={insertLink}>Insertar</button>
                      <button type="button" className={styles.linkCancelBtn} onClick={() => { setLinkPanel(false); setLinkUrl(''); setLinkText('') }}>✕</button>
                    </div>
                  )}

                  <textarea
                    ref={contentRef}
                    className={styles.contentTextarea}
                    value={form.content}
                    onChange={e => set('content', e.target.value)}
                    placeholder="Empieza a escribir tu artículo aquí…"
                    rows={22}
                  />
                </div>
              )}

              {/* ── Preview panel ── */}
              {editorMode !== 'edit' && (
                <div className={styles.previewPanel}>
                  {editorMode === 'split' && <p className={styles.splitLabel}>Vista previa</p>}
                  <div
                    className={styles.previewBox}
                    dangerouslySetInnerHTML={{ __html: parseMarkdown(form.content) || '<p style="color:var(--color-text-muted);font-style:italic">El artículo aparecerá aquí…</p>' }}
                  />
                </div>
              )}

            </div>
            <p className={styles.hint}>{form.content.trim().split(/\s+/).filter(Boolean).length} palabras · lectura estimada: {autoReadTime} min</p>
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
            {form.coverImage ? (
              <>
                <div className={styles.coverPreview}>
                  <img src={form.coverImage} alt="preview" onError={e => { e.target.style.display='none' }} />
                </div>
                <div className={styles.coverActions}>
                  <button type="button" className={styles.coverChangeBtn} onClick={() => setCoverPickerOpen(true)}>Cambiar imagen</button>
                  <button type="button" className={styles.coverRemoveBtn} onClick={() => set('coverImage', '')}>✕ Quitar</button>
                </div>
              </>
            ) : (
              <button type="button" className={styles.mediaPickerBtn} onClick={() => setCoverPickerOpen(true)}>
                <PhotoPickerIcon />
                <span>Elegir de la biblioteca de medios</span>
              </button>
            )}
          </div>

          {/* Category & Author */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}><TagIcon /> Categoría y autor</h3>
            <label className={styles.fieldLabel}>Categoría</label>
            <select className={styles.select} value={form.category} onChange={e => set('category', e.target.value)}>
              <option value="">Sin categoría</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
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
      {coverPickerOpen && (
        <MediaPickerModal
          onSelect={({ url }) => { set('coverImage', url); setCoverPickerOpen(false) }}
          onClose={() => setCoverPickerOpen(false)}
        />
      )}
      {contentImgOpen && (
        <MediaPickerModal
          onSelect={handleContentImage}
          onClose={() => setContentImgOpen(false)}
        />
      )}
    </div>
  )
}

/* ── Sidebar icons ── */
function StatusIcon()      { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> }
function ImageIcon()       { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> }
function TagIcon()         { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg> }
function SeoIcon()         { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> }
function PhotoPickerIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> }

/* ── View-mode icons ── */
function EditModeIcon()  { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> }
function SplitModeIcon() { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg> }
function EyeModeIcon()   { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> }

/* ── Toolbar icons ── */
function BoldIcon()    { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg> }
function ItalicIcon()  { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg> }
function StrikeIcon()  { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.3 4.9c-2.3-.6-4.4-1-6.2-.9-2.7 0-5.3.7-5.3 3.6 0 1.5 1.4 3.3 4.7 3.7h.3"/><path d="M6.9 17.8c1.5.9 3.2 1.3 5.2 1.2 2.7 0 5.3-1.2 5.3-4.4"/><line x1="2" y1="12" x2="22" y2="12"/></svg> }
function TitleIcon({ size }) {
  return size === 'lg'
    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h10M4 18h6"/></svg>
    : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h13M4 18h10"/></svg>
}
function ListIcon()    { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/></svg> }
function OListIcon()   { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg> }
function QuoteIcon()   { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg> }
function HrIcon()      { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg> }
function LinkBtnIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> }
function ImgIcon()     { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> }
