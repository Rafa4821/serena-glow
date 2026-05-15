import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase/firestore'
import { showToast } from '@/shared/components/ui/Toast'
import adminStyles from '../admin.module.css'
import styles from './SettingsPage.module.css'

const SECTIONS = [
  {
    id: 'brand',
    title: 'Marca',
    fields: [
      { key: 'siteName',    label: 'Nombre del sitio',    type: 'text' },
      { key: 'tagline',     label: 'Tagline',              type: 'text' },
      { key: 'footerText',  label: 'Texto del footer',    type: 'text' },
    ],
  },
  {
    id: 'hero',
    title: 'Hero (inicio)',
    fields: [
      { key: 'heroTitle',    label: 'Título del hero',     type: 'textarea' },
      { key: 'heroSubtitle', label: 'Subtítulo del hero',  type: 'text' },
      { key: 'heroCta',      label: 'Texto CTA hero',      type: 'text' },
    ],
  },
  {
    id: 'contact',
    title: 'Contacto',
    fields: [
      { key: 'whatsappNumber',  label: 'Número WhatsApp (sin +)',    type: 'text', placeholder: '5491100000000' },
      { key: 'whatsappMessage', label: 'Mensaje WhatsApp por defecto', type: 'text' },
      { key: 'email',           label: 'Email de contacto',           type: 'email' },
      { key: 'phone',           label: 'Teléfono visible',            type: 'text' },
      { key: 'address',         label: 'Dirección',                   type: 'text' },
    ],
  },
  {
    id: 'social',
    title: 'Redes sociales',
    fields: [
      { key: 'instagramUrl', label: 'URL Instagram', type: 'url', placeholder: 'https://instagram.com/...' },
      { key: 'facebookUrl',  label: 'URL Facebook',  type: 'url', placeholder: 'https://facebook.com/...' },
      { key: 'tiktokUrl',    label: 'URL TikTok',    type: 'url', placeholder: 'https://tiktok.com/...' },
    ],
  },
]

export default function SettingsPage() {
  const [settings, setSettings] = useState({})
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)

  useEffect(() => {
    getDoc(doc(db, 'siteConfig', 'main')).then(snap => {
      if (snap.exists()) setSettings(snap.data())
      setLoading(false)
    })
  }, [])

  function handleField(key, value) {
    setSettings(s => ({ ...s, [key]: value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await setDoc(doc(db, 'siteConfig', 'main'), { ...settings, updatedAt: serverTimestamp() }, { merge: true })
      showToast('Configuración guardada.', 'success')
    } catch {
      showToast('Error al guardar.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className={adminStyles.loadingRow}>Cargando…</div>

  return (
    <div className={styles.page}>
      <div className={adminStyles.pageHeader}>
        <div>
          <h1 className={adminStyles.pageTitle}>Configuración del sitio</h1>
          <p className={adminStyles.pageSub}>Textos, contacto y redes sociales</p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        {SECTIONS.map(section => (
          <div key={section.id} className={styles.section}>
            <h2 className={styles.sectionTitle}>{section.title}</h2>
            <div className={styles.fieldsGrid}>
              {section.fields.map(field => (
                <div key={field.key} className={`${adminStyles.field} ${field.type === 'textarea' ? styles.fullWidth : ''}`}>
                  <label className={adminStyles.label}>{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={settings[field.key] ?? ''}
                      onChange={e => handleField(field.key, e.target.value)}
                      rows={3}
                      className={adminStyles.textarea}
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={settings[field.key] ?? ''}
                      onChange={e => handleField(field.key, e.target.value)}
                      className={adminStyles.input}
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className={styles.formFooter}>
          <button type="submit" disabled={saving} className={adminStyles.btnPrimary}>
            {saving ? 'Guardando…' : 'Guardar configuración'}
          </button>
        </div>
      </form>
    </div>
  )
}
