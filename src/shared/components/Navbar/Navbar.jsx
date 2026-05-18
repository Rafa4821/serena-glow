import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useSiteSettings } from '@/app/providers/SiteSettingsProvider'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { settings } = useSiteSettings()
  const [scrolled,   setScrolled]   = useState(false)
  const [menuOpen,   setMenuOpen]   = useState(false)
  const location = useLocation()
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const logoH = settings.logoUrl ? (Number(settings.logoWidth) || 40) : 0
    const navH  = Math.max(72, logoH + 20)
    document.documentElement.style.setProperty('--navbar-height', `${navH}px`)
  }, [settings.logoUrl, settings.logoWidth])

  useEffect(() => { setMenuOpen(false) }, [location])

  return (
    <header className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`container ${styles.inner}`}>
        {/* Logo */}
        <Link to="/" className={styles.brand}>
          {(settings.logoUrl || settings.logoText) ? (
            <div
              className={styles.logoWrap}
              style={{
                flexDirection: (settings.logoLayout ?? 'row') === 'column' ? 'column' : 'row',
                gap: (settings.logoUrl && settings.logoText)
                  ? ((settings.logoLayout ?? 'row') === 'column' ? '4px' : '10px')
                  : 0,
              }}
            >
              {settings.logoUrl && (
                <img
                  src={settings.logoUrl}
                  alt={settings.siteName}
                  className={styles.logoImg}
                  style={{
                    height: settings.logoWidth ? `${settings.logoWidth}px` : '40px',
                    order: (settings.logoTextPosition ?? 'right') === 'left' ? 2 : 1,
                  }}
                  loading="eager"
                  fetchpriority="high"
                />
              )}
              {settings.logoText && (
                <span
                  className={styles.logoText}
                  style={{
                    order:         (settings.logoTextPosition ?? 'right') === 'left' ? 1 : 2,
                    fontFamily:    (settings.logoTextFont ?? 'serif') === 'sans' ? 'var(--font-sans)' : 'var(--font-serif)',
                    fontSize:      `${settings.logoTextSize ?? 20}px`,
                    fontWeight:    settings.logoTextWeight ?? 400,
                    fontStyle:     settings.logoTextStyle  ?? 'normal',
                    color:         settings.logoTextColor  || 'var(--color-text-main)',
                    letterSpacing: settings.logoTextLetterSpacing ? `${settings.logoTextLetterSpacing}em` : undefined,
                  }}
                >
                  {settings.logoText}
                </span>
              )}
            </div>
          ) : (
            <span className={styles.brandText}>{settings.siteName}</span>
          )}
        </Link>

        {/* Desktop nav */}
        <nav className={styles.navDesktop}>
          <NavLink to="/"           className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}>Inicio</NavLink>
          <NavLink to="/catalogo"   className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}>Catálogo</NavLink>
          <NavLink to="/nosotras"   className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}>Nosotras</NavLink>
          <NavLink to="/novedades"  className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}>Novedades</NavLink>
          <NavLink to="/blog"       className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}>Blog</NavLink>
          <NavLink to="/contacto"   className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}>Contacto</NavLink>
        </nav>

        {/* CTA WhatsApp */}
        <a
          href={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(settings.whatsappMessage)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.ctaBtn}
        >
          Consulta por WhatsApp
        </a>

        {/* Hamburger */}
        <button
          className={`${styles.hamburger} ${menuOpen ? styles.open : ''}`}
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Menú"
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`${styles.mobileMenu} ${menuOpen ? styles.visible : ''}`}>
        <NavLink to="/"          className={styles.mobileLink}>Inicio</NavLink>
        <NavLink to="/catalogo"  className={styles.mobileLink}>Catálogo</NavLink>
        <NavLink to="/nosotras"  className={styles.mobileLink}>Nosotras</NavLink>
        <NavLink to="/novedades" className={styles.mobileLink}>Novedades</NavLink>
        <NavLink to="/blog"      className={styles.mobileLink}>Blog</NavLink>
        <NavLink to="/contacto"  className={styles.mobileLink}>Contacto</NavLink>
        <a
          href={`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(settings.whatsappMessage)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${styles.mobileLink} ${styles.mobileCta}`}
        >
          WhatsApp
        </a>
      </div>
    </header>
  )
}
