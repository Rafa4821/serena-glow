import { Link } from 'react-router-dom'
import PublicLayout from '@/shared/components/PublicLayout'
import styles from './NotFoundPage.module.css'

export default function NotFoundPage() {
  return (
    <PublicLayout>
      <div className={styles.page}>
        <div className={styles.inner}>
          <span className={styles.code}>404</span>
          <h1 className={styles.title}>Página no encontrada</h1>
          <p className={styles.text}>
            La página que buscás no existe o fue movida.<br />
            Explorá nuestra colección y encontrá algo que te encante.
          </p>
          <div className={styles.actions}>
            <Link to="/" className={styles.btnPrimary}>Volver al inicio</Link>
            <Link to="/catalogo" className={styles.btnSecondary}>Ver catálogo</Link>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
