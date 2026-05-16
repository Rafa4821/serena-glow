import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import styles from './BannerBlock.module.css'

function TitleWithEmphasis({ text }) {
  if (!text) return null
  const lines = text.split('\n')
  return lines.map((line, li) => {
    const words = line.trim().split(' ')
    const last  = words.pop()
    return (
      <span key={li}>
        {words.join(' ')}{words.length > 0 ? ' ' : ''}
        <em className={styles.emphasis}>{last}</em>
        {li < lines.length - 1 && <br />}
      </span>
    )
  })
}

function BannerBtn({ btn }) {
  const cls = {
    primary:   styles.btnPrimary,
    secondary: styles.btnSecondary,
    outline:   styles.btnOutline,
  }[btn.style] ?? styles.btnPrimary

  if (btn.link?.startsWith('http')) {
    return (
      <a href={btn.link} target="_blank" rel="noopener noreferrer" className={cls}>
        {btn.text}
      </a>
    )
  }
  return <Link to={btn.link || '#'} className={cls}>{btn.text}</Link>
}

function parseVideoUrl(url) {
  if (!url) return null
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/)
  if (yt) return { type: 'youtube', id: yt[1] }
  return { type: 'direct', url }
}

function alignClass(contentAlign) {
  return { left: styles.alignLeft, center: styles.alignCenter, right: styles.alignRight }[contentAlign] ?? styles.alignLeft
}

export default function BannerBlock({
  banner,
  isHero         = false,
  defaultLabel   = '',
  defaultButtons = [],
  waHref         = null,
  showScrollHint = false,
}) {
  if (!banner && !defaultLabel && defaultButtons.length === 0) return null

  const type = banner?.type ?? 'image'

  if (type === 'carousel' && banner?.slides?.length > 0) {
    return (
      <CarouselBanner
        banner={banner}
        isHero={isHero}
        waHref={waHref}
        showScrollHint={showScrollHint}
      />
    )
  }

  if (type === 'video') {
    return (
      <VideoBanner
        banner={banner}
        isHero={isHero}
        defaultLabel={defaultLabel}
        defaultButtons={defaultButtons}
        waHref={waHref}
        showScrollHint={showScrollHint}
      />
    )
  }

  const label          = banner?.label          || defaultLabel || ''
  const title          = banner?.title          || ''
  const subtitle       = banner?.subtitle       || ''
  const imageUrl       = banner?.imageUrl       || null
  const buttons        = banner?.buttons?.length > 0 ? banner.buttons : defaultButtons
  const contentAlign   = banner?.contentAlign   || 'left'
  const textColor      = banner?.textColor      || 'light'
  const overlayOpacity = banner?.overlayOpacity ?? 0.3
  const minHeight      = isHero
    ? 'calc(100vh - var(--header-total, 80px))'
    : (banner?.minHeight || '60vh')

  const sectionStyle = {
    '--b-bg':      imageUrl ? `url(${imageUrl})` : 'none',
    '--b-overlay': overlayOpacity,
    '--b-height':  minHeight,
  }

  const alignClass = {
    left:   styles.alignLeft,
    center: styles.alignCenter,
    right:  styles.alignRight,
  }[contentAlign] ?? styles.alignLeft

  return (
    <section
      className={[
        styles.banner,
        alignClass,
        textColor === 'dark' ? styles.textDark : styles.textLight,
        isHero ? styles.isHero : '',
      ].filter(Boolean).join(' ')}
      style={sectionStyle}
    >
      <div className={styles.overlay} />

      <div className={`container ${styles.inner}`}>
        <div className={styles.content}>
          {label    && <span className={`label-caps ${styles.label}`}>{label}</span>}
          {title    && <h2 className={styles.title}><TitleWithEmphasis text={title} /></h2>}
          {subtitle && <p  className={styles.subtitle}>{subtitle}</p>}

          {buttons.length > 0 && (
            <div className={styles.actions}>
              {buttons.map((btn, i) => <BannerBtn key={i} btn={btn} />)}
            </div>
          )}

          {waHref && (
            <a href={waHref} target="_blank" rel="noopener noreferrer" className={styles.waPill}>
              <WaIcon /> Consultar por WhatsApp
            </a>
          )}
        </div>
      </div>

      {showScrollHint && (
        <div className={styles.scrollHint}>
          <span className={styles.scrollLine} />
        </div>
      )}
    </section>
  )
}

