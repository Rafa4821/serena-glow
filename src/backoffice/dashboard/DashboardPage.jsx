import { useState, useEffect } from 'react'
import { collection, getCountFromServer, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from '@/firebase/firestore'
import { Link } from 'react-router-dom'
import { INQUIRY_STATUS } from '@/firebase/services/inquiryService'
import styles from './DashboardPage.module.css'

export default function DashboardPage() {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCounts() {
      try {
        const [published, cats, pending, bannersActive, gallery, mediaSnap] = await Promise.all([
          getCountFromServer(query(collection(db, 'products'),  where('status', '==', 'published'))),
          getCountFromServer(collection(db, 'categories')),
          getCountFromServer(query(collection(db, 'messages'),  where('status', '==', INQUIRY_STATUS.PENDING))),
          getCountFromServer(query(collection(db, 'banners'),   where('active', '==', true))),
          getCountFromServer(collection(db, 'gallery')),
          getDocs(query(collection(db, 'media'), orderBy('createdAt', 'desc'))),
        ])
        const orphans = mediaSnap.docs.filter(d => !(d.data().usedBy?.length > 0)).length
        setStats({
          products:      published.data().count,
          categories:    cats.data().count,
          pending:       pending.data().count,
          bannersActive: bannersActive.data().count,
          gallery:       gallery.data().count,
          orphans,
        })
      } catch {
        setStats({ products: 0, categories: 0, pending: 0, bannersActive: 0, gallery: 0, orphans: 0 })
      } finally {
        setLoading(false)
      }
    }
    fetchCounts()
  }, [])

  const cards = stats ? [
    { label: 'Productos publicados',  value: stats.products,      to: '/admin/productos',     color: 'mauve' },
    { label: 'Categorías',            value: stats.categories,    to: '/admin/categorias',    color: 'rose'  },
    { label: 'Consultas pendientes',  value: stats.pending,       to: '/admin/mensajes',      color: stats.pending > 0 ? 'alert' : 'beige' },
    { label: 'Banners activos',       value: stats.bannersActive, to: '/admin/banners',       color: 'beige' },
    { label: 'Imágenes galería',      value: stats.gallery,       to: '/admin/galeria',       color: 'rose'  },
    { label: 'Imágenes sin uso',      value: stats.orphans,       to: '/admin/media',         color: stats.orphans > 0 ? 'warn' : 'beige' },
  ] : []

  const shortcuts = [
    { label: 'Nuevo producto',       to: '/admin/productos' },
    { label: 'Nueva categoría',      to: '/admin/categorias' },
    { label: 'Editar banners',       to: '/admin/banners' },
    { label: 'Biblioteca de medios', to: '/admin/media' },
    { label: 'Configuración sitio',  to: '/admin/configuracion' },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.sub}>Bienvenida al backoffice de Serena Glow.</p>
      </div>

      <div className={styles.statsGrid}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className={`skeleton ${styles.statCardSkeleton}`} />)
          : cards.map(card => (
              <Link key={card.label} to={card.to} className={`${styles.statCard} ${styles[card.color]}`}>
                <span className={styles.statValue}>{card.value}</span>
                <span className={styles.statLabel}>{card.label}</span>
              </Link>
            ))
        }
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Accesos rápidos</h2>
        <div className={styles.shortcuts}>
          {shortcuts.map(s => (
            <Link key={s.label} to={s.to} className={styles.shortcut}>
              {s.label} →
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
