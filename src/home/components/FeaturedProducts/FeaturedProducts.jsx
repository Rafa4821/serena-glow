import { Link } from 'react-router-dom'
import { useSiteSettings } from '@/app/providers/SiteSettingsProvider'
import ProductCard from '@/catalog/components/ProductCard'
import styles from './FeaturedProducts.module.css'

export default function FeaturedProducts({ products = [] }) {
  const { settings } = useSiteSettings()

  if (!products.length) return null

  const waBase = `https://wa.me/${settings.whatsappNumber}?text=`

  return (
    <section className={`section-padding ${styles.section}`}>
      <div className="container">
        <div className={styles.header}>
          <h2 className={styles.title}>Productos destacados</h2>
          <p className={styles.subtitle}>Nuestros favoritos elegidos para ti</p>
        </div>

        <div className={styles.grid}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} waBase={waBase} />
          ))}
        </div>

        <div className={styles.cta}>
          <Link to="/catalogo" className={styles.ctaLink}>
            Ver todos los productos
          </Link>
        </div>
      </div>
    </section>
  )
}
