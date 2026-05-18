import { useState, useEffect } from 'react'
import { novedadesService, DEFAULT_CONFIG } from '@/firebase/services/novedadesService'
import { showToast } from '@/shared/components/ui/Toast'
import MediaPickerModal from '@/backoffice/shared/components/MediaPickerModal'
import adminStyles from '../admin.module.css'
import styles from './BackofficeNovedadesPage.module.css'

const COUNT_OPTIONS = [4, 6, 8, 12]

const SITE_ROUTES = [
  { value: '/catalogo',  label: 'Catálogo' },
  { value: '/',          label: 'Inicio' },
  { value: '/nosotras',  label: 'Nosotras' },
  { value: '/novedades', label: 'Novedades' },
  { value: '/blog',      label: 'Blog' },
  { value: '/contacto',  label: 'Contacto' },
]

const SECTIONS = [
  { key: 'newProducts',    label: 'Nuevos productos',  sub: 'Últimos productos publicados ordenados por fecha' },
  { key: 'pinnedProducts', label: 'Selección especial', sub: 'Productos fijados manualmente por el equipo' },
  { key: 'blog',           label: 'Artículos del blog', sub: 'Últimas 3 entradas publicadas en el blog' },
  { key: 'gallery',        label: 'Galería de belleza', sub: 'Imágenes destacadas de la galería' },
]

