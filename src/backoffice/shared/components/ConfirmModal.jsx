import styles from './ConfirmModal.module.css'

/**
 * ConfirmModal — generic danger-confirmation dialog.
 *
 * Props:
 *  title       string  — dialog heading
 *  message     string  — optional body text
 *  confirmLabel string — defaults to "Confirmar"
 *  cancelLabel  string — defaults to "Cancelar"
 *  danger      bool    — red confirm button (default true)
 *  onConfirm   fn
 *  onCancel    fn
 */
export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel  = 'Cancelar',
  danger       = true,
  onConfirm,
  onCancel,
}) {
  return (
    <div className={styles.overlay} onClick={onCancel} role="dialog" aria-modal="true">
      <div className={styles.dialog} onClick={e => e.stopPropagation()}>
        <div className={`${styles.iconWrap} ${danger ? styles.dangerIcon : styles.infoIcon}`} aria-hidden="true">
          {danger ? <WarnIcon /> : <InfoIcon />}
        </div>

        <h3 className={styles.title}>{title}</h3>
        {message && <p className={styles.message}>{message}</p>}

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`${styles.confirm} ${danger ? styles.confirmDanger : styles.confirmInfo}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function WarnIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  )
}
