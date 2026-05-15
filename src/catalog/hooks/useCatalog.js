import { useState, useEffect, useCallback, useMemo } from 'react'
import { productService } from '@/firebase/services/productService'
import { categoryService } from '@/firebase/services/categoryService'

const PAGE_SIZE = 24

export function useCatalog({ categorySlug = null, search = '', sort = 'order' } = {}) {
  const [allProducts, setAllProducts] = useState([])
  const [categories,  setCategories]  = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [page,        setPage]        = useState(1)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [cats, prods] = await Promise.all([
        categoryService.getActive(),
        productService.getPublished({ categorySlug, pageSize: 200 }),
      ])
      setCategories(cats)
      setAllProducts(prods.items)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [categorySlug])

  useEffect(() => { setPage(1); fetchData() }, [fetchData])

  const filtered = useMemo(() => {
    let result = [...allProducts]

    if (search.trim()) {
      const term = search.trim().toLowerCase()
      result = result.filter(p =>
        p.name?.toLowerCase().includes(term) ||
        p.shortDescription?.toLowerCase().includes(term) ||
        p.tags?.some(t => t.toLowerCase().includes(term))
      )
    }

    if (sort === 'price-asc')  result.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
    if (sort === 'price-desc') result.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
    if (sort === 'name')       result.sort((a, b) => a.name?.localeCompare(b.name))
    if (sort === 'order')      result.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

    return result
  }, [allProducts, search, sort])

  const paginated = useMemo(() => filtered.slice(0, page * PAGE_SIZE), [filtered, page])
  const hasMore   = paginated.length < filtered.length
  const loadMore  = useCallback(() => setPage(p => p + 1), [])

  return {
    products: paginated,
    total: filtered.length,
    categories,
    loading,
    error,
    hasMore,
    loadMore,
    refetch: fetchData,
  }
}

export function useProduct(slug) {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!slug) return
    let cancelled = false

    productService.getBySlug(slug)
      .then(p => { if (!cancelled) { setProduct(p); setLoading(false) } })
      .catch(err => { if (!cancelled) { setError(err); setLoading(false) } })

    return () => { cancelled = true }
  }, [slug])

  return { product, loading, error }
}
