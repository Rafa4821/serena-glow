import styles from './Button.module.css'

/**
 * variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'whatsapp'
 * size:    'sm' | 'md' | 'lg'
 */
export default function Button({
  children,
  variant  = 'primary',
  size     = 'md',
  as       = 'button',
  href,
  type     = 'button',
  disabled = false,
  loading  = false,
  fullWidth = false,
  className = '',
  onClick,
  ...rest
}) {
  const cls = [
    styles.btn,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    loading   ? styles.loading   : '',
    className,
  ].filter(Boolean).join(' ')

  if (as === 'a' || href) {
    return (
      <a href={href} className={cls} {...rest}>
        {loading ? <span className={styles.spinner} aria-hidden="true" /> : children}
      </a>
    )
  }

  return (
    <button type={type} className={cls} disabled={disabled || loading} onClick={onClick} {...rest}>
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : children}
    </button>
  )
}
