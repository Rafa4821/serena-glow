import { useState } from 'react'
import * as XLSX from 'xlsx'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase/firestore'
import { slugify } from '@/shared/utils/slugify'
import { showToast } from '@/shared/components/ui/Toast'
import adminStyles from '../admin.module.css'
import styles from './BulkImportModal.module.css'

const COLUMNS = [
  { key: 'name',             label: 'Nombre',         required: true  },
  { key: 'slug',             label: 'Slug',            required: false },
  { key: 'shortDescription', label: 'Desc. corta',     required: false },
  { key: 'description',      label: 'Descripcion',     required: false },
  { key: 'price',            label: 'Precio',          required: false },
  { key: 'salePrice',        label: 'Precio oferta',   required: false },
  { key: 'currency',         label: 'Moneda',          required: false },
  { key: 'categorySlug',     label: 'Categoria slug',  required: false },
  { key: 'badge',            label: 'Etiqueta',        required: false },
  { key: 'status',           label: 'Estado',          required: false },
  { key: 'featured',         label: 'Destacado',       required: false },
  { key: 'order',            label: 'Orden',           required: false },
  { key: 'stock',            label: 'Stock',           required: false },
  { key: 'tags',             label: 'Tags',            required: false },
  { key: 'imageUrl',         label: 'URL imagen',      required: false },
]

const HEADERS     = COLUMNS.map(c => c.label)
const EXAMPLE_ROW = [
  'Crema hidratante', 'crema-hidratante', 'Cuida tu piel a diario',
  'Descripcion completa del producto', '1500', '1200', '$',
  'cuidado-facial', 'Nuevo', 'published', 'false', '0', '50',
  'hidratante, crema', 'https://...',
]

function downloadCSV() {
  const csv = [
    HEADERS.join(','),
    EXAMPLE_ROW.map(v => `"${v}"`).join(','),
  ].join('\n')
  const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }))
  const a   = Object.assign(document.createElement('a'), { href: url, download: 'productos-plantilla.csv' })
  a.click()
  URL.revokeObjectURL(url)
}

function downloadXLSX(categories) {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([HEADERS, EXAMPLE_ROW])
  ws['!cols'] = HEADERS.map((_, i) => ({ wch: i === 0 ? 30 : i < 4 ? 28 : 16 }))
  XLSX.utils.book_append_sheet(wb, ws, 'Productos')
  if (categories.length) {
    const catWs = XLSX.utils.aoa_to_sheet([
      ['Slug (usar en "Categoria slug")', 'Nombre'],
      ...categories.map(c => [c.slug, c.name]),
    ])
    catWs['!cols'] = [{ wch: 30 }, { wch: 30 }]
    XLSX.utils.book_append_sheet(wb, catWs, 'Categorias')
  }
  XLSX.writeFile(wb, 'productos-plantilla.xlsx')
}

function parseRow(raw) {
  const get = (label, key) => String(raw[label] ?? raw[key] ?? '').trim()
  return {
    name:             get('Nombre',        'name'),
    slug:             get('Slug',          'slug'),
    shortDescription: get('Desc. corta',   'shortDescription'),
    description:      get('Descripcion',   'description'),
    price:            get('Precio',        'price'),
    salePrice:        get('Precio oferta', 'salePrice'),
    currency:         get('Moneda',        'currency') || '$',
    categorySlug:     get('Categoria slug','categorySlug'),
    badge:            get('Etiqueta',      'badge'),
    status:           get('Estado',        'status') || 'published',
    featured:         get('Destacado',     'featured').toLowerCase() === 'true',
    order:            Number(get('Orden',  'order')) || 0,
    stock:            get('Stock',         'stock'),
    tags:             get('Tags',          'tags'),
    imageUrl:         get('URL imagen',    'imageUrl'),
  }
}

