import styles from './EmptyState.module.css'

export default function EmptyState({
  icon,
  title     = 'Sin resultados',
  message   = '',
  action    = null,
  className = '',
}) {
  return (
    <div className={`${styles.wrap} ${className}`}>
      <div className={styles.iconWrap} aria-hidden="true">
        {icon ?? <DefaultIcon />}
      </div>
      <h3 className={styles.title}>{title}</h3>
      {message && <p className={styles.message}>{message}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}

function DefaultIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}
