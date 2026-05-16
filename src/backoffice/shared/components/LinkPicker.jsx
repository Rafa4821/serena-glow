import { useState, useEffect } from 'react'
import { categoryService } from '@/firebase/services/categoryService'

const STATIC_LINKS = [
  { group: 'Páginas', label: 'Inicio',     value: '/'         },
  { group: 'Páginas', label: 'Catálogo',   value: '/catalogo' },
  { group: 'Páginas', label: 'Nosotras',   value: '/nosotras' },
  { group: 'Páginas', label: 'Novedades',  value: '/novedades'},
  { group: 'Páginas', label: 'Contacto',   value: '/contacto' },
]

export default function LinkPicker({ value, onChange, className, placeholder = '— Seleccionar vínculo —' }) {
  const [categories, setCategories] = useState([])

  useEffect(() => {
    categoryService.getActive().then(cats => setCategories(cats)).catch(() => {})
  }, [])

  const isKnown =
    STATIC_LINKS.some(l => l.value === value) ||
    categories.some(c => `/catalogo?category=${c.slug}` === value)
  const isExternal = value?.startsWith('http')

  return (
    <select
      value={isKnown || !value ? (value ?? '') : '__custom__'}
      onChange={e => {
        if (e.target.value !== '__custom__') onChange(e.target.value)
      }}
      className={className}
    >
      <option value="">{placeholder}</option>

      <optgroup label="── Páginas ──">
        {STATIC_LINKS.map(l => (
          <option key={l.value} value={l.value}>{l.label}</option>
        ))}
      </optgroup>

      {categories.length > 0 && (
        <optgroup label="── Categorías ──">
          {categories.map(c => (
            <option key={c.id} value={`/catalogo?category=${c.slug}`}>
              {c.name}
            </option>
          ))}
        </optgroup>
      )}

      {!isKnown && value && (
        <option value="__custom__" disabled>
          Personalizado: {value}
        </option>
      )}
    </select>
  )
}
