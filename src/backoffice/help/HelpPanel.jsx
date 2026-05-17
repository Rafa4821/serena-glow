import { useLocation } from 'react-router-dom'
import { HELP_CONTENT } from './helpContent'
import styles from './HelpPanel.module.css'

export default function HelpPanel({ onClose, onDisable }) {
  const { pathname } = useLocation()

  /* Match the most specific route key */
  const matchedKey = Object.keys(HELP_CONTENT)
    .filter(k => pathname === k || pathname.startsWith(k + '/'))
    .sort((a, b) => b.length - a.length)[0]

  const content = HELP_CONTENT[matchedKey] ?? {
    title: 'Ayuda',
    icon: '❓',
    intro: 'Navegá por el panel usando el menú lateral. Seleccioná un módulo para ver su guía específica.',
    items: [],
  }

  return (
    <>
      <div className={styles.overlay} onClick={onClose} aria-hidden="true" />
      <aside className={styles.panel} role="complementary" aria-label="Guía de ayuda">
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.headerIcon}>{content.icon}</span>
          <div className={styles.headerText}>
            <p className={styles.headerEyebrow}>Guía de ayuda</p>
            <h2 className={styles.headerTitle}>{content.title}</h2>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar panel">
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          <p className={styles.intro}>{content.intro}</p>

          {content.items.map((item, i) => (
            <div key={i} className={styles.item}>
              <h3 className={styles.itemHeading}>
                <span className={styles.itemDot} />
                {item.heading}
              </h3>
              <p className={styles.itemText}>{item.text}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <p className={styles.footerNote}>
            Navegá a otro módulo para ver su guía.
          </p>
          <button className={styles.disableBtn} onClick={onDisable}>
            Desactivar guía de ayuda
          </button>
        </div>
      </aside>
    </>
  )
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}
