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

  useEffect(() => { setMenuOpen(false) }, [location])

  return (
    <header className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className={`container ${styles.inner}`}>
        {/* Logo */}
        <Link to="/" className={styles.brand}>
          {settings.logoUrl
            ? <img src={settings.logoUrl} alt={settings.siteName} className={styles.logoImg} loading="eager" fetchpriority="high" />
            : <span className={styles.brandText}>{settings.siteName}</span>
          }
        </Link>

        {/* Desktop nav */}
        <nav className={styles.navDesktop}>
          <NavLink to="/"           className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}>Inicio</NavLink>
          <NavLink to="/catalogo"   className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}>Catálogo</NavLink>
          <NavLink to="/nosotras"   className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}>Nosotras</NavLink>
          <NavLink to="/novedades"  className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}>Novedades</NavLink>
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
