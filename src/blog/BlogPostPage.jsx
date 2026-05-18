import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { blogService } from '@/firebase/services/blogService'
import { parseMarkdown } from '@/shared/utils/markdownUtils'
import { useSiteSettings } from '@/app/providers/SiteSettingsProvider'
import PublicLayout from '@/shared/components/PublicLayout'
import styles from './BlogPostPage.module.css'

function fmtDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function BlogPostPage() {
  const { slug }           = useParams()
  const navigate           = useNavigate()
  const { settings }       = useSiteSettings()
  const [post,     setPost]     = useState(null)
  const [related,  setRelated]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [copied,   setCopied]   = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const p = await blogService.getBySlug(slug)
      if (!p || p.status !== 'published') { navigate('/blog', { replace: true }); return }
      setPost(p)
      document.title = `${p.seo?.metaTitle || p.title} | Serena Glow`
      blogService.incrementViews(p.id).catch(() => {})
      if (p.category) {
        blogService.getRelated(p.category, p.id, 3)
          .then(setRelated)
          .catch(() => {})
      }
      setLoading(false)
    }
    load()
    return () => { document.title = 'Serena Glow' }
  }, [slug, navigate])

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const waShareUrl = post
    ? `https://wa.me/?text=${encodeURIComponent(`${post.title} — ${window.location.href}`)}`
    : null

  if (loading) return (
    <PublicLayout>
      <div className={styles.skeleton}>
        <div className={`skeleton ${styles.skCover}`} />
        <div className="container">
          <div className={`skeleton ${styles.skTitle}`} />
          <div className={`skeleton ${styles.skLine}`} />
          <div className={`skeleton ${styles.skLine}`} style={{ width: '75%' }} />
          <div className={`skeleton ${styles.skLine}`} />
        </div>
      </div>
    </PublicLayout>
  )

  if (!post) return null

  return (
    <PublicLayout>
      {/* Cover */}
      {post.coverImage && (
        <div className={styles.coverWrap}>
          <img src={post.coverImage} alt={post.title} className={styles.cover} />
          <div className={styles.coverOverlay} />
        </div>
      )}

      <article className={styles.article}>
        <div className={`container ${styles.articleInner}`}>

          {/* Breadcrumb */}
          <nav className={styles.breadcrumb} aria-label="breadcrumb">
            <Link to="/">Inicio</Link>
            <span className={styles.sep}>›</span>
            <Link to="/blog">Blog</Link>
            <span className={styles.sep}>›</span>
            <span>{post.title}</span>
          </nav>

          {/* Header */}
          <header className={styles.header}>
            {post.category && <span className={styles.catBadge}>{post.category}</span>}
            <h1 className={styles.title}>{post.title}</h1>
            <div className={styles.meta}>
              {post.author && <span className={styles.author}>{post.author}</span>}
              {post.author && <span className={styles.metaDot}>·</span>}
              <span>{fmtDate(post.publishedAt || post.createdAt)}</span>
              <span className={styles.metaDot}>·</span>
              <span>{post.readTime ?? 1} min de lectura</span>
              {post.views > 0 && (
                <><span className={styles.metaDot}>·</span><span>{post.views} lecturas</span></>
              )}
            </div>
            {post.tags?.length > 0 && (
              <div className={styles.tags}>
                {post.tags.map(t => <span key={t} className={styles.tag}>{t}</span>)}
              </div>
            )}
          </header>

          {/* Excerpt */}
          {post.excerpt && <p className={styles.excerpt}>{post.excerpt}</p>}

          {/* Content */}
          <div
            className={styles.prose}
            dangerouslySetInnerHTML={{ __html: parseMarkdown(post.content) }}
          />

          {/* Share */}
          <div className={styles.shareSection}>
            <p className={styles.shareLabel}>Compartir artículo</p>
            <div className={styles.shareRow}>
              <button onClick={copyLink} className={styles.shareBtn}>
                <LinkIcon className={styles.shareIcon} />
                {copied ? '¡Copiado!' : 'Copiar enlace'}
              </button>
              {waShareUrl && (
                <a href={waShareUrl} target="_blank" rel="noopener noreferrer" className={`${styles.shareBtn} ${styles.shareBtnWa}`}>
                  <WaIcon className={styles.shareIcon} /> Compartir por WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* Back */}
          <Link to="/blog" className={styles.backLink}>← Volver al blog</Link>
        </div>
      </article>

      {/* Related posts */}
      {related.length > 0 && (
        <section className={styles.relatedSection}>
          <div className="container">
            <h2 className={styles.relatedTitle}>También te puede interesar</h2>
            <div className={styles.relatedGrid}>
              {related.map(p => <RelatedCard key={p.id} post={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* WhatsApp CTA */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={styles.ctaBox}>
            <p className={styles.ctaEyebrow}>¿Tienes preguntas?</p>
            <h2 className={styles.ctaTitle}>Hablemos por WhatsApp</h2>
            <p className={styles.ctaText}>Nuestro equipo está listo para asesorarte personalmente sobre los mejores productos para tu rutina de belleza.</p>
            <a
              href={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(settings.whatsappMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaBtn}
            >
              <WaIcon className={styles.ctaBtnIcon} /> Consultar ahora
            </a>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}

function RelatedCard({ post }) {
  function fmtShort(ts) {
    if (!ts) return ''
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })
  }
  return (
    <Link to={`/blog/${post.slug}`} className={styles.relatedCard}>
      <div className={styles.relatedImg}>
        {post.coverImage
          ? <img src={post.coverImage} alt={post.title} loading="lazy" />
          : <div className={styles.relatedPlaceholder} />
        }
      </div>
      <div className={styles.relatedBody}>
        {post.category && <span className={styles.catBadge}>{post.category}</span>}
        <p className={styles.relatedCardTitle}>{post.title}</p>
        <span className={styles.relatedMeta}>{fmtShort(post.publishedAt || post.createdAt)} · {post.readTime ?? 1} min</span>
      </div>
    </Link>
  )
}

function LinkIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> }
function WaIcon({ className })   { return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zm-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg> }