export default function BackofficeNovedadesPage() {
  const [config,        setConfig]        = useState({ ...DEFAULT_CONFIG, campaign: { ...DEFAULT_CONFIG.campaign }, sections: { ...DEFAULT_CONFIG.sections }, pinnedProductIds: [] })
  const [allProducts,   setAllProducts]   = useState([])
  const [productSearch, setProductSearch] = useState('')
  const [loading,         setLoading]         = useState(true)
  const [saving,          setSaving]          = useState(false)
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false)

  useEffect(() => {
    Promise.all([
      novedadesService.getConfig(),
      novedadesService.getAllProducts(),
    ]).then(([cfg, prods]) => {
      setConfig(cfg)
      setAllProducts(prods)
    }).catch(() => showToast('Error al cargar configuración', 'error'))
      .finally(() => setLoading(false))
  }, [])

  function setCampaign(key, val) {
    setConfig(c => ({ ...c, campaign: { ...c.campaign, [key]: val } }))
  }

  function toggleSection(key) {
    setConfig(c => ({ ...c, sections: { ...c.sections, [key]: !c.sections?.[key] } }))
  }

  function togglePinned(productId) {
    setConfig(c => {
      const ids = c.pinnedProductIds ?? []
      const has = ids.includes(productId)
      return { ...c, pinnedProductIds: has ? ids.filter(id => id !== productId) : [...ids, productId] }
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      await novedadesService.saveConfig(config)
      showToast('Configuración guardada.', 'success')
    } catch { showToast('Error al guardar.', 'error') }
    finally { setSaving(false) }
  }

  const filteredProducts = allProducts.filter(p => {
    const q = productSearch.trim().toLowerCase()
    if (!q) return true
    return p.title?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q)
  })

  const { campaign, sections, pinnedProductIds = [] } = config
  const activeSectionCount = Object.values(sections ?? {}).filter(Boolean).length

  if (loading) return (
    <div className={styles.page}>
      <div className={`skeleton ${styles.skPage}`} style={{ height: '60vh', borderRadius: 12 }} />
    </div>
  )

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={adminStyles.pageHeader}>
        <div>
          <h1 className={adminStyles.pageTitle}>Novedades</h1>
          <p className={adminStyles.pageSub}>Configura la página /novedades — {activeSectionCount} de {SECTIONS.length} secciones activas</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href="/novedades" target="_blank" rel="noopener noreferrer" className={adminStyles.btnSecondary}>
            Ver página →
          </a>
          <button className={adminStyles.btnPrimary} onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      <div className={styles.layout}>
        {/* ── Left: Form ── */}
        <div>
          {/* Campaign Banner */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}><HeroIcon /> Campaña principal</h3>
            <div className={styles.fieldGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Texto del badge</label>
                <input type="text" className={styles.input} value={campaign.badge} onChange={e => setCampaign('badge', e.target.value)} placeholder="✦ Novedades" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Texto del botón (CTA)</label>
                <input type="text" className={styles.input} value={campaign.ctaText} onChange={e => setCampaign('ctaText', e.target.value)} placeholder="Explorar catálogo" />
              </div>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label}>Título principal</label>
                <input type="text" className={styles.input} value={campaign.title} onChange={e => setCampaign('title', e.target.value)} placeholder="Lo más nuevo ha llegado" />
              </div>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label}>Subtítulo</label>
                <textarea className={styles.textarea} rows={2} value={campaign.subtitle} onChange={e => setCampaign('subtitle', e.target.value)} placeholder="Descripción de la campaña…" />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Link del botón</label>
                <select
                  className={styles.countSelect}
                  value={SITE_ROUTES.some(r => r.value === campaign.ctaLink) ? campaign.ctaLink : ''}
                  onChange={e => setCampaign('ctaLink', e.target.value)}
                >
                  {!SITE_ROUTES.some(r => r.value === campaign.ctaLink) && (
                    <option value="" disabled>Selecciona una página…</option>
                  )}
                  {SITE_ROUTES.map(r => (
                    <option key={r.value} value={r.value}>{r.label} ({r.value})</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Color de fondo (sin imagen)</label>
                <div className={styles.colorRow}>
                  <input type="color" className={styles.colorPicker} value={campaign.bgColor || '#f5eaf0'} onChange={e => setCampaign('bgColor', e.target.value)} />
                  <input type="text" className={styles.colorHex} value={campaign.bgColor || '#f5eaf0'} onChange={e => setCampaign('bgColor', e.target.value)} placeholder="#f5eaf0" />
                </div>
              </div>
              <div className={`${styles.field} ${styles.fieldFull}`}>
                <label className={styles.label}>Imagen de portada (opcional)</label>
                {campaign.coverImage ? (
                  <div className={styles.imagePreviewWrap}>
                    <img src={campaign.coverImage} alt="portada" className={styles.imageThumb} onError={e => { e.target.style.display = 'none' }} />
                    <div className={styles.imageActions}>
                      <button type="button" className={styles.imageChangeBtn} onClick={() => setMediaPickerOpen(true)}>Cambiar imagen</button>
                      <button type="button" className={styles.imageRemoveBtn} onClick={() => setCampaign('coverImage', '')}>✕ Quitar</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" className={styles.mediaPickerBtn} onClick={() => setMediaPickerOpen(true)}>
                    <PhotoIcon />
                    <span>Elegir imagen de la biblioteca de medios</span>
                  </button>
                )}
              </div>
            </div>
            {campaign.coverImage && (
              <div className={styles.coverPreview}>
                <img src={campaign.coverImage} alt="preview" onError={e => { e.target.style.display = 'none' }} />
                <div className={styles.coverPreviewOverlay}>
                  <span className={styles.coverPreviewText}>{campaign.title || 'Título de campaña'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Sections toggles */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}><LayoutIcon /> Secciones visibles</h3>
            <div className={styles.toggleList}>
              {SECTIONS.map(s => (
                <div key={s.key} className={styles.toggleRow} onClick={() => toggleSection(s.key)}>
                  <div>
                    <div className={styles.toggleLabel}>{s.label}</div>
                    <div className={styles.toggleSub}>{s.sub}</div>
                  </div>
                  <label className={styles.toggle} onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={Boolean(sections?.[s.key])} onChange={() => toggleSection(s.key)} />
                    <div className={styles.toggleTrack}><div className={styles.toggleThumb} /></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* New products count */}
          {sections?.newProducts && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}><GridIcon /> Nuevos productos</h3>
              <div className={styles.field}>
                <label className={styles.label}>¿Cuántos productos mostrar?</label>
                <select
                  className={styles.countSelect}
                  value={config.newProductsCount ?? 8}
                  onChange={e => setConfig(c => ({ ...c, newProductsCount: Number(e.target.value) }))}
                >
                  {COUNT_OPTIONS.map(n => <option key={n} value={n}>Últimos {n} productos</option>)}
                </select>
                <p className={adminStyles.pageSub} style={{ marginTop: 6 }}>
                  Se muestran automáticamente los productos publicados más recientes.
                </p>
              </div>
            </div>
          )}

          {/* Pinned products picker */}
          {sections?.pinnedProducts && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}><StarIcon /> Selección especial — productos fijados</h3>
              {pinnedProductIds.length > 0 && (
                <p className={styles.pickerCount}>{pinnedProductIds.length} producto{pinnedProductIds.length !== 1 ? 's' : ''} seleccionado{pinnedProductIds.length !== 1 ? 's' : ''}</p>
              )}
              <input
                type="search"
                className={styles.pickerSearch}
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                placeholder="Buscar producto por nombre o categoría…"
              />
              {allProducts.length === 0 ? (
                <p className={adminStyles.pageSub}>No hay productos disponibles.</p>
              ) : (
                <div className={styles.pickerList}>
                  {filteredProducts.map(p => {
                    const isSelected = pinnedProductIds.includes(p.id)
                    const thumb      = p.images?.[0] ?? p.image
                    return (
                      <div
                        key={p.id}
                        className={`${styles.pickerItem} ${isSelected ? styles.pickerSelected : ''}`}
                        onClick={() => togglePinned(p.id)}
                      >
                        <div className={styles.pickerThumb}>
                          {thumb ? <img src={thumb} alt={p.title} /> : null}
                        </div>
                        <div>
                          <div className={styles.pickerName}>{p.title}</div>
                          {p.category && <div className={styles.pickerCat}>{p.category}</div>}
                        </div>
                        <div className={`${styles.pickerCheck} ${isSelected ? styles.pickerCheckOn : ''}`}>
                          {isSelected && <CheckIcon />}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Right: Sidebar ── */}
        <aside className={styles.sidebar}>
          {/* Preview card */}
          <div className={styles.previewCard}>
            <div
              className={styles.previewSwatch}
              style={{
                backgroundImage:  campaign.coverImage ? `url(${campaign.coverImage})` : undefined,
                backgroundColor:  campaign.coverImage ? undefined : (campaign.bgColor || '#f5eaf0'),
                backgroundSize:   'cover',
                backgroundPosition: 'center',
              }}
            >
              <span className={styles.previewTitle}>{campaign.title || 'Título de campaña'}</span>
            </div>
            <div className={styles.previewBody}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--font-size-xs)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-text-muted)', margin: '0 0 10px' }}>Secciones activas</p>
              {SECTIONS.map(s => (
                <div key={s.key} className={styles.previewRow}>
                  <div className={`${styles.previewDot} ${sections?.[s.key] ? '' : styles.previewDotOff}`} />
                  <span style={{ color: sections?.[s.key] ? 'var(--color-text-main)' : 'var(--color-text-muted)' }}>{s.label}</span>
                </div>
              ))}
              <a href="/novedades" target="_blank" rel="noopener noreferrer" className={styles.viewBtn}>
                Ver página de novedades →
              </a>
            </div>
          </div>

          {/* Info */}
          <div className={styles.infoCard}>
            <p className={styles.infoTitle}>¿Cómo funciona?</p>
            <p className={styles.infoText}>La página <strong>/novedades</strong> se construye automáticamente con el contenido más reciente de la tienda.</p>
            <p className={styles.infoText}>Los <strong>productos nuevos</strong> y las <strong>entradas del blog</strong> se actualizan solos. Solo necesitas configurar la campaña y, si quieres, fijar productos especiales.</p>
            <p className={styles.infoText} style={{ marginBottom: 0 }}>Los cambios se aplican al guardar y son visibles de inmediato.</p>
          </div>
        </aside>
      </div>
      {mediaPickerOpen && (
        <MediaPickerModal
          onSelect={({ url }) => { setCampaign('coverImage', url); setMediaPickerOpen(false) }}
          onClose={() => setMediaPickerOpen(false)}
        />
      )}
    </div>
  )
}

function PhotoIcon()  { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> }
function HeroIcon()  { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg> }
function LayoutIcon(){ return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg> }
function GridIcon()  { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> }
function StarIcon()  { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> }
function CheckIcon() { return <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> }
