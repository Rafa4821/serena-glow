import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase/firestore'
import ImageUploader from '../shared/components/ImageUploader'
import { showToast } from '@/shared/components/ui/Toast'
import adminStyles from '../admin.module.css'
import styles from './BannersPage.module.css'

const BANNERS = [
  {
    id: 'hero',
    label: 'Banner Hero (inicio)',
    fields: [
      { key: 'title',    label: 'Título',   type: 'textarea', placeholder: 'Tu ritual de belleza,\nelevado.' },
      { key: 'subtitle', label: 'Subtítulo', type: 'text',     placeholder: 'Texto descriptivo…' },
      { key: 'cta',      label: 'Texto CTA', type: 'text',     placeholder: 'Explorar colección' },
    ],
  },
  {
    id: 'emotional',
    label: 'Banner Emocional',
    fields: [
      { key: 'title',    label: 'Título',    type: 'text', placeholder: 'Tu ritual de belleza comienza aquí.' },
      { key: 'subtitle', label: 'Subtítulo', type: 'textarea', placeholder: 'Texto descriptivo…' },
      { key: 'cta',      label: 'Texto CTA', type: 'text', placeholder: 'Descubrir ahora' },
      { key: 'ctaLink',  label: 'Link CTA',  type: 'text', placeholder: '/catalogo' },
    ],
  },
]

export default function BannersPage() {
  const [data,    setData]    = useState({})
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(null)

  useEffect(() => {
    async function fetchBanners() {
      const snaps = await Promise.all(BANNERS.map(b => getDoc(doc(db, 'banners', b.id))))
      const result = {}
      snaps.forEach((snap, i) => {
        result[BANNERS[i].id] = snap.exists() ? snap.data() : {}
      })
      setData(result)
      setLoading(false)
    }
    fetchBanners()
  }, [])

  function handleField(bannerId, key, value) {
    setData(d => ({ ...d, [bannerId]: { ...d[bannerId], [key]: value } }))
  }

  async function handleSave(bannerId) {
    setSaving(bannerId)
    try {
      await setDoc(doc(db, 'banners', bannerId), {
        ...data[bannerId],
        updatedAt: serverTimestamp(),
      }, { merge: true })
      showToast('Banner guardado.', 'success')
    } catch {
      showToast('Error al guardar.', 'error')
    } finally {
      setSaving(null)
    }
  }

  if (loading) return <div className={adminStyles.loadingRow}>Cargando…</div>

  return (
    <div>
      <div className={adminStyles.pageHeader}>
        <div>
          <h1 className={adminStyles.pageTitle}>Banners</h1>
          <p className={adminStyles.pageSub}>Editá los banners del sitio</p>
        </div>
      </div>

      <div className={styles.bannerList}>
        {BANNERS.map(banner => {
          const bannerData = data[banner.id] ?? {}
          return (
            <div key={banner.id} className={styles.bannerCard}>
              <h2 className={styles.bannerTitle}>{banner.label}</h2>

              <div className={adminStyles.formGrid}>
                <div className={adminStyles.formCol}>
                  {banner.fields.map(field => (
                    <div key={field.key} className={adminStyles.field}>
                      <label className={adminStyles.label}>{field.label}</label>
                      {field.type === 'textarea' ? (
                        <textarea
                          value={bannerData[field.key] ?? ''}
                          onChange={e => handleField(banner.id, field.key, e.target.value)}
                          rows={3}
                          className={adminStyles.textarea}
                          placeholder={field.placeholder}
                        />
                      ) : (
                        <input
                          type="text"
                          value={bannerData[field.key] ?? ''}
                          onChange={e => handleField(banner.id, field.key, e.target.value)}
                          className={adminStyles.input}
                          placeholder={field.placeholder}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className={adminStyles.formCol}>
                  <ImageUploader
                    label="Imagen de fondo"
                    folder="banners"
                    value={bannerData.imageUrl || null}
                    storagePath={bannerData.imagePath || null}
                    onChange={r => {
                      handleField(banner.id, 'imageUrl', r?.url ?? '')
                      handleField(banner.id, 'imagePath', r?.path ?? '')
                    }}
                  />
                </div>
              </div>

              <div className={styles.bannerFooter}>
                <button
                  className={adminStyles.btnPrimary}
                  onClick={() => handleSave(banner.id)}
                  disabled={saving === banner.id}
                >
                  {saving === banner.id ? 'Guardando…' : 'Guardar banner'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
