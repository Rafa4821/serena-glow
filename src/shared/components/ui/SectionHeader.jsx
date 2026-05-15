import styles from './SectionHeader.module.css'

/**
 * align: 'left' | 'center' | 'right'
 */
export default function SectionHeader({
  label,
  title,
  subtitle,
  align   = 'center',
  as      = 'h2',
  className = '',
}) {
  const Tag = as
  return (
    <div className={`${styles.header} ${styles[align]} ${className}`}>
      {label    && <span className={`label-caps ${styles.label}`}>{label}</span>}
      <Tag className={styles.title}>{title}</Tag>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  )
}
