import { slugify } from './slugify'

// ─── Slug ────────────────────────────────────────────────────────────────────
export { slugify }

/**
 * Generate a unique slug by appending a counter if the base slug already
 * exists in the provided set.
 */
export function uniqueSlug(text, existingSlugs = []) {
  const base = slugify(text)
  if (!existingSlugs.includes(base)) return base
  let i = 2
  while (existingSlugs.includes(`${base}-${i}`)) i++
  return `${base}-${i}`
}

// ─── Sorting ─────────────────────────────────────────────────────────────────

/** Sort an array of objects by a numeric `order` field (ascending). */
export function sortByOrder(items) {
  return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

/** Sort alphabetically by a given string field. */
export function sortByField(items, field = 'name') {
  return [...items].sort((a, b) =>
    String(a[field] ?? '').localeCompare(String(b[field] ?? ''), 'es', { sensitivity: 'base' }),
  )
}

/** Sort by price: 'asc' | 'desc'. Uses salePrice when available. */
export function sortByPrice(items, direction = 'asc') {
  return [...items].sort((a, b) => {
    const pa = a.salePrice ?? a.price ?? 0
    const pb = b.salePrice ?? b.price ?? 0
    return direction === 'asc' ? pa - pb : pb - pa
  })
}

/** Sort by createdAt timestamp (Firestore Timestamp or Date). */
export function sortByDate(items, direction = 'desc') {
  return [...items].sort((a, b) => {
    const ta = a.createdAt?.toMillis?.() ?? new Date(a.createdAt).getTime()
    const tb = b.createdAt?.toMillis?.() ?? new Date(b.createdAt).getTime()
    return direction === 'desc' ? tb - ta : ta - tb
  })
}

// ─── Filtering ───────────────────────────────────────────────────────────────

/** Keep only items where `active === true`. */
export function filterActive(items) {
  return items.filter(i => i.active === true)
}

/** Keep only items where `status === 'published'`. */
export function filterPublished(items) {
  return items.filter(i => i.status === 'published')
}

/** Keep items where `featured === true`. */
export function filterFeatured(items) {
  return items.filter(i => i.featured === true)
}

/** Filter by categorySlug. Returns all if slug is null/undefined. */
export function filterByCategory(items, categorySlug) {
  if (!categorySlug) return items
  return items.filter(i => i.categorySlug === categorySlug)
}

/**
 * Full-text search across name, shortDescription and tags.
 * Case-insensitive, accent-insensitive.
 */
export function searchProducts(items, term = '') {
  const t = slugify(term.trim())
  if (!t) return items
  return items.filter(p => {
    const haystack = [
      p.name,
      p.shortDescription,
      ...(p.tags ?? []),
    ].join(' ')
    return slugify(haystack).includes(t)
  })
}

// ─── Pagination ──────────────────────────────────────────────────────────────

/**
 * Slice a pre-fetched array for client-side pagination.
 * @returns {{ items, total, hasMore }}
 */
export function paginateArray(items, page = 1, pageSize = 24) {
  const start = 0
  const end   = page * pageSize
  return {
    items:   items.slice(start, end),
    total:   items.length,
    hasMore: end < items.length,
  }
}

// ─── Formatting ──────────────────────────────────────────────────────────────

/** Format a price number as Argentine peso string: $8.500 */
export function formatPrice(amount, currency = '$') {
  if (amount == null) return ''
  return `${currency} ${Number(amount).toLocaleString('es-AR')}`
}

/** Return the effective display price (salePrice if set, else price). */
export function effectivePrice(product) {
  return product.salePrice ?? product.price ?? 0
}

/** Calculate discount percentage between price and salePrice. */
export function discountPercent(product) {
  if (!product.salePrice || !product.price) return 0
  return Math.round(((product.price - product.salePrice) / product.price) * 100)
}

/** Format a Firestore Timestamp or Date as a readable Spanish string. */
export function formatDate(ts, opts = {}) {
  if (!ts) return ''
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  return date.toLocaleDateString('es-AR', {
    year: 'numeric', month: 'short', day: 'numeric',
    ...opts,
  })
}

/** Truncate a string to maxLen characters, appending '…'. */
export function truncate(str = '', maxLen = 80) {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen).trimEnd() + '…'
}

// ─── Validation ──────────────────────────────────────────────────────────────

/** @returns {{ valid: boolean, errors: string[] }} */
export function validateProduct(data) {
  const errors = []
  if (!data.name?.trim())         errors.push('El nombre es obligatorio.')
  if (!data.slug?.trim())         errors.push('El slug es obligatorio.')
  if (data.price == null || isNaN(Number(data.price)))
                                  errors.push('El precio debe ser un número.')
  if (Number(data.price) < 0)     errors.push('El precio no puede ser negativo.')
  if (data.salePrice != null && Number(data.salePrice) >= Number(data.price))
                                  errors.push('El precio oferta debe ser menor al precio base.')
  if (!data.categorySlug?.trim()) errors.push('La categoría es obligatoria.')
  if (!['published', 'draft', 'archived'].includes(data.status))
                                  errors.push('Estado inválido.')
  return { valid: errors.length === 0, errors }
}

/** @returns {{ valid: boolean, errors: string[] }} */
export function validateCategory(data) {
  const errors = []
  if (!data.name?.trim()) errors.push('El nombre es obligatorio.')
  if (!data.slug?.trim()) errors.push('El slug es obligatorio.')
  return { valid: errors.length === 0, errors }
}

/** @returns {{ valid: boolean, errors: string[] }} */
export function validateInquiry(data) {
  const errors = []
  if (!data.name?.trim())    errors.push('El nombre es obligatorio.')
  if (!data.message?.trim()) errors.push('El mensaje es obligatorio.')
  if (data.name?.length > 120)    errors.push('El nombre no puede superar 120 caracteres.')
  if (data.message?.length > 2000) errors.push('El mensaje no puede superar 2000 caracteres.')
  return { valid: errors.length === 0, errors }
}
