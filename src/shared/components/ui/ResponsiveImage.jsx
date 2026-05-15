import { useState } from 'react'
import styles from './ResponsiveImage.module.css'

/**
 * ratio: '1/1' | '4/3' | '3/4' | '16/9' | '3/5' | string — CSS aspect-ratio value
 * fit:   'cover' | 'contain'
 */
export default function ResponsiveImage({
  src,
  alt       = '',
  ratio     = '1/1',
  fit       = 'cover',
  className = '',
  placeholder = null,
  ...rest
}) {
  const [loaded, setLoaded] = useState(false)
  const [error,  setError]  = useState(false)

  const showFallback = error || !src

  return (
    <div
      className={`${styles.wrap} ${className}`}
      style={{ aspectRatio: ratio }}
    >
      {!loaded && !showFallback && (
        <div className={`skeleton ${styles.skeleton}`} aria-hidden="true" />
      )}

      {showFallback ? (
        <div className={styles.fallback} aria-hidden="true">
          {placeholder ?? <PlaceholderIcon />}
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={`${styles.img} ${styles[fit]} ${loaded ? styles.visible : styles.hidden}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          {...rest}
        />
      )}
    </div>
  )
}

function PlaceholderIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  )
}
