import { useState, useEffect } from 'react'
import { siteConfigService } from '@/firebase/services/siteConfigService'
import ImageUploader from '../shared/components/ImageUploader'
import { showToast } from '@/shared/components/ui/Toast'
import adminStyles from '../admin.module.css'
import styles from './SettingsPage.module.css'

/* ── Tab definitions ────────────────────────────────── */
const TABS = [
  { id: 'general',   label: 'General',    emoji: '🏠', desc: 'Identidad y logo' },
  { id: 'hero',      label: 'Inicio',     emoji: '✨', desc: 'Hero y CTAs' },
  { id: 'contact',   label: 'Contacto',   emoji: '📞', desc: 'WhatsApp, email y dirección' },
  { id: 'social',    label: 'Redes',      emoji: '📱', desc: 'Links de redes sociales' },
  { id: 'store',     label: 'Tienda',     emoji: '🛒', desc: 'Moneda, envíos y catálogo' },
  { id: 'seo',       label: 'SEO',        emoji: '🔍', desc: 'Meta tags y analítica' },
  { id: 'policies',  label: 'Políticas',  emoji: '📋', desc: 'Envíos, devoluciones y legales' },
  { id: 'advanced',  label: 'Avanzado',   emoji: '⚙️', desc: 'Mantenimiento y opciones avanzadas' },
]

/* Keys saved per tab (for partial merge) */
const TAB_KEYS = {
  general:  ['siteName','tagline','footerText','logoUrl','logoPath'],
  hero:     ['heroTitle','heroSubtitle','heroCta','heroSecondCta'],
  contact:  ['whatsappNumber','whatsappMessage','email','phone','address','openingHours'],
  social:   ['instagramUrl','facebookUrl','tiktokUrl','youtubeUrl','pinterestUrl'],
  store:    ['currency','showPrices','productsPerPage','freeShippingFrom','stockAlertThreshold','catalogTitle','catalogSubtitle'],
  seo:      ['metaTitle','metaDescription','ogImageUrl','ogImagePath','googleAnalyticsId'],
  policies: ['shippingInfo','returnPolicy','termsUrl','privacyUrl'],
  advanced: ['maintenanceMode','maintenanceMessage'],
}

