import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase/firestore'
import ImageUploader from '../shared/components/ImageUploader'
import LinkPicker from '../shared/components/LinkPicker'
import { showToast } from '@/shared/components/ui/Toast'
import adminStyles from '../admin.module.css'
import styles from './BannersPage.module.css'

const SLOTS = [
  { id: 'hero',            label: 'Hero — Inicio (principal)',     page: 'Inicio',   defaultHeight: '100vh' },
  { id: 'home-mid',        label: 'Sección media — Inicio',        page: 'Inicio',   defaultHeight: '50vh'  },
  { id: 'home-pre-footer', label: 'Pre-footer — Inicio',           page: 'Inicio',   defaultHeight: '40vh'  },
  { id: 'catalog-top',     label: 'Banner superior — Catálogo',    page: 'Catálogo', defaultHeight: '50vh'  },
]

const HEIGHT_OPTIONS = ['100vh', '70vh', '50vh', '40vh']
const ALIGN_OPTIONS  = [{ value: 'left', label: 'Izquierda' }, { value: 'center', label: 'Centro' }, { value: 'right', label: 'Derecha' }]
const COLOR_OPTIONS  = [{ value: 'light', label: 'Claro' }, { value: 'dark', label: 'Oscuro' }]

const EMPTY_BUTTON = { text: '', link: '', style: 'primary' }
const EMPTY_SLIDE  = { imageUrl: '', imagePath: '', label: '', title: '', subtitle: '', buttons: [] }

const TYPE_OPTIONS = [
  { value: 'image',    label: 'Imagen' },
  { value: 'video',   label: 'Video (YouTube / mp4)' },
  { value: 'carousel', label: 'Carousel de imágenes' },
]

function getDefault(slot) {
  return {
    type: 'image',
    label: '', title: '', subtitle: '',
    buttons: [],
    imageUrl: '', imagePath: '',
    videoUrl: '',
    slides: [],
    autoplay: true, autoplayInterval: 5, showArrows: true, showDots: true,
    minHeight: slot.defaultHeight,
    contentAlign: 'left',
    textColor: 'light',
    overlayOpacity: 0.3,
    active: true,
  }
}

