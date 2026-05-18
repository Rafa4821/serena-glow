import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { novedadesService, DEFAULT_CONFIG } from '@/firebase/services/novedadesService'
import { blogService } from '@/firebase/services/blogService'
import PublicLayout from '@/shared/components/PublicLayout'
import styles from './NovedadesPage.module.css'

function fmtPrice(p) {
  return p != null ? `$${Number(p).toFixed(2)}` : null
}

function fmtDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function NovedadesPage() {
  const [config,  setConfig]  = useState({ ...DEFAULT_CONFIG, campaign: { ...DEFAULT_CONFIG.campaign }, sections: { ...DEFAULT_CONFIG.sections } })
  const [products, setProducts] = useState([])
  const [pinned,   setPinned]   = useState([])
  const [posts,    setPosts]    = useState([])
  const [gallery,  setGallery]  = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const cfg = await novedadesService.getConfig()
        setConfig(cfg)

        const [prods, pins, blogPosts, imgs] = await Promise.all([
          cfg.sections?.newProducts
            ? novedadesService.getNewestProducts(cfg.newProductsCount ?? 8)
            : Promise.resolve([]),
          cfg.sections?.pinnedProducts && cfg.pinnedProductIds?.length
            ? novedadesService.getProductsByIds(cfg.pinnedProductIds)
            : Promise.resolve([]),
          cfg.sections?.blog
            ? blogService.getPublished().then(ps => ps.slice(0, 3))
            : Promise.resolve([]),
          cfg.sections?.gallery
            ? novedadesService.getGalleryImages(6)
            : Promise.resolve([]),
        ])

        setProducts(prods)
        setPinned(pins)
        setPosts(blogPosts)
        setGallery(imgs)
      } catch (err) {
        console.error('NovedadesPage load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const { campaign, sections } = config
  const hasImage = Boolean(campaign?.coverImage)

  return (
    <PublicLayout>
      {/* ── Campaign Hero ── */}
      <section
        className={`${styles.hero} ${hasImage ? styles.heroImage : styles.heroSolid}`}
        style={{
          backgroundImage:  hasImage ? `url(${campaign.coverImage})` : undefined,
          backgroundColor:  hasImage ? undefined : (campaign.bgColor || '#f5eaf0'),
        }}
      >
        {hasImage && <div className={styles.heroOverlay} />}
        <div className={`container ${styles.heroContent}`}>
          {campaign.badge && <span className={styles.badge}>{campaign.badge}</span>}
          <h1 className={styles.heroTitle}>
            {splitEmphasis(campaign.title)}
          </h1>
          {campaign.subtitle && <p className={styles.heroSub}>{campaign.subtitle}</p>}
          {campaign.ctaLink && campaign.ctaText && (
            <Link to={campaign.ctaLink} className={styles.heroBtn}>{campaign.ctaText}</Link>
          )}
        </div>
      </section>

      {/* ── Nuevos Productos ── */}
      {sections?.newProducts && (
        <section className={styles.section}>
          <div className="container">
            <div className={styles.sectionHead}>
              <div>
                <p className={styles.eyebrow}>Recién llegados</p>
                <h2 className={styles.sectionTitle}>Lo más <em>nuevo</em></h2>
              </div>
              <Link to="/catalogo" className={styles.seeAll}>Ver todos los productos →</Link>
            </div>
            {loading ? (
              <div className={styles.productGrid}>
                {[...Array(4)].map((_, i) => <div key={i} className={`skeleton ${styles.skCard}`} />)}
              </div>
            ) : products.length === 0 ? (
              <p className={styles.emptyText}>Próximamente nuevos productos.</p>
            ) : (
              <div className={styles.productGrid}>
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Selección Especial ── */}
      {sections?.pinnedProducts && pinned.length > 0 && (
        <section className={`${styles.section} ${styles.sectionAlt}`}>
          <div className="container">
            <div className={styles.sectionHead}>
              <div>
                <p className={styles.eyebrow}>Elegidos para ti</p>
                <h2 className={styles.sectionTitle}>Nuestra <em>Selección</em></h2>
              </div>
              <Link to="/catalogo" className={styles.seeAll}>Ver catálogo completo →</Link>
            </div>
            <div className={styles.pinnedGrid}>
              {pinned.map(p => <PinnedCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Blog Posts ── */}
      {sections?.blog && posts.length > 0 && (
        <section className={styles.section}>
          <div className="container">
            <div className={styles.sectionHead}>
              <div>
                <p className={styles.eyebrow}>Consejos y tendencias</p>
                <h2 className={styles.sectionTitle}>Desde el <em>Blog</em></h2>
              </div>
              <Link to="/blog" className={styles.seeAll}>Ver todos los artículos →</Link>
            </div>
            <div className={styles.blogGrid}>
              {posts.map(p => <BlogCard key={p.id} post={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Gallery ── */}
      {sections?.gallery && gallery.length > 0 && (
        <section className={`${styles.section} ${styles.sectionGallery}`}>
          <div className="container">
            <div className={styles.sectionHead}>
              <div>
                <p className={styles.eyebrow}>Inspiración</p>
                <h2 className={styles.sectionTitle}>Galería de <em>Belleza</em></h2>
              </div>
            </div>
            <div className={styles.galleryGrid}>
              {gallery.map((img, idx) => (
                <div key={img.id ?? idx} className={`${styles.galleryItem} ${idx === 0 ? styles.galleryFeatured : ''}`}>
                  <img src={img.url ?? img.src} alt={img.alt ?? 'Galería Serena Glow'} loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </PublicLayout>
  )
}

function splitEmphasis(title) {
  if (!title) return null
  const words = title.split(' ')
  const mid   = Math.ceil(words.length / 2)
  return (
    <>
      {words.slice(0, mid).join(' ')}{' '}
      <em>{words.slice(mid).join(' ')}</em>
    </>
  )
}

function ProductCard({ product }) {
  const price     = fmtPrice(product.price)
  const salePrice = product.salePrice ? fmtPrice(product.salePrice) : null
  const img       = product.images?.[0] ?? product.image
  return (
    <Link to={`/producto/${product.slug}`} className={styles.productCard}>
      <div className={styles.productImg}>
        {img
          ? <img src={img} alt={product.title} loading="lazy" />
          : <div className={styles.imgEmpty} />
        }
        {salePrice && <span className={styles.saleBadge}>Oferta</span>}
      </div>
      <div className={styles.productBody}>
        {product.category && <span className={styles.catBadge}>{product.category}</span>}
        <h3 className={styles.productTitle}>{product.title}</h3>
        <div className={styles.priceRow}>
          {salePrice
            ? <><span className={styles.salePrice}>{salePrice}</span><span className={styles.originalPrice}>{price}</span></>
            : <span className={styles.price}>{price}</span>
          }
        </div>
      </div>
    </Link>
  )
}

function PinnedCard({ product }) {
  const img = product.images?.[0] ?? product.image
  return (
    <Link to={`/producto/${product.slug}`} className={styles.pinnedCard}>
      <div className={styles.pinnedImg}>
        {img ? <img src={img} alt={product.title} loading="lazy" /> : <div className={styles.imgEmpty} />}
      </div>
      <div className={styles.pinnedBody}>
        {product.category && <span className={styles.catBadge}>{product.category}</span>}
        <h3 className={styles.pinnedTitle}>{product.title}</h3>
        {product.description && <p className={styles.pinnedDesc}>{product.description}</p>}
        <span className={styles.pinnedCta}>Ver producto →</span>
      </div>
    </Link>
  )
}

function BlogCard({ post }) {
  return (
    <Link to={`/blog/${post.slug}`} className={styles.blogCard}>
      <div className={styles.blogImg}>
        {post.coverImage
          ? <img src={post.coverImage} alt={post.title} loading="lazy" />
          : <div className={styles.imgEmpty} />
        }
      </div>
      <div className={styles.blogBody}>
        {post.category && <span className={styles.catBadge}>{post.category}</span>}
        <h3 className={styles.blogTitle}>{post.title}</h3>
        {post.excerpt && <p className={styles.blogExcerpt}>{post.excerpt}</p>}
        <span className={styles.blogMeta}>
          {fmtDate(post.publishedAt || post.createdAt)} · {post.readTime ?? 1} min
        </span>
      </div>
    </Link>
  )
}
