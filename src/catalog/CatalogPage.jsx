import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import PublicLayout from '@/shared/components/PublicLayout'
import ProductCard from './components/ProductCard'
import BannerBlock from '@/shared/components/BannerBlock/BannerBlock'
import { useCatalog } from './hooks/useCatalog'
import { useSiteSettings } from '@/app/providers/SiteSettingsProvider'
import { bannerService } from '@/firebase/services/bannerService'
import styles from './CatalogPage.module.css'

const SORT_OPTIONS = [
  { value: 'order',      label: 'Orden predeterminado' },
  { value: 'price-asc',  label: 'Precio: menor a mayor' },
  { value: 'price-desc', label: 'Precio: mayor a menor' },
  { value: 'name',       label: 'Nombre A–Z' },
]

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeCategory = searchParams.get('categoria') ?? ''
  const { settings } = useSiteSettings()

  const [catalogTopBanner, setCatalogTopBanner] = useState(null)
  useEffect(() => {
    bannerService.getById('catalog-top').then(b => setCatalogTopBanner(b)).catch(() => {})
  }, [])

  const [search, setSearch] = useState('')
  const [sort,   setSort]   = useState('order')

  const { products, total, categories, loading, hasMore, loadMore } = useCatalog({
    categorySlug: activeCategory || null,
    search,
    sort,
  })

  const waBase = `https://wa.me/${settings.whatsappNumber}?text=`

  function handleCategory(slug) {
    setSearch('')
    if (slug) setSearchParams({ categoria: slug })
    else      setSearchParams({})
  }

  return (
    <PublicLayout>
      {catalogTopBanner && catalogTopBanner.active !== false && (
        <BannerBlock banner={catalogTopBanner} />
      )}
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <div className="container">
            <span className="label-caps">Tienda</span>
            <h1 className={styles.pageTitle}>Catálogo</h1>
          </div>
        </div>

        <div className="container">
          {/* Category filter */}
          {categories.length > 0 && (
            <div className={styles.filters}>
              <button
                className={`${styles.filterBtn} ${!activeCategory ? styles.filterActive : ''}`}
                onClick={() => handleCategory('')}
              >
                Todos
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`${styles.filterBtn} ${activeCategory === cat.slug ? styles.filterActive : ''}`}
                  onClick={() => handleCategory(cat.slug)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Search + sort toolbar */}
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <SearchIcon />
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar productos…"
                className={styles.searchInput}
                aria-label="Buscar"
              />
              {search && (
                <button className={styles.clearBtn} onClick={() => setSearch('')} aria-label="Limpiar">
                  ✕
                </button>
              )}
            </div>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className={styles.sortSelect}
              aria-label="Ordenar por"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Count */}
          {!loading && (
            <p className={styles.count}>
              {total} producto{total !== 1 ? 's' : ''}
              {search ? ` para "${search}"` : ''}
            </p>
          )}

          {/* Grid */}
          {loading ? (
            <div className={styles.skeletonGrid}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={`skeleton ${styles.skeletonCard}`} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className={styles.empty}>
              <p>{search ? `Sin resultados para "${search}"` : 'No hay productos en esta categoría todavía.'}</p>
            </div>
          ) : (
            <>
              <div className={styles.grid}>
                {products.map(p => (
                  <ProductCard key={p.id} product={p} waBase={waBase} />
                ))}
              </div>
              {hasMore && (
                <div className={styles.loadMore}>
                  <button className={styles.loadMoreBtn} onClick={loadMore}>
                    Cargar más productos
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PublicLayout>
  )
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}
