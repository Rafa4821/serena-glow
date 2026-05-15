import styles from './EmotionalBanner.module.css'

const VALUES = [
  { icon: <DiamondIcon />, label: 'Calidad'         },
  { icon: <HeartIcon />,   label: 'Confianza'       },
  { icon: <FlowerIcon />,  label: 'Femineidad'      },
  { icon: <StarIcon />,    label: 'Empoderamiento'  },
]

export default function EmotionalBanner({ banner }) {
  const rawTitle = banner?.title ?? 'Más que productos, creamos experiencias que resaltan tu mejor versión.'
  const imageUrl = banner?.imageUrl ?? null

  // Split last 2 words as cursive emphasis
  const words     = rawTitle.trim().split(' ')
  const cut       = Math.max(words.length - 3, Math.ceil(words.length * 0.55))
  const mainPart  = words.slice(0, cut).join(' ')
  const emphasis  = words.slice(cut).join(' ')

  return (
    <section
      className={styles.banner}
      style={imageUrl ? { '--banner-bg': `url(${imageUrl})` } : {}}
    >
      {imageUrl && <div className={styles.overlay} />}
      <div className={`container ${styles.content}`}>
        <h2 className={styles.title}>
          {mainPart}{' '}
          <em className={styles.titleEmphasis}>{emphasis}</em>
        </h2>

        <div className={styles.values}>
          {VALUES.map(({ icon, label }) => (
            <div key={label} className={styles.value}>
              <span className={styles.valueIcon} aria-hidden="true">{icon}</span>
              <span className={styles.valueLabel}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function DiamondIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 22 12 12 22 2 12"/>
    </svg>
  )
}
function HeartIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  )
}
function FlowerIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2a4 4 0 0 1 0 8 4 4 0 0 1 0-8zm0 12a4 4 0 0 1 0 8 4 4 0 0 1 0-8zM2 12a4 4 0 0 1 8 0 4 4 0 0 1-8 0zm12 0a4 4 0 0 1 8 0 4 4 0 0 1-8 0z"/>
    </svg>
  )
}
function StarIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
}
