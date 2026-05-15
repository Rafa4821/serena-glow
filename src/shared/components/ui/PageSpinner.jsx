import styles from './PageSpinner.module.css'

export default function PageSpinner() {
  return (
    <div className={styles.wrap} aria-label="Cargando…" role="status">
      <span className={styles.ring} />
    </div>
  )
}
