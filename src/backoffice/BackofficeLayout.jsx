import { useState, useEffect } from 'react'
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import HelpPanel from './help/HelpPanel'
import { HelpProvider } from './help/HelpContext'
import styles from './BackofficeLayout.module.css'

const NAV = [
  { to: '/admin',              label: 'Dashboard',      icon: GridIcon,       end: true },
  { to: '/admin/productos',    label: 'Productos',      icon: BoxIcon },
  { to: '/admin/categorias',   label: 'Categorías',     icon: TagIcon },
  { to: '/admin/banners',      label: 'Banners',        icon: ImageIcon },
  { to: '/admin/media',        label: 'Medios',         icon: MediaIcon },
  { to: '/admin/mensajes',     label: 'Mensajes',       icon: MessageIcon },
  { to: '/admin/blog',         label: 'Blog',           icon: BlogIcon },
  { to: '/admin/configuracion',label: 'Configuración',  icon: SettingsIcon },
]

export default function BackofficeLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [collapsed,    setCollapsed]    = useState(false)
  const [mobileOpen,   setMobileOpen]   = useState(false)
  const [helpOpen,     setHelpOpen]     = useState(false)
  const [helpEnabled,  setHelpEnabled]  = useState(
    () => localStorage.getItem('sg_admin_help') !== 'false'
  )

  useEffect(() => {
    const handler = () => setHelpEnabled(localStorage.getItem('sg_admin_help') !== 'false')
    window.addEventListener('sg_help_change', handler)
    return () => window.removeEventListener('sg_help_change', handler)
  }, [])

  function handleDisableHelp() {
    localStorage.setItem('sg_admin_help', 'false')
    setHelpEnabled(false)
    setHelpOpen(false)
    window.dispatchEvent(new Event('sg_help_change'))
  }

  async function handleSignOut() {
    await signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <HelpProvider>
    <div className={`${styles.shell} ${collapsed ? styles.collapsed : ''}`}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarTop}>
          <Link to="/admin" className={styles.brand}>
            {collapsed ? 'SG' : 'Serena Glow'}
          </Link>
          <button className={styles.collapseBtn} onClick={() => setCollapsed(v => !v)} aria-label="Colapsar menú">
            <ChevronIcon />
          </button>
        </div>

        <nav className={styles.nav}>
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navActive : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={styles.navIcon} />
              {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <Link to="/" target="_blank" className={styles.viewSite} title="Ver sitio">
            <ExternalIcon className={styles.navIcon} />
            {!collapsed && <span className={styles.navLabel}>Ver sitio</span>}
          </Link>
          <button onClick={handleSignOut} className={styles.signOut} title="Cerrar sesión">
            <LogoutIcon className={styles.navIcon} />
            {!collapsed && <span className={styles.navLabel}>Salir</span>}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className={styles.mobileOverlay} onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div className={styles.main}>
        {/* Top bar */}
        <header className={styles.topBar}>
          <button className={styles.mobileMenuBtn} onClick={() => setMobileOpen(v => !v)} aria-label="Menú">
            <HamburgerIcon />
          </button>
          <div className={styles.topBarRight}>
            {helpEnabled && (
              <button
                className={`${styles.helpBtn} ${helpOpen ? styles.helpBtnActive : ''}`}
                onClick={() => setHelpOpen(v => !v)}
                aria-label="Guía de ayuda"
                title="Guía de ayuda"
              >
                ?
              </button>
            )}
            <span className={styles.userEmail}>{user?.email}</span>
          </div>
        </header>

        {/* Content */}
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>

      {/* Help panel */}
      {helpOpen && (
        <HelpPanel
          onClose={() => setHelpOpen(false)}
          onDisable={handleDisableHelp}
        />
      )}
    </div>
    </HelpProvider>
  )
}

function GridIcon({ className })     { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> }
function BoxIcon({ className })      { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> }
function TagIcon({ className })      { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg> }
function ImageIcon({ className })    { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> }
function GalleryIcon({ className })  { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="5" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="3" y="12" width="7" height="9" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/></svg> }
function MessageIcon({ className })  { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> }
function SettingsIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> }
function ExternalIcon({ className }) { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg> }
function LogoutIcon({ className })   { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> }
function MediaIcon({ className })    { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> }
function BlogIcon({ className })     { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> }
function ChevronIcon({ className })  { return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg> }
function HamburgerIcon()             { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg> }
