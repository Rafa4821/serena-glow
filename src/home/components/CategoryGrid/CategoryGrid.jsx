import { Link } from 'react-router-dom'
import styles from './CategoryGrid.module.css'

export default function CategoryGrid({ categories = [] }) {
  if (!categories.length) return null

  return (
    <section className={`section-padding ${styles.section}`}>
      <div className="container">
        <div className={styles.header}>
          <h2 className={styles.title}>Explora nuestras categorías</h2>
          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerDiamond} aria-hidden="true">◆</span>
            <span className={styles.dividerLine} />
          </div>
        </div>

        <div className={styles.grid}>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/catalogo?categoria=${cat.slug}`}
              className={styles.card}
            >
              <div
                className={styles.imageWrap}
                style={{ backgroundColor: cat.accentColor ?? undefined }}
              >
                {cat.imageUrl ? (
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    className={styles.image}
                    style={{ objectFit: cat.imageObjectFit || 'cover' }}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div
                    className={styles.imagePlaceholder}
                    style={cat.accentColor ? { background: `linear-gradient(135deg, ${cat.accentColor}55, ${cat.accentColor}aa)` } : undefined}
                  >
                    <CategoryIcon name={cat.name} />
                  </div>
                )}
                <div className={styles.cardOverlay} />
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{cat.name}</h3>
                {cat.tagline && (
                  <p className={styles.cardTagline}>{cat.tagline}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function CategoryIcon({ name }) {
  const icons = {
    maquillaje: '💄', cosméticos: '💄',
    perfumes: '🌸',
    'body care': '🧴',
    swimwear: '👙', 'trajes de baño': '👙',
  }
  const key   = name?.toLowerCase() ?? ''
  const emoji = Object.entries(icons).find(([k]) => key.includes(k))?.[1] ?? '✨'
  return <span style={{ fontSize: '2rem', lineHeight: 1 }} aria-hidden="true">{emoji}</span>
}
