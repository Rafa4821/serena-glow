import { Link } from 'react-router-dom'
import PublicLayout from '@/shared/components/PublicLayout'
import { useSiteSettings } from '@/app/providers/SiteSettingsProvider'
import styles from './NosotrasPage.module.css'

const VALUES = [
  {
    icon: <DiamondIcon />,
    title: 'Autenticidad',
    text: 'Creemos en esa belleza auténtica que aparece cuando una mujer se siente cuidada, segura y conectada consigo misma.',
  },
  {
    icon: <HeartIcon />,
    title: 'Confianza',
    text: 'Queremos ser un rincón de calma donde cada mujer pueda sentirse cómoda siendo ella misma.',
  },
  {
    icon: <FlowerIcon />,
    title: 'Feminidad',
    text: 'Celebramos la delicadeza, la esencia y la manera única de brillar de cada mujer.',
  },
  {
    icon: <StarIcon />,
    title: 'Comunidad',
    text: 'Más que vender productos, buscamos construir una comunidad donde cada mujer exprese su belleza a su manera.',
  },
]

export default function NosotrasPage() {
  const { settings } = useSiteSettings()
  const waNumber  = settings.whatsappNumber  ?? ''
  const waMessage = settings.whatsappMessage ?? 'Hola, quiero saber más sobre Serena Glow'
  const waUrl     = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}` : null
  const igUrl     = settings.instagram ?? settings.instagramUrl ?? null
  const fbUrl     = settings.facebookUrl ?? null

  return (
    <PublicLayout>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <span className="label-caps">¿Quiénes somos?</span>
          <h1 className={styles.heroTitle}>
            Serena <em className={styles.heroEmphasis}>Glow</em>
          </h1>
          <p className={styles.heroText}>
            Un espacio pensado para mujeres que desean reconectar con su esencia,
            su feminidad y su bienestar a través de la belleza.
          </p>
        </div>
        <div className={styles.heroDecor} aria-hidden="true"><span>S</span></div>
      </section>

      {/* ── Quiénes somos ── */}
      <section className={`section-padding ${styles.story}`}>
        <div className="container">
          <div className={styles.storyGrid}>
            <div className={styles.storyText}>
              <h2 className={styles.sectionTitle}>Más que una tienda</h2>
              <p>
                Serena Glow nace como un espacio pensado para mujeres que desean reconectar
                con su esencia, su feminidad y su bienestar a través de la belleza.
              </p>
              <p>
                Más que una tienda, queremos ser un rincón de calma y confianza donde cada
                mujer pueda sentirse cómoda siendo ella misma, descubriendo productos que se
                adapten a su estilo, su personalidad y su manera única de brillar.
              </p>
              <p>
                En Serena Glow no creemos en una belleza exagerada o forzada. Creemos en esa
                belleza auténtica que aparece cuando una mujer se siente cuidada, segura y
                conectada consigo misma.
              </p>
              <p>
                Por eso, cada detalle está pensado para crear pequeños momentos donde cada
                mujer pueda reconectar con su confianza, su delicadeza y su esencia,
                sintiéndose más segura, más femenina y más ella.
              </p>
            </div>
            <div className={styles.storyVisual}>
              <div className={styles.storyCard}>
                <div className={styles.storyCardInner}>
                  <span className={styles.storyCardNum}>+500</span>
                  <span className={styles.storyCardLabel}>Mujeres acompañadas</span>
                </div>
              </div>
              <div className={`${styles.storyCard} ${styles.storyCardAlt}`}>
                <div className={styles.storyCardInner}>
                  <span className={styles.storyCardNum}>100%</span>
                  <span className={styles.storyCardLabel}>Productos originales</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Misión & Visión ── */}
      <section className={`section-padding ${styles.mvSection}`}>
        <div className="container">
          <div className={styles.mvGrid}>
            <div className={styles.mvCard}>
              <span className={styles.mvIcon} aria-hidden="true"><TargetIcon /></span>
              <h2 className={styles.mvTitle}>Misión</h2>
              <p className={styles.mvText}>
                Ofrecer una experiencia de belleza femenina, cercana y auténtica a través de
                una selección cuidadosamente curada de productos de distintas marcas, pensados
                para adaptarse a diferentes estilos, gustos y necesidades.
              </p>
              <p className={styles.mvText}>
                Queremos que cada mujer encuentre en Serena Glow un espacio donde pueda
                sentirse acompañada, inspirada y en confianza, descubriendo productos que la
                hagan sentir cómoda, segura y conectada con su esencia de manera natural y personal.
              </p>
            </div>

            <div className={styles.mvCard}>
              <span className={styles.mvIcon} aria-hidden="true"><VisionIcon /></span>
              <h2 className={styles.mvTitle}>Visión</h2>
              <p className={styles.mvText}>
                Convertirnos en una tienda referente de belleza femenina en Venezuela,
                reconocida por ofrecer una experiencia cercana, estética y auténtica, donde
                las mujeres puedan encontrar productos de calidad adaptados a distintos
                gustos, necesidades y presupuestos.
              </p>
              <p className={styles.mvText}>
                Aspiramos a ser una plataforma confiable dentro del mundo beauty, construyendo
                una comunidad donde la belleza se viva desde la autenticidad, el bienestar y
                la confianza personal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Valores ── */}
      <section className={`section-padding ${styles.values}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <span className="label-caps">Lo que nos define</span>
            <h2 className={styles.sectionTitle}>Nuestros valores</h2>
          </div>
          <div className={styles.valuesGrid}>
            {VALUES.map(v => (
              <div key={v.title} className={styles.valueCard}>
                <span className={styles.valueIcon} aria-hidden="true">{v.icon}</span>
                <h3 className={styles.valueTitle}>{v.title}</h3>
                <p className={styles.valueText}>{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={`section-padding ${styles.cta}`}>
        <div className="container">
          <div className={styles.ctaBox}>
            <h2 className={styles.ctaTitle}>¿Lista para descubrir tu belleza?</h2>
            <p className={styles.ctaText}>
              Explorá nuestra colección o escribinos directamente — te asesoramos con gusto.
            </p>
            <div className={styles.ctaActions}>
              <Link to="/catalogo" className={styles.btnPrimary}>Ver catálogo</Link>
              {waUrl && (
                <a href={waUrl} target="_blank" rel="noopener noreferrer" className={styles.btnWa}>
                  <WaIcon /> Escribinos
                </a>
              )}
            </div>

            {/* Socials */}
            {(igUrl || fbUrl) && (
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
              </div>
            )}
          </div>
        </div>
      </section>

    </PublicLayout>
  )
}

/* ── Icons ───────────────────────────────────────────────────── */
function DiamondIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 22 12 12 22 2 12"/></svg>
}
function HeartIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
}
function FlowerIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2a4 4 0 0 1 0 8 4 4 0 0 1 0-8zm0 12a4 4 0 0 1 0 8 4 4 0 0 1 0-8zM2 12a4 4 0 0 1 8 0 4 4 0 0 1-8 0zm12 0a4 4 0 0 1 8 0 4 4 0 0 1-8 0z"/></svg>
}
function StarIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
}
function TargetIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
}
function VisionIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
}
function WaIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
}
function IgIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
}
function FbIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
}
