import { useState } from 'react'
import { inquiryService } from '@/firebase/services/inquiryService'
import { useSiteSettings } from '@/app/providers/SiteSettingsProvider'
import PublicLayout from '@/shared/components/PublicLayout'
import { showToast } from '@/shared/components/ui/Toast'
import styles from './ContactPage.module.css'

const EMPTY_FORM   = { name: '', email: '', phone: '', message: '' }
const EMPTY_ERRORS = { name: '', email: '', message: '' }

function validate(form) {
  const errors = { ...EMPTY_ERRORS }
  if (!form.name.trim())           errors.name    = 'El nombre es obligatorio.'
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                                   errors.email   = 'Ingresá un email válido.'
  if (!form.message.trim())        errors.message = 'El mensaje no puede estar vacío.'
  return errors
}

function hasErrors(errors) {
  return Object.values(errors).some(Boolean)
}

export default function ContactPage() {
  const { settings } = useSiteSettings()
  const [form,    setForm]    = useState(EMPTY_FORM)
  const [errors,  setErrors]  = useState(EMPTY_ERRORS)
  const [sending, setSending] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [apiErr,  setApiErr]  = useState('')

  const waNumber  = settings.whatsappNumber ?? ''
  const waMessage = settings.whatsappMessage ?? '¡Hola! Quiero hacer una consulta sobre los productos de Serena Glow.'
  const waHref    = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}` : null
  const igUrl     = settings.instagram ?? settings.instagramUrl ?? null
  const fbUrl     = settings.facebookUrl ?? null
  const tkUrl     = settings.tiktokUrl ?? null

  function handleChange(e) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (errors[name]) setErrors(er => ({ ...er, [name]: '' }))
    if (apiErr)       setApiErr('')
  }

  function handleBlur(e) {
    const partial = validate({ ...form, [e.target.name]: e.target.value })
    setErrors(er => ({ ...er, [e.target.name]: partial[e.target.name] }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate(form)
    if (hasErrors(errs)) { setErrors(errs); return }

    setSending(true)
    setApiErr('')
    try {
      await inquiryService.create(form)
      setSent(true)
      setForm(EMPTY_FORM)
      setErrors(EMPTY_ERRORS)
      showToast('¡Mensaje enviado! Te responderemos pronto.', 'success')
    } catch {
      const msg = 'No pudimos enviar tu mensaje. Intentalo de nuevo o escríbenos por WhatsApp.'
      setApiErr(msg)
      showToast(msg, 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <PublicLayout>
      <div className={styles.page}>

        {/* Header */}
        <div className={styles.header}>
          <div className="container">
            <span className="label-caps">Contacto</span>
            <h1 className={styles.title}>Hablemos</h1>
            <p className={styles.subtitle}>
              Consultá por nuestros productos, precios o cualquier duda que tengas.
            </p>
          </div>
        </div>

        <div className={`container ${styles.content}`}>
          <div className={styles.grid}>

            {/* ─ Form column ─ */}
            <div className={styles.formCol}>
              {sent ? (
                <div className={styles.successState}>
                  <div className={styles.successIcon}>
                    <CheckIcon />
                  </div>
                  <h3>¡Gracias por escribirnos!</h3>
                  <p>Tu mensaje fue recibido. Te responderemos a la brevedad.</p>
                  <button className={styles.resetBtn} onClick={() => setSent(false)}>
                    Enviar otro mensaje
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className={styles.form} noValidate>
                  <div className={styles.field}>
                    <label htmlFor="name" className={styles.label}>Nombre *</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                      placeholder="Tu nombre"
                      autoComplete="name"
                    />
                    {errors.name && <span className={styles.fieldError}>{errors.name}</span>}
                  </div>

                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label htmlFor="email" className={styles.label}>Email</label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                        placeholder="tu@email.com"
                        autoComplete="email"
                      />
                      {errors.email && <span className={styles.fieldError}>{errors.email}</span>}
                    </div>
                    <div className={styles.field}>
                      <label htmlFor="phone" className={styles.label}>Teléfono</label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={form.phone}
                        onChange={handleChange}
                        className={styles.input}
                        placeholder="+58 424 000 0000"
                        autoComplete="tel"
                      />
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label htmlFor="message" className={styles.label}>Mensaje *</label>
                    <textarea
                      id="message"
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      rows={5}
                      className={`${styles.textarea} ${errors.message ? styles.inputError : ''}`}
                      placeholder="¿En qué te podemos ayudar?"
                    />
                    {errors.message && <span className={styles.fieldError}>{errors.message}</span>}
                  </div>

                  {apiErr && (
                    <div className={styles.apiError} role="alert">{apiErr}</div>
                  )}

                  <button
                    type="submit"
                    disabled={sending}
                    className={styles.submitBtn}
                    aria-busy={sending}
                  >
                    {sending ? (
                      <><SpinnerIcon /> Enviando…</>
                    ) : (
                      'Enviar mensaje'
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* ─ Info column ─ */}
            <aside className={styles.infoCol}>
              {waHref && (
                <>
                  <h2 className={styles.infoTitle}>¿Preferís WhatsApp?</h2>
                  <p className={styles.infoText}>
                    Respondemos rápido. Consultá por productos, precios y disponibilidad directamente.
                  </p>
                  <a href={waHref} target="_blank" rel="noopener noreferrer" className={styles.waBtn}>
                    <WaIcon /> Escribirnos por WhatsApp
                  </a>
                  <hr className={styles.divider} />
                </>
              )}

              {/* Contact details */}
              <div className={styles.contactDetails}>
                {settings.phone && (
                  <div className={styles.contactItem}>
                    <span className={styles.contactLabel}>Teléfono</span>
                    <a href={`tel:${settings.phone}`} className={styles.contactValue}>{settings.phone}</a>
                  </div>
                )}
                {settings.email && (
                  <div className={styles.contactItem}>
                    <span className={styles.contactLabel}>Email</span>
                    <a href={`mailto:${settings.email}`} className={styles.contactValue}>{settings.email}</a>
                  </div>
                )}
                {settings.address && (
                  <div className={styles.contactItem}>
                    <span className={styles.contactLabel}>Ubicación</span>
                    <span className={styles.contactValue}>{settings.address}</span>
                  </div>
                )}
              </div>

              {/* Social links */}
              {(igUrl || fbUrl || tkUrl) && (
                <div className={styles.socialsBlock}>
                  <p className={styles.socialsTitle}>Seguínos en redes</p>
                  <div className={styles.socials}>
                    {igUrl && (
                      <a href={igUrl} target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Instagram">
                        <IgIcon />
                      </a>
                    )}
                    {fbUrl && (
                      <a href={fbUrl} target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Facebook">
                        <FbIcon />
                      </a>
                    )}
                    {tkUrl && (
                      <a href={tkUrl} target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="TikTok">
                        <TkIcon />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </aside>

          </div>
        </div>
      </div>
    </PublicLayout>
  )
}

/* ── Icons ───────────────────────────────────────────────────── */
function CheckIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
}
function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={styles.spinner}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  )
}
function WaIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
}
function IgIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
}
function FbIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
}
function TkIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9.41a8.16 8.16 0 0 0 4.77 1.52V7.49a4.85 4.85 0 0 1-1.01-.8z"/></svg>
}
