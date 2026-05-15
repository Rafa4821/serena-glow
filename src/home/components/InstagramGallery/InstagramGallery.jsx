import styles from './InstagramGallery.module.css'
import { useSiteSettings } from '@/app/providers/SiteSettingsProvider'

const MOCK_PLACEHOLDERS = Array.from({ length: 5 }, (_, i) => ({
  id: `mock-${i}`,
  imageUrl: null,
  caption: null,
}))

export default function InstagramGallery({ images = [] }) {
  const { settings } = useSiteSettings()
  const igUrl = settings.instagram ?? settings.instagramUrl ?? null

  const items = images.length >= 3 ? images.slice(0, 5) : MOCK_PLACEHOLDERS

  return (
    <section className={`section-padding-sm ${styles.section}`}>
      <div className="container">
        <div className={styles.header}>
          <h2 className={styles.title}>Síguenos en Instagram</h2>
          <p className={styles.subtitle}>Inspiración, tips y novedades todos los días.</p>
        </div>

        <div className={styles.grid}>
          {items.map((img) => (
            <a
              key={img.id}
              href={img.link ?? igUrl ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.cell}
              aria-label="Ver en Instagram"
            >
              {img.imageUrl ? (
                <img
                  src={img.imageUrl}
                  alt={img.caption ?? 'Serena Glow Instagram'}
                  className={styles.img}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className={styles.placeholder} />
              )}
              {img.caption && (
                <div className={styles.hoverOverlay}>
                  <p className={styles.caption}>{img.caption}</p>
                </div>
              )}
            </a>
          ))}
        </div>

        {igUrl && (
          <div className={styles.ctaWrap}>
            <a
              href={igUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.igBtn}
            >
              <IgIcon />
              Ir a Instagram
            </a>
          </div>
        )}
      </div>
    </section>
  )
}

function IgIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  )
}