/* Toggle switch component */
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`${styles.toggle} ${checked ? styles.toggleOn : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.toggleThumb} />
    </button>
  )
}

/* Reusable field hint */
function Hint({ text }) {
  return <p className={styles.fieldHint}>{text}</p>
}

export default function SettingsPage() {
  const [settings,  setSettings]  = useState({})
  const [loading,   setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState('general')
  const [savingTab, setSavingTab] = useState(null)

  useEffect(() => {
    siteConfigService.get().then(data => { setSettings(data); setLoading(false) })
  }, [])

  const f = (key) => settings[key] ?? ''
  const fb = (key, def = false) => settings[key] ?? def
  const fn = (key, def = '') => settings[key] ?? def

  function set(key, value) { setSettings(s => ({ ...s, [key]: value })) }

  async function saveTab(tabId) {
    const keys = TAB_KEYS[tabId] ?? []
    const payload = {}
    keys.forEach(k => {
      if (settings[k] !== undefined) payload[k] = settings[k]
    })
    setSavingTab(tabId)
    try {
      await siteConfigService.save(payload)
      showToast('Sección guardada.', 'success')
    } catch {
      showToast('Error al guardar.', 'error')
    } finally {
      setSavingTab(null)
    }
  }

  if (loading) return <div className={adminStyles.loadingRow}>Cargando configuración…</div>

  const isSaving = savingTab === activeTab

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={adminStyles.pageHeader}>
        <div>
          <h1 className={adminStyles.pageTitle}>Configuración del sitio</h1>
          <p className={adminStyles.pageSub}>
            {TABS.find(t => t.id === activeTab)?.desc}
          </p>
        </div>
        <a href="/" target="_blank" rel="noopener" className={adminStyles.btnSecondary} style={{ textDecoration: 'none' }}>
          ↗ Ver sitio
        </a>
      </div>

      {/* Tab bar */}
      <div className={styles.tabBar}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── General ──────────────────────────────────── */}
      {activeTab === 'general' && (
        <div className={styles.section}>
          <div className={styles.fieldsGrid}>
            <div className={adminStyles.field}>
              <label className={adminStyles.label}>Nombre del sitio *</label>
              <input type="text" value={f('siteName')} onChange={e => set('siteName', e.target.value)} className={adminStyles.input} placeholder="Serena Glow" />
            </div>
            <div className={adminStyles.field}>
              <label className={adminStyles.label}>Tagline</label>
              <input type="text" value={f('tagline')} onChange={e => set('tagline', e.target.value)} className={adminStyles.input} placeholder="Belleza que te define." />
            </div>
            <div className={`${adminStyles.field} ${styles.fullWidth}`}>
              <label className={adminStyles.label}>Texto del footer</label>
              <input type="text" value={f('footerText')} onChange={e => set('footerText', e.target.value)} className={adminStyles.input} placeholder="© 2025 Serena Glow. Todos los derechos reservados." />
            </div>
            <div className={`${adminStyles.field} ${styles.fullWidth}`}>
              <ImageUploader
                label="Logo del sitio"
                folder="brand"
                value={f('logoUrl') || null}
                storagePath={f('logoPath') || null}
                onChange={r => { set('logoUrl', r?.url ?? ''); set('logoPath', r?.path ?? '') }}
                showLibraryPicker
                registerInLibrary
              />
              <Hint text="PNG transparente recomendado. Se muestra en la barra de navegación. Tamaño ideal: 180×50 px." />
            </div>
          </div>
          <SaveBar onSave={() => saveTab('general')} saving={isSaving} />
        </div>
      )}

      {/* ── Inicio / Hero ─────────────────────────────── */}
      {activeTab === 'hero' && (
        <div className={styles.section}>
          <div className={styles.fieldsGrid}>
            <div className={`${adminStyles.field} ${styles.fullWidth}`}>
              <label className={adminStyles.label}>Título del hero</label>
              <textarea value={f('heroTitle')} onChange={e => set('heroTitle', e.target.value)} rows={3} className={adminStyles.textarea} placeholder="Tu ritual de belleza,&#10;elevado." />
              <Hint text="Cada salto de línea genera un quiebre visual. La primera palabra en itálica se configura en el código." />
            </div>
            <div className={`${adminStyles.field} ${styles.fullWidth}`}>
              <label className={adminStyles.label}>Subtítulo del hero</label>
              <textarea value={f('heroSubtitle')} onChange={e => set('heroSubtitle', e.target.value)} rows={2} className={adminStyles.textarea} placeholder="Cosméticos, perfumes, body care y trajes de baño pensados para ti." />
            </div>
            <div className={adminStyles.field}>
              <label className={adminStyles.label}>Botón principal (CTA)</label>
              <input type="text" value={f('heroCta')} onChange={e => set('heroCta', e.target.value)} className={adminStyles.input} placeholder="Explorar colección" />
            </div>
            <div className={adminStyles.field}>
              <label className={adminStyles.label}>Botón secundario</label>
              <input type="text" value={f('heroSecondCta')} onChange={e => set('heroSecondCta', e.target.value)} className={adminStyles.input} placeholder="Conocer más" />
            </div>
          </div>
          <SaveBar onSave={() => saveTab('hero')} saving={isSaving} />
        </div>
      )}

      {/* ── Contacto ──────────────────────────────────── */}
      {activeTab === 'contact' && (
        <div className={styles.section}>
          {f('whatsappNumber') && (
            <a
              href={`https://wa.me/${f('whatsappNumber')}?text=${encodeURIComponent(f('whatsappMessage') || '')}`}
              target="_blank"
              rel="noopener"
              className={styles.previewLink}
            >
              ✅ Probar link de WhatsApp →
            </a>
          )}
          <div className={styles.fieldsGrid}>
            <div className={adminStyles.field}>
              <label className={adminStyles.label}>Número WhatsApp (sin +)</label>
              <input type="text" value={f('whatsappNumber')} onChange={e => set('whatsappNumber', e.target.value)} className={adminStyles.input} placeholder="5491100000000" />
              <Hint text="Formato: código de país + código de área + número. Ej: 5491123456789" />
            </div>
            <div className={adminStyles.field}>
              <label className={adminStyles.label}>Mensaje predefinido de WhatsApp</label>
              <input type="text" value={f('whatsappMessage')} onChange={e => set('whatsappMessage', e.target.value)} className={adminStyles.input} placeholder="¡Hola! Me gustaría consultar sobre los productos." />
            </div>
            <div className={adminStyles.field}>
              <label className={adminStyles.label}>Email de contacto</label>
              <input type="email" value={f('email')} onChange={e => set('email', e.target.value)} className={adminStyles.input} placeholder="hola@serenaglow.com" />
            </div>
            <div className={adminStyles.field}>
              <label className={adminStyles.label}>Teléfono visible</label>
              <input type="text" value={f('phone')} onChange={e => set('phone', e.target.value)} className={adminStyles.input} placeholder="+54 9 11 0000-0000" />
            </div>
            <div className={adminStyles.field}>
              <label className={adminStyles.label}>Dirección</label>
              <input type="text" value={f('address')} onChange={e => set('address', e.target.value)} className={adminStyles.input} placeholder="Buenos Aires, Argentina" />
            </div>
            <div className={adminStyles.field}>
              <label className={adminStyles.label}>Horarios de atención</label>
              <input type="text" value={f('openingHours')} onChange={e => set('openingHours', e.target.value)} className={adminStyles.input} placeholder="Lun-Vie 9:00-18:00" />
            </div>
          </div>
          <SaveBar onSave={() => saveTab('contact')} saving={isSaving} />
        </div>
      )}

      {/* ── Redes sociales ────────────────────────────── */}
      {activeTab === 'social' && (
        <div className={styles.section}>
          <div className={styles.fieldsGrid}>
            {[
              { key: 'instagramUrl', label: 'Instagram', placeholder: 'https://instagram.com/serenaglow', emoji: '📸' },
              { key: 'facebookUrl',  label: 'Facebook',  placeholder: 'https://facebook.com/serenaglow',  emoji: '👥' },
              { key: 'tiktokUrl',    label: 'TikTok',    placeholder: 'https://tiktok.com/@serenaglow',   emoji: '🎵' },
              { key: 'youtubeUrl',   label: 'YouTube',   placeholder: 'https://youtube.com/@serenaglow',  emoji: '▶️' },
              { key: 'pinterestUrl', label: 'Pinterest', placeholder: 'https://pinterest.com/serenaglow', emoji: '📌' },
            ].map(net => (
              <div key={net.key} className={adminStyles.field}>
                <label className={adminStyles.label}>{net.emoji} {net.label}</label>
                <input type="url" value={f(net.key)} onChange={e => set(net.key, e.target.value)} className={adminStyles.input} placeholder={net.placeholder} />
              </div>
            ))}
          </div>
          <Hint text="Solo completá los campos de las redes que uses. Los íconos aparecen automáticamente en el footer." />
          <SaveBar onSave={() => saveTab('social')} saving={isSaving} />
        </div>
      )}

      {/* ── Tienda ────────────────────────────────────── */}
      {activeTab === 'store' && (
        <div className={styles.section}>
          <div className={styles.fieldsGrid}>
            <div className={adminStyles.field}>
              <label className={adminStyles.label}>Moneda</label>
              <select value={f('currency') || 'Bs.'} onChange={e => set('currency', e.target.value)} className={adminStyles.select}>
                <option value="Bs.">Bs. (Bolívar venezolano)</option>
                <option value="USD">USD (Dólar americano)</option>
                <option value="€">€ (Euro)</option>
              </select>
            </div>
            <div className={adminStyles.field}>
              <label className={adminStyles.label}>Productos por página</label>
              <input type="number" min="4" max="48" step="4" value={fn('productsPerPage', 12)} onChange={e => set('productsPerPage', Number(e.target.value))} className={adminStyles.input} />
            </div>
            <div className={adminStyles.field}>
              <label className={adminStyles.label}>Envío gratis desde (monto)</label>
              <input type="number" min="0" value={fn('freeShippingFrom', '')} onChange={e => set('freeShippingFrom', e.target.value ? Number(e.target.value) : null)} className={adminStyles.input} placeholder="Dejar vacío para no mostrar" />
            </div>
            <div className={adminStyles.field}>
              <label className={adminStyles.label}>Alerta stock bajo (unidades)</label>
              <input type="number" min="0" value={fn('stockAlertThreshold', 3)} onChange={e => set('stockAlertThreshold', Number(e.target.value))} className={adminStyles.input} />
              <Hint text="Se marca en rojo en el panel cuando el stock es menor a este número." />
            </div>
            <div className={adminStyles.field}>
              <label className={adminStyles.label}>Título del catálogo</label>
              <input type="text" value={f('catalogTitle')} onChange={e => set('catalogTitle', e.target.value)} className={adminStyles.input} placeholder="Nuestros Productos" />
            </div>
            <div className={adminStyles.field}>
              <label className={adminStyles.label}>Subtítulo del catálogo</label>
              <input type="text" value={f('catalogSubtitle')} onChange={e => set('catalogSubtitle', e.target.value)} className={adminStyles.input} placeholder="Descubre toda nuestra colección" />
            </div>
            <div className={`${adminStyles.field} ${styles.fullWidth}`}>
              <label className={adminStyles.label}>Mostrar precios en el catálogo</label>
              <div className={styles.toggleRow}>
                <Toggle checked={fb('showPrices', true)} onChange={v => set('showPrices', v)} />
                <span className={styles.toggleLabel}>{fb('showPrices', true) ? 'Precios visibles' : 'Precios ocultos (solo WhatsApp)'}</span>
              </div>
            </div>
          </div>
          <SaveBar onSave={() => saveTab('store')} saving={isSaving} />
        </div>
      )}

      {/* ── SEO ───────────────────────────────────────── */}
      {activeTab === 'seo' && (
        <div className={styles.section}>
          <div className={styles.fieldsGrid}>
            <div className={`${adminStyles.field} ${styles.fullWidth}`}>
              <label className={adminStyles.label}>Título SEO (meta title)</label>
              <input type="text" value={f('metaTitle')} onChange={e => set('metaTitle', e.target.value)} className={adminStyles.input} placeholder="Serena Glow | Cosméticos & Lifestyle" maxLength={60} />
              <Hint text={`${(f('metaTitle') || '').length}/60 caracteres recomendados.`} />
            </div>
            <div className={`${adminStyles.field} ${styles.fullWidth}`}>
              <label className={adminStyles.label}>Descripción SEO (meta description)</label>
              <textarea value={f('metaDescription')} onChange={e => set('metaDescription', e.target.value)} rows={3} className={adminStyles.textarea} placeholder="Descubre cosméticos, perfumes y body care de calidad premium." maxLength={160} />
              <Hint text={`${(f('metaDescription') || '').length}/160 caracteres recomendados.`} />
            </div>
            <div className={`${adminStyles.field} ${styles.fullWidth}`}>
              <ImageUploader
                label="Imagen Open Graph (OG Image)"
                folder="brand"
                value={f('ogImageUrl') || null}
                storagePath={f('ogImagePath') || null}
                onChange={r => { set('ogImageUrl', r?.url ?? ''); set('ogImagePath', r?.path ?? '') }}
                showLibraryPicker
                registerInLibrary
              />
              <Hint text="Se muestra cuando se comparte el link en redes sociales. Tamaño ideal: 1200×630 px." />
            </div>
            <div className={`${adminStyles.field} ${styles.fullWidth}`}>
              <label className={adminStyles.label}>ID Google Analytics</label>
              <input type="text" value={f('googleAnalyticsId')} onChange={e => set('googleAnalyticsId', e.target.value)} className={adminStyles.input} placeholder="G-XXXXXXXXXX" />
              <Hint text="Ingresá tu ID de GA4 para habilitar el seguimiento de visitas (requiere integración en el código)." />
            </div>
          </div>
          <SaveBar onSave={() => saveTab('seo')} saving={isSaving} />
        </div>
      )}

      {/* ── Políticas ─────────────────────────────────── */}
      {activeTab === 'policies' && (
        <div className={styles.section}>
          <div className={styles.fieldsGrid}>
            <div className={`${adminStyles.field} ${styles.fullWidth}`}>
              <label className={adminStyles.label}>Información de envíos</label>
              <textarea value={f('shippingInfo')} onChange={e => set('shippingInfo', e.target.value)} rows={4} className={adminStyles.textarea} placeholder="Envíos a todo el país. Plazo estimado: 3-5 días hábiles..." />
            </div>
            <div className={`${adminStyles.field} ${styles.fullWidth}`}>
              <label className={adminStyles.label}>Política de devoluciones</label>
              <textarea value={f('returnPolicy')} onChange={e => set('returnPolicy', e.target.value)} rows={4} className={adminStyles.textarea} placeholder="Aceptamos devoluciones dentro de los 30 días de recibido el producto..." />
            </div>
            <div className={adminStyles.field}>
              <label className={adminStyles.label}>URL Términos y condiciones</label>
              <input type="url" value={f('termsUrl')} onChange={e => set('termsUrl', e.target.value)} className={adminStyles.input} placeholder="https://..." />
            </div>
            <div className={adminStyles.field}>
              <label className={adminStyles.label}>URL Política de privacidad</label>
              <input type="url" value={f('privacyUrl')} onChange={e => set('privacyUrl', e.target.value)} className={adminStyles.input} placeholder="https://..." />
            </div>
          </div>
          <SaveBar onSave={() => saveTab('policies')} saving={isSaving} />
        </div>
      )}

      {/* ── Avanzado ──────────────────────────────────── */}
      {activeTab === 'advanced' && (
        <AdvancedTab
          settings={settings}
          set={set}
          fb={fb}
          f={f}
          onSave={() => saveTab('advanced')}
          saving={isSaving}
        />
      )}
    </div>
  )
}