export default function BannersPage() {
  const [data,    setData]    = useState({})
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(null)

  useEffect(() => {
    async function fetch() {
      const snaps = await Promise.all(SLOTS.map(s => getDoc(doc(db, 'banners', s.id)).catch(() => null)))
      const result = {}
      SLOTS.forEach((s, i) => {
        result[s.id] = snaps[i]?.exists()
          ? { active: true, ...snaps[i].data() }
          : getDefault(s)
      })
      setData(result)
      setLoading(false)
    }
    fetch()
  }, [])

  function setField(slotId, key, value) {
    setData(d => ({ ...d, [slotId]: { ...d[slotId], [key]: value } }))
  }

  function addButton(slotId) {
    const btns = [...(data[slotId]?.buttons ?? []), { ...EMPTY_BUTTON }]
    setField(slotId, 'buttons', btns)
  }

  function updateButton(slotId, i, key, value) {
    const btns = [...(data[slotId]?.buttons ?? [])]
    btns[i] = { ...btns[i], [key]: value }
    setField(slotId, 'buttons', btns)
  }

  function removeButton(slotId, i) {
    const btns = (data[slotId]?.buttons ?? []).filter((_, idx) => idx !== i)
    setField(slotId, 'buttons', btns)
  }

  function addSlide(slotId) {
    const slides = [...(data[slotId]?.slides ?? []), { ...EMPTY_SLIDE }]
    setField(slotId, 'slides', slides)
  }

  function updateSlide(slotId, i, key, value) {
    const slides = [...(data[slotId]?.slides ?? [])]
    slides[i] = { ...slides[i], [key]: value }
    setField(slotId, 'slides', slides)
  }

  function removeSlide(slotId, i) {
    const slides = (data[slotId]?.slides ?? []).filter((_, idx) => idx !== i)
    setField(slotId, 'slides', slides)
  }

  function moveSlide(slotId, i, dir) {
    const slides = [...(data[slotId]?.slides ?? [])]
    const j = i + dir
    if (j < 0 || j >= slides.length) return
    ;[slides[i], slides[j]] = [slides[j], slides[i]]
    setField(slotId, 'slides', slides)
  }

  async function handleSave(slotId) {
    setSaving(slotId)
    try {
      await setDoc(doc(db, 'banners', slotId), {
        ...data[slotId],
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
          <p className={adminStyles.pageSub}>Administrá los banners del sitio por sección</p>
        </div>
      </div>

      <div className={styles.bannerList}>
        {SLOTS.map(slot => {
          const d    = data[slot.id] ?? getDefault(slot)
          const btns = d.buttons ?? []

          const type = d.type ?? 'image'

          return (
            <div key={slot.id} className={styles.bannerCard}>

              {/* ── Card header ── */}
              <div className={styles.cardHeader}>
                <div>
                  <h2 className={styles.bannerTitle}>{slot.label}</h2>
                  <span className={styles.pageBadge}>{slot.page}</span>
                </div>
                <label className={styles.toggleLabel}>
                  <input
                    type="checkbox"
                    checked={!!d.active}
                    onChange={e => setField(slot.id, 'active', e.target.checked)}
                    className={styles.toggleInput}
                  />
                  <span className={styles.toggleTrack}>
                    <span className={styles.toggleThumb} />
                  </span>
                  <span className={styles.toggleText}>{d.active ? 'Activo' : 'Inactivo'}</span>
                </label>
              </div>

              {/* ── Type selector ── */}
              <div className={styles.typeRow}>
                <span className={styles.typeLabel}>Tipo de banner</span>
                {TYPE_OPTIONS.map(opt => (
                  <label key={opt.value} className={styles.typeOption}>
                    <input
                      type="radio"
                      name={`type-${slot.id}`}
                      value={opt.value}
                      checked={type === opt.value}
                      onChange={() => setField(slot.id, 'type', opt.value)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>

              <div className={adminStyles.formGrid}>
                {/* ── Left column: content ── */}
                <div className={adminStyles.formCol}>

                  {/* ── Video URL ── */}
                  {type === 'video' && (
                    <div className={adminStyles.field}>
                      <label className={adminStyles.label}>URL del Video</label>
                      <input
                        type="text"
                        value={d.videoUrl ?? ''}
                        onChange={e => setField(slot.id, 'videoUrl', e.target.value)}
                        className={adminStyles.input}
                        placeholder="https://youtube.com/watch?v=... o URL directa .mp4"
                      />
                      <span className={styles.hint}>La imagen de fondo actúa como poster/fallback si el video no carga.</span>
                    </div>
                  )}

                  {/* ── Image / Video: label + title + subtitle + buttons ── */}
                  {type !== 'carousel' && (
                    <>
                      <div className={adminStyles.field}>
                        <label className={adminStyles.label}>Etiqueta (sobre el título)</label>
                        <input
                          type="text"
                          value={d.label ?? ''}
                          onChange={e => setField(slot.id, 'label', e.target.value)}
                          className={adminStyles.input}
                          placeholder="Nueva colección"
                        />
                      </div>

                      <div className={adminStyles.field}>
                        <label className={adminStyles.label}>Título</label>
                        <textarea
                          value={d.title ?? ''}
                          onChange={e => setField(slot.id, 'title', e.target.value)}
                          rows={3}
                          className={adminStyles.textarea}
                          placeholder={'Belleza que resalta\ntu esencia'}
                        />
                        <span className={styles.hint}>Salto de línea con Enter. La última palabra de cada línea aparece en cursiva.</span>
                      </div>

                      <div className={adminStyles.field}>
                        <label className={adminStyles.label}>Subtítulo</label>
                        <textarea
                          value={d.subtitle ?? ''}
                          onChange={e => setField(slot.id, 'subtitle', e.target.value)}
                          rows={2}
                          className={adminStyles.textarea}
                          placeholder="Texto descriptivo…"
                        />
                      </div>

                      <div className={adminStyles.field}>
                        <label className={adminStyles.label}>Botones (máx. 3)</label>
                        <div className={styles.btnEditor}>
                          {btns.map((btn, i) => (
                            <div key={i} className={styles.btnRow}>
                              <input
                                type="text"
                                value={btn.text}
                                onChange={e => updateButton(slot.id, i, 'text', e.target.value)}
                                className={adminStyles.input}
                                placeholder="Texto"
                              />
                              <LinkPicker
                                value={btn.link}
                                onChange={v => updateButton(slot.id, i, 'link', v)}
                                className={adminStyles.select}
                              />
                              <select
                                value={btn.style}
                                onChange={e => updateButton(slot.id, i, 'style', e.target.value)}
                                className={`${adminStyles.select} ${styles.styleSelect}`}
                              >
                                <option value="primary">Principal</option>
                                <option value="secondary">Secundario</option>
                                <option value="outline">Outline</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => removeButton(slot.id, i)}
                                className={styles.btnRemove}
                                title="Eliminar botón"
                              >✕</button>
                            </div>
                          ))}
                          {btns.length < 3 && (
                            <button type="button" onClick={() => addButton(slot.id)} className={styles.btnAdd}>
                              + Agregar botón
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── Carousel slides ── */}
                  {type === 'carousel' && (
                    <div className={adminStyles.field}>
                      <label className={adminStyles.label}>Slides</label>
                      <div className={styles.slidesEditor}>
                        {(d.slides ?? []).map((slide, si) => (
                          <div key={si} className={styles.slideCard}>
                            <div className={styles.slideHeader}>
                              <span className={styles.slideNum}>Slide {si + 1}</span>
                              <div className={styles.slideMoveRow}>
                                <button type="button" onClick={() => moveSlide(slot.id, si, -1)} disabled={si === 0} className={styles.slideMoveBtn}>▲</button>
                                <button type="button" onClick={() => moveSlide(slot.id, si,  1)} disabled={si === (d.slides?.length ?? 0) - 1} className={styles.slideMoveBtn}>▼</button>
                                <button type="button" onClick={() => removeSlide(slot.id, si)} className={styles.btnRemove}>✕</button>
                              </div>
                            </div>
                            <div className={styles.slideBody}>
                              <ImageUploader
                                label="Imagen"
                                folder="banners"
                                value={slide.imageUrl || null}
                                storagePath={slide.imagePath || null}
                                onChange={r => {
                                  updateSlide(slot.id, si, 'imageUrl',  r?.url  ?? '')
                                  updateSlide(slot.id, si, 'imagePath', r?.path ?? '')
                                }}
                              />
                              <div className={adminStyles.field}>
                                <label className={adminStyles.label}>Título</label>
                                <input type="text" value={slide.title ?? ''} onChange={e => updateSlide(slot.id, si, 'title', e.target.value)} className={adminStyles.input} placeholder="Título del slide" />
                              </div>
                              <div className={adminStyles.field}>
                                <label className={adminStyles.label}>Subtítulo</label>
                                <input type="text" value={slide.subtitle ?? ''} onChange={e => updateSlide(slot.id, si, 'subtitle', e.target.value)} className={adminStyles.input} placeholder="Texto descriptivo" />
                              </div>
                              <div className={adminStyles.field}>
                                <label className={adminStyles.label}>Botón</label>
                                <div className={styles.slideBtnRow}>
                                  <input type="text" value={slide.buttons?.[0]?.text ?? ''} onChange={e => updateSlide(slot.id, si, 'buttons', [{ ...(slide.buttons?.[0] ?? EMPTY_BUTTON), text: e.target.value }])} className={adminStyles.input} placeholder="Texto" />
                                  <LinkPicker value={slide.buttons?.[0]?.link ?? ''} onChange={v => updateSlide(slot.id, si, 'buttons', [{ ...(slide.buttons?.[0] ?? EMPTY_BUTTON), link: v }])} className={adminStyles.select} />
                                  <select value={slide.buttons?.[0]?.style ?? 'primary'} onChange={e => updateSlide(slot.id, si, 'buttons', [{ ...(slide.buttons?.[0] ?? EMPTY_BUTTON), style: e.target.value }])} className={`${adminStyles.select} ${styles.styleSelect}`}>
                                    <option value="primary">Principal</option>
                                    <option value="secondary">Secundario</option>
                                    <option value="outline">Outline</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button type="button" onClick={() => addSlide(slot.id)} className={styles.btnAdd}>+ Agregar slide</button>
                      </div>

                      <div className={styles.carouselOpts}>
                        <label className={adminStyles.checkLabel}>
                          <input type="checkbox" checked={!!d.autoplay} onChange={e => setField(slot.id, 'autoplay', e.target.checked)} />
                          Autoplay
                        </label>
                        {d.autoplay && (
                          <div className={styles.intervalRow}>
                            <span>Intervalo:</span>
                            <input
                              type="number" min="2" max="30"
                              value={d.autoplayInterval ?? 5}
                              onChange={e => setField(slot.id, 'autoplayInterval', parseInt(e.target.value))}
                              className={`${adminStyles.input} ${styles.intervalInput}`}
                            />
                            <span>seg</span>
                          </div>
                        )}
                        <label className={adminStyles.checkLabel}>
                          <input type="checkbox" checked={d.showArrows !== false} onChange={e => setField(slot.id, 'showArrows', e.target.checked)} />
                          Mostrar flechas
                        </label>
                        <label className={adminStyles.checkLabel}>
                          <input type="checkbox" checked={d.showDots !== false} onChange={e => setField(slot.id, 'showDots', e.target.checked)} />
                          Mostrar puntos de navegación
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Right column: image + style ── */}
                <div className={adminStyles.formCol}>
                  <ImageUploader
                    label="Imagen de fondo"
                    folder="banners"
                    value={d.imageUrl || null}
                    storagePath={d.imagePath || null}
                    onChange={r => {
                      setField(slot.id, 'imageUrl',  r?.url  ?? '')
                      setField(slot.id, 'imagePath', r?.path ?? '')
                    }}
                  />

                  {/* ── Style controls ── */}
                  <div className={styles.styleSection}>
                    <p className={styles.styleTitle}>Estilo</p>

                    <div className={styles.styleRow}>
                      <span className={styles.styleLabel}>Altura</span>
                      <div className={styles.radioGroup}>
                        {HEIGHT_OPTIONS.map(h => (
                          <label key={h} className={styles.radioLabel}>
                            <input
                              type="radio"
                              name={`h-${slot.id}`}
                              value={h}
                              checked={(d.minHeight ?? slot.defaultHeight) === h}
                              onChange={() => setField(slot.id, 'minHeight', h)}
                            />
                            {h}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className={styles.styleRow}>
                      <span className={styles.styleLabel}>Alineación</span>
                      <div className={styles.radioGroup}>
                        {ALIGN_OPTIONS.map(o => (
                          <label key={o.value} className={styles.radioLabel}>
                            <input
                              type="radio"
                              name={`a-${slot.id}`}
                              value={o.value}
                              checked={(d.contentAlign ?? 'left') === o.value}
                              onChange={() => setField(slot.id, 'contentAlign', o.value)}
                            />
                            {o.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className={styles.styleRow}>
                      <span className={styles.styleLabel}>Texto</span>
                      <div className={styles.radioGroup}>
                        {COLOR_OPTIONS.map(o => (
                          <label key={o.value} className={styles.radioLabel}>
                            <input
                              type="radio"
                              name={`c-${slot.id}`}
                              value={o.value}
                              checked={(d.textColor ?? 'light') === o.value}
                              onChange={() => setField(slot.id, 'textColor', o.value)}
                            />
                            {o.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className={styles.styleRow}>
                      <span className={styles.styleLabel}>Overlay</span>
                      <div className={styles.sliderWrap}>
                        <input
                          type="range"
                          min="0"
                          max="0.8"
                          step="0.05"
                          value={d.overlayOpacity ?? 0.3}
                          onChange={e => setField(slot.id, 'overlayOpacity', parseFloat(e.target.value))}
                          className={styles.slider}
                        />
                        <span className={styles.sliderVal}>{Math.round((d.overlayOpacity ?? 0.3) * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.bannerFooter}>
                <button
                  className={adminStyles.btnPrimary}
                  onClick={() => handleSave(slot.id)}
                  disabled={saving === slot.id}
                >
                  {saving === slot.id ? 'Guardando…' : 'Guardar banner'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