export default function BulkImportModal({ onClose, categories = [] }) {
  const [step,        setStep]        = useState('start')
  const [rows,        setRows]        = useState([])
  const [errors,      setErrors]      = useState([])
  const [importing,   setImporting]   = useState(false)
  const [importCount, setImportCount] = useState(0)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    try {
      const buf    = await file.arrayBuffer()
      const wb     = XLSX.read(buf)
      const ws     = wb.Sheets[wb.SheetNames[0]]
      const data   = XLSX.utils.sheet_to_json(ws, { defval: '' })

      if (!data.length) {
        showToast('El archivo está vacío o no tiene el formato correcto.', 'warning')
        return
      }

      const parsed = data.map(parseRow)
      const errs   = []
      parsed.forEach((r, i) => { if (!r.name) errs.push(`Fila ${i + 2}: Nombre requerido`) })

      setRows(parsed)
      setErrors(errs)
      setStep('preview')
    } catch {
      showToast('No se pudo leer el archivo. Verificá que sea CSV o Excel válido.', 'error')
    }
  }

  async function handleImport() {
    setImporting(true)
    let count = 0
    try {
      for (const r of rows) {
        if (!r.name) continue
        const tagsArray = r.tags ? r.tags.split(',').map(t => t.trim()).filter(Boolean) : []
        const cat       = categories.find(c => c.slug === r.categorySlug)
        await addDoc(collection(db, 'products'), {
          name:             r.name,
          slug:             r.slug || slugify(r.name),
          shortDescription: r.shortDescription,
          description:      r.description,
          price:            r.price     ? Number(r.price)     : null,
          salePrice:        r.salePrice ? Number(r.salePrice) : null,
          currency:         r.currency || '$',
          categorySlug:     r.categorySlug,
          categoryName:     cat?.name ?? r.categorySlug,
          badge:            r.badge,
          status:           ['published', 'draft', 'archived'].includes(r.status) ? r.status : 'published',
          featured:         r.featured,
          order:            r.order,
          stock:            r.stock !== '' ? Number(r.stock) : null,
          tags:             tagsArray,
          imageUrl:         r.imageUrl,
          imagePath:        '',
          images:           [],
          attributes:       [],
          createdAt:        serverTimestamp(),
          updatedAt:        serverTimestamp(),
        })
        count++
        setImportCount(count)
      }
      showToast(`${count} producto${count !== 1 ? 's' : ''} importado${count !== 1 ? 's' : ''} correctamente.`, 'success')
      onClose()
    } catch {
      showToast(`Error en fila ${count + 1}. Se importaron ${count} de ${rows.length} productos.`, 'error')
    } finally {
      setImporting(false)
    }
  }

  const hasBlockingErrors = errors.some(e => e.includes('requerido'))

  return (
    <div className={adminStyles.modalOverlay} onClick={onClose}>
      <div className={`${adminStyles.modal} ${styles.modal}`} onClick={e => e.stopPropagation()}>
        <div className={adminStyles.modalHeader}>
          <h2 className={adminStyles.modalTitle}>Carga masiva de productos</h2>
          <button className={adminStyles.modalClose} onClick={onClose}>✕</button>
        </div>

        {step === 'start' && (
          <div className={styles.body}>
            <div className={styles.stepBlock}>
              <div className={styles.stepNum}>1</div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>Descargá la plantilla</h3>
                <p className={styles.stepDesc}>
                  Completá la plantilla con los datos de tus productos. La columna{' '}
                  <code>URL imagen</code> puede llenarse con URLs copiadas desde la{' '}
                  <strong>Biblioteca de medios</strong> (clic en "Copiar URL").
                </p>
                {categories.length > 0 && (
                  <div className={styles.catList}>
                    <span className={styles.catListLabel}>Categorías disponibles:</span>
                    {categories.map(c => (
                      <code key={c.id} className={styles.catChip}>{c.slug}</code>
                    ))}
                  </div>
                )}
                <div className={styles.downloadBtns}>
                  <button className={adminStyles.btnSecondary} onClick={downloadCSV}>
                    ↓ Plantilla CSV
                  </button>
                  <button className={adminStyles.btnSecondary} onClick={() => downloadXLSX(categories)}>
                    ↓ Plantilla Excel (.xlsx)
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.stepBlock}>
              <div className={styles.stepNum}>2</div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>Subí el archivo completado</h3>
                <p className={styles.stepDesc}>
                  Aceptamos <strong>.csv</strong> y <strong>.xlsx / .xls</strong>.
                </p>
                <label className={styles.fileDropZone}>
                  <UploadIcon />
                  <span>Clic para seleccionar archivo</span>
                  <small>.csv · .xlsx · .xls</small>
                  <input type="file" accept=".csv,.xlsx,.xls" className={styles.hiddenInput} onChange={handleFile} />
                </label>
              </div>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className={styles.body}>
            <div className={styles.previewHeader}>
              <span className={styles.previewCount}>
                {rows.length} producto{rows.length !== 1 ? 's' : ''} detectado{rows.length !== 1 ? 's' : ''}
              </span>
              {errors.length > 0 && (
                <div className={styles.errorList}>
                  {errors.map((err, i) => <span key={i} className={styles.errorItem}>⚠ {err}</span>)}
                </div>
              )}
            </div>

            <div className={styles.previewTableWrap}>
              <table className={adminStyles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Categoría</th>
                    <th>Precio</th>
                    <th>Estado</th>
                    <th>Imagen</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 50).map((r, i) => (
                    <tr key={i} className={!r.name ? styles.rowError : ''}>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{i + 1}</td>
                      <td>
                        <span className={adminStyles.tablePrimary}>
                          {r.name || <em style={{ color: '#b91c1c' }}>Sin nombre</em>}
                        </span>
                      </td>
                      <td><code style={{ fontSize: '0.75rem' }}>{r.categorySlug || '—'}</code></td>
                      <td>{r.price ? `${r.currency || '$'} ${r.price}` : '—'}</td>
                      <td>{r.status || 'published'}</td>
                      <td>
                        {r.imageUrl
                          ? <img src={r.imageUrl} alt="" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4 }} loading="lazy" decoding="async" onError={e => e.currentTarget.style.display = 'none'} />
                          : <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>—</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 50 && (
                <p className={styles.truncNote}>Mostrando los primeros 50 de {rows.length} productos.</p>
              )}
            </div>

            <div className={adminStyles.formFooter}>
              <button className={adminStyles.btnSecondary} onClick={() => setStep('start')}>
                ← Volver
              </button>
              <button
                className={adminStyles.btnPrimary}
                onClick={handleImport}
                disabled={importing || hasBlockingErrors}
              >
                {importing
                  ? `Importando ${importCount}/${rows.length}…`
                  : `Importar ${rows.filter(r => r.name).length} productos`
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function UploadIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  )
}