function AdvancedTab({ settings, set, fb, f, onSave, saving }) {
  const [helpEnabled, setHelpEnabled] = useState(
    () => localStorage.getItem('sg_admin_help') !== 'false'
  )

  useEffect(() => {
    const handler = () => setHelpEnabled(localStorage.getItem('sg_admin_help') !== 'false')
    window.addEventListener('sg_help_change', handler)
    return () => window.removeEventListener('sg_help_change', handler)
  }, [])

  function toggleHelp(v) {
    localStorage.setItem('sg_admin_help', v ? 'true' : 'false')
    setHelpEnabled(v)
    window.dispatchEvent(new Event('sg_help_change'))
  }

  return (
    <div className={styles.section}>
      {/* Maintenance mode */}
      <div className={`${styles.dangerZone} ${fb('maintenanceMode') ? styles.dangerActive : ''}`}>
        <div className={styles.dangerHeader}>
          <div>
            <h3 className={styles.dangerTitle}>⚠️ Modo mantenimiento</h3>
            <p className={styles.dangerDesc}>
              Cuando está activo, los visitantes ven un mensaje en lugar del sitio.{' '}
              <strong>El panel de administración sigue siendo accesible.</strong>
            </p>
          </div>
          <Toggle checked={fb('maintenanceMode')} onChange={v => set('maintenanceMode', v)} />
        </div>
        {fb('maintenanceMode') && (
          <div className={adminStyles.field} style={{ marginTop: 'var(--space-4)' }}>
            <label className={adminStyles.label}>Mensaje para los visitantes</label>
            <textarea
              value={f('maintenanceMessage')}
              onChange={e => set('maintenanceMessage', e.target.value)}
              rows={3}
              className={adminStyles.textarea}
              placeholder="Estamos trabajando para ti. Volvemos pronto."
            />
          </div>
        )}
      </div>

      {/* Help guide toggle */}
      <div className={styles.dangerZone} style={{ marginTop: 'var(--space-4)' }}>
        <div className={styles.dangerHeader}>
          <div>
            <h3 className={styles.dangerTitle} style={{ color: 'var(--color-text-main)' }}>
              📘 Guía de ayuda del panel
            </h3>
            <p className={styles.dangerDesc}>
              Muestra el botón <strong>?</strong> en la barra superior con guías contextuales por módulo.
              Puedes abrirlo en cualquier pantalla del panel para ver explicaciones detalladas.
            </p>
          </div>
          <Toggle checked={helpEnabled} onChange={toggleHelp} />
        </div>
      </div>

      <SaveBar onSave={onSave} saving={saving} />
    </div>
  )
}

function SaveBar({ onSave, saving }) {
  return (
    <div className={styles.saveBar}>
      <button type="button" onClick={onSave} disabled={saving} className={adminStyles.btnPrimary}>
        {saving ? 'Guardando…' : '✓ Guardar sección'}
      </button>
    </div>
  )
}
