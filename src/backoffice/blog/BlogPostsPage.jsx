import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { blogService, BLOG_STATUS } from '@/firebase/services/blogService'
import { showToast } from '@/shared/components/ui/Toast'
import adminStyles from '../admin.module.css'
import styles from './BlogPostsPage.module.css'

const TABS = [
  { value: '',                    label: 'Todos' },
  { value: BLOG_STATUS.PUBLISHED, label: 'Publicados' },
  { value: BLOG_STATUS.DRAFT,     label: 'Borradores' },
  { value: BLOG_STATUS.ARCHIVED,  label: 'Archivados' },
]

const STATUS_META = {
  [BLOG_STATUS.PUBLISHED]: { label: 'Publicado', cls: 'statusPublished' },
  [BLOG_STATUS.DRAFT]:      { label: 'Borrador',  cls: 'statusDraft' },
  [BLOG_STATUS.ARCHIVED]:   { label: 'Archivado', cls: 'statusArchived' },
}

function fmtDate(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function BlogPostsPage() {
  const [posts,   setPosts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [tab,     setTab]     = useState('')
  const [search,  setSearch]  = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try { setPosts(await blogService.getAll()) }
    catch { showToast('Error al cargar entradas', 'error') }
    finally { setLoading(false) }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`¿Eliminar "${title}"? Esta acción no se puede deshacer.`)) return
    try {
      await blogService.delete(id)
      setPosts(ps => ps.filter(p => p.id !== id))
      showToast('Entrada eliminada.', 'success')
    } catch { showToast('Error al eliminar.', 'error') }
  }

  const filtered = posts
    .filter(p => tab ? p.status === tab : true)
    .filter(p => {
      const q = search.trim().toLowerCase()
      if (!q) return true
      return p.title?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)
    })

  const counts = {
    total:     posts.length,
    published: posts.filter(p => p.status === BLOG_STATUS.PUBLISHED).length,
    draft:     posts.filter(p => p.status === BLOG_STATUS.DRAFT).length,
    archived:  posts.filter(p => p.status === BLOG_STATUS.ARCHIVED).length,
  }

  return (
    <div className={styles.page}>
      <div className={adminStyles.pageHeader}>
        <div>
          <h1 className={adminStyles.pageTitle}>Blog</h1>
          <p className={adminStyles.pageSub}>{counts.total} entradas · {counts.published} publicadas</p>
        </div>
        <Link to="/admin/blog/nuevo" className={adminStyles.btnPrimary}>+ Nueva entrada</Link>
      </div>

      {/* Stats */}
      <div className={styles.statsStrip}>
        {[
          { label: 'Publicadas', value: counts.published, to: BLOG_STATUS.PUBLISHED, cls: 'statPublished' },
          { label: 'Borradores', value: counts.draft,     to: BLOG_STATUS.DRAFT,     cls: 'statDraft' },
          { label: 'Archivadas', value: counts.archived,  to: BLOG_STATUS.ARCHIVED,  cls: '' },
          { label: 'Total',      value: counts.total,     to: '',                    cls: '' },
        ].map(s => (
          <button key={s.label} className={`${styles.stat} ${styles[s.cls] ?? ''}`} onClick={() => setTab(s.to)}>
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          {TABS.map(t => (
            <button
              key={t.value}
              className={`${styles.tabBtn} ${tab === t.value ? styles.tabBtnActive : ''}`}
              onClick={() => setTab(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className={styles.searchWrap}>
          <SearchIcon className={styles.searchIcon} />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por título o categoría…"
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className={styles.listBox}>
          {[1,2,3].map(i => <div key={i} className={`skeleton ${styles.skRow}`} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className={adminStyles.emptyState}>
          {search ? 'Sin resultados para esa búsqueda.' : 'No hay entradas en esta categoría.'}
        </div>
      ) : (
        <div className={styles.listBox}>
          {filtered.map(post => (
            <div key={post.id} className={styles.row}>
              <div className={styles.rowThumb}>
                {post.coverImage
                  ? <img src={post.coverImage} alt={post.title} />
                  : <div className={styles.thumbPlaceholder}><PostIcon /></div>
                }
              </div>
              <div className={styles.rowMain}>
                <div className={styles.rowTop}>
                  <span className={`${styles.statusBadge} ${styles[STATUS_META[post.status]?.cls]}`}>
                    {STATUS_META[post.status]?.label ?? post.status}
                  </span>
                  {post.featured && <span className={styles.featuredBadge}>✦ Destacado</span>}
                  {post.category && <span className={styles.catBadge}>{post.category}</span>}
                </div>
                <h3 className={styles.rowTitle}>{post.title}</h3>
                <p className={styles.rowExcerpt}>{post.excerpt}</p>
                <div className={styles.rowMeta}>
                  <span>{fmtDate(post.publishedAt || post.createdAt)}</span>
                  <span className={styles.dot}>·</span>
                  <span>{post.readTime ?? 1} min</span>
                  <span className={styles.dot}>·</span>
                  <span>{post.views ?? 0} vistas</span>
                </div>
              </div>
              <div className={styles.rowActions}>
                <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className={adminStyles.btnSecondary} title="Ver en el sitio">
                  <ExternalIcon />
                </a>
                <Link to={`/admin/blog/${post.id}/editar`} className={adminStyles.btnEdit}>Editar</Link>
                <button onClick={() => handleDelete(post.id, post.title)} className={adminStyles.btnDelete}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SearchIcon({ className })   { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> }
function PostIcon()                  { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> }
function ExternalIcon()              { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg> }
