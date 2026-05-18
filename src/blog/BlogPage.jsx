import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { blogService, BLOG_CATEGORIES } from '@/firebase/services/blogService'
import PublicLayout from '@/shared/components/PublicLayout'
import styles from './BlogPage.module.css'

const ALL = 'Todos'

function fmtDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function BlogPage() {
  const [posts,    setPosts]    = useState([])
  const [loading,  setLoading]  = useState(true)
  const [category, setCategory] = useState(ALL)

  useEffect(() => {
    blogService.getPublished()
      .then(setPosts)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered  = category === ALL ? posts : posts.filter(p => p.category === category)
  const featured  = filtered.find(p => p.featured)
  const rest      = filtered.filter(p => p.id !== featured?.id)

  return (
    <PublicLayout>
      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <p className={styles.heroEyebrow}>El mundo de Serena Glow</p>
          <h1 className={styles.heroTitle}>Consejos de <em>Belleza</em></h1>
          <p className={styles.heroDesc}>
            Descubre secretos de cuidado de la piel, tutoriales de maquillaje
            <br className={styles.brDesktop} /> y las últimas novedades para realzar tu esencia femenina.
          </p>
        </div>
        <div className={styles.heroDeco} aria-hidden="true">
          <PetalSvg />
        </div>
      </section>

      {/* ── Category filters ── */}
      <div className={styles.filterBar}>
        <div className="container">
          <div className={styles.pills}>
            {[ALL, ...BLOG_CATEGORIES].map(cat => (
              <button
                key={cat}
                className={`${styles.pill} ${category === cat ? styles.pillActive : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Posts ── */}
      <section className={styles.main}>
        <div className="container">
          {loading ? (
            <div className={styles.skGrid}>
              {[1,2,3,4,5,6].map(i => <div key={i} className={`skeleton ${styles.skCard}`} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <FlowerIcon className={styles.emptyIcon} />
              <h2 className={styles.emptyTitle}>Próximamente</h2>
              <p className={styles.emptyText}>Estamos preparando contenido especial para ti. ¡Vuelve pronto!</p>
            </div>
          ) : (
            <>
              {featured && (
                <Link to={`/blog/${featured.slug}`} className={styles.featured}>
                  <div className={styles.featuredImg}>
                    {featured.coverImage
                      ? <img src={featured.coverImage} alt={featured.title} loading="lazy" />
                      : <div className={styles.imgPlaceholder}><FlowerIcon className={styles.placeholderIcon} /></div>
                    }
                    <span className={styles.featuredBadge}>✦ Destacado</span>
                  </div>
                  <div className={styles.featuredBody}>
                    {featured.category && <span className={styles.catBadge}>{featured.category}</span>}
                    <h2 className={styles.featuredTitle}>{featured.title}</h2>
                    <p className={styles.featuredExcerpt}>{featured.excerpt}</p>
                    <div className={styles.meta}>
                      <span>{fmtDate(featured.publishedAt || featured.createdAt)}</span>
                      <span className={styles.metaDot}>·</span>
                      <span>{featured.readTime ?? 1} min de lectura</span>
                      {featured.author && <><span className={styles.metaDot}>·</span><span>{featured.author}</span></>}
                    </div>
                    <span className={styles.readMore}>Leer artículo →</span>
                  </div>
                </Link>
              )}

              {rest.length > 0 && (
                <div className={styles.grid}>
                  {rest.map(post => <PostCard key={post.id} post={post} />)}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </PublicLayout>
  )
}

function PostCard({ post }) {
  function fmtDate(ts) {
    if (!ts) return ''
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })
  }
  return (
    <Link to={`/blog/${post.slug}`} className={styles.card}>
      <div className={styles.cardImg}>
        {post.coverImage
          ? <img src={post.coverImage} alt={post.title} loading="lazy" />
          : <div className={styles.imgPlaceholder}><FlowerIcon className={styles.placeholderIcon} /></div>
        }
      </div>
      <div className={styles.cardBody}>
        {post.category && <span className={styles.catBadge}>{post.category}</span>}
        <h3 className={styles.cardTitle}>{post.title}</h3>
        {post.excerpt && <p className={styles.cardExcerpt}>{post.excerpt}</p>}
        <div className={styles.meta}>
          <span>{fmtDate(post.publishedAt || post.createdAt)}</span>
          <span className={styles.metaDot}>·</span>
          <span>{post.readTime ?? 1} min</span>
        </div>
      </div>
    </Link>
  )
}

function PetalSvg() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="100" cy="100" r="30" fill="rgba(183,164,199,0.25)" />
      {[0,45,90,135,180,225,270,315].map((deg, i) => (
        <ellipse key={i} cx="100" cy="55" rx="18" ry="40"
          fill={i % 2 === 0 ? 'rgba(183,164,199,0.18)' : 'rgba(231,196,207,0.18)'}
          transform={`rotate(${deg} 100 100)`}
        />
      ))}
    </svg>
  )
}

function FlowerIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2a3 3 0 0 0 0 6 3 3 0 0 0 0-6zM12 16a3 3 0 0 0 0 6 3 3 0 0 0 0-6zM2 12a3 3 0 0 0 6 0 3 3 0 0 0-6 0zM16 12a3 3 0 0 0 6 0 3 3 0 0 0-6 0zM4.93 4.93a3 3 0 0 0 4.24 4.24 3 3 0 0 0-4.24-4.24zM14.83 14.83a3 3 0 0 0 4.24 4.24 3 3 0 0 0-4.24-4.24zM4.93 19.07a3 3 0 0 0 4.24-4.24 3 3 0 0 0-4.24 4.24zM14.83 9.17a3 3 0 0 0 4.24-4.24 3 3 0 0 0-4.24 4.24z" />
    </svg>
  )
}