/* ── Carousel Banner ───────────────────────────────────── */
function CarouselBanner({ banner, isHero, waHref, showScrollHint }) {
  const slides          = banner.slides ?? []
  const overlayOpacity  = banner.overlayOpacity ?? 0.3
  const textColor       = banner.textColor ?? 'light'
  const minHeight       = isHero
    ? 'calc(100vh - var(--header-total, 80px))'
    : (banner.minHeight || '70vh')
  const showArrows      = banner.showArrows !== false
  const showDots        = banner.showDots   !== false

  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!banner.autoplay || slides.length <= 1) return
    const ms = (banner.autoplayInterval ?? 5) * 1000
    const timer = setInterval(() => setCurrent(c => (c + 1) % slides.length), ms)
    return () => clearInterval(timer)
  }, [banner.autoplay, banner.autoplayInterval, slides.length])

  function prev() { setCurrent(c => (c - 1 + slides.length) % slides.length) }
  function next() { setCurrent(c => (c + 1) % slides.length) }

  const isDark = textColor === 'dark'

  return (
    <div
      className={[styles.carousel, isHero ? styles.isHero : ''].filter(Boolean).join(' ')}
      style={{ '--c-height': minHeight, '--b-overlay': overlayOpacity }}
    >
      <div className={styles.slideTrack} style={{ transform: `translateX(${-100 * current}%)` }}>
        {slides.map((slide, i) => {
          const btns = slide.buttons ?? []
          return (
            <div
              key={i}
              className={[styles.slide, isDark ? styles.textDark : styles.textLight].join(' ')}
              style={{ '--b-bg': slide.imageUrl ? `url(${slide.imageUrl})` : 'none' }}
            >
              <div className={styles.overlay} />
              <div className={`container ${styles.inner}`}>
                <div className={styles.content}>
                  {slide.label    && <span className={`label-caps ${styles.label}`}>{slide.label}</span>}
                  {slide.title    && <h2 className={`${styles.title} ${isHero ? styles.heroTitle : ''}`}><TitleWithEmphasis text={slide.title} /></h2>}
                  {slide.subtitle && <p className={styles.subtitle}>{slide.subtitle}</p>}
                  {btns.length > 0 && (
                    <div className={styles.actions}>
                      {btns.map((btn, j) => <BannerBtn key={j} btn={btn} />)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {showArrows && slides.length > 1 && (
        <>
          <button onClick={prev} className={`${styles.arrow} ${styles.arrowPrev}`} aria-label="Anterior">&#8249;</button>
          <button onClick={next} className={`${styles.arrow} ${styles.arrowNext}`} aria-label="Siguiente">&#8250;</button>
        </>
      )}

      {showDots && slides.length > 1 && (
        <div className={styles.dots}>
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {waHref && (
        <a href={waHref} target="_blank" rel="noopener noreferrer" className={`${styles.waPill} ${styles.waPillFixed}`}>
          <WaIcon /> Consultar por WhatsApp
        </a>
      )}

      {showScrollHint && (
        <div className={styles.scrollHint}><span className={styles.scrollLine} /></div>
      )}
    </div>
  )
}

/* ── Video Banner ───────────────────────────────────────── */
function VideoBanner({ banner, isHero, defaultLabel, defaultButtons, waHref, showScrollHint }) {
  const parsed         = parseVideoUrl(banner.videoUrl)
  const label          = banner.label          || defaultLabel || ''
  const buttons        = banner.buttons?.length > 0 ? banner.buttons : (defaultButtons ?? [])
  const textColor      = banner.textColor      ?? 'light'
  const overlayOpacity = banner.overlayOpacity ?? 0.3
  const contentAlign   = banner.contentAlign   ?? 'left'
  const minHeight      = isHero
    ? 'calc(100vh - var(--header-total, 80px))'
    : (banner.minHeight || '70vh')

  return (
    <section
      className={[
        styles.banner,
        alignClass(contentAlign),
        textColor === 'dark' ? styles.textDark : styles.textLight,
        isHero ? styles.isHero : '',
      ].filter(Boolean).join(' ')}
      style={{
        '--b-bg':      banner.imageUrl ? `url(${banner.imageUrl})` : 'none',
        '--b-overlay': overlayOpacity,
        '--b-height':  minHeight,
      }}
    >
      {parsed && (
        <div className={styles.videoWrap}>
          {parsed.type === 'youtube' ? (
            <iframe
              className={styles.videoFrame}
              src={`https://www.youtube.com/embed/${parsed.id}?autoplay=1&mute=1&loop=1&playlist=${parsed.id}&controls=0&rel=0&modestbranding=1`}
              allow="autoplay; encrypted-media"
              title="Banner video"
            />
          ) : (
            <video className={styles.videoDirect} src={parsed.url} autoPlay muted loop playsInline />
          )}
        </div>
      )}

      <div className={styles.overlay} />

      <div className={`container ${styles.inner}`}>
        <div className={styles.content}>
          {label           && <span className={`label-caps ${styles.label}`}>{label}</span>}
          {banner.title    && <h2 className={styles.title}><TitleWithEmphasis text={banner.title} /></h2>}
          {banner.subtitle && <p  className={styles.subtitle}>{banner.subtitle}</p>}
          {buttons.length > 0 && (
            <div className={styles.actions}>
              {buttons.map((btn, i) => <BannerBtn key={i} btn={btn} />)}
            </div>
          )}
          {waHref && (
            <a href={waHref} target="_blank" rel="noopener noreferrer" className={styles.waPill}>
              <WaIcon /> Consultar por WhatsApp
            </a>
          )}
        </div>
      </div>

      {showScrollHint && (
        <div className={styles.scrollHint}><span className={styles.scrollLine} /></div>
      )}
    </section>
  )
}

function WaIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
  )
}
