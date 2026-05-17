import { useSiteSettings } from '@/app/providers/SiteSettingsProvider'
import BannerBlock from '@/shared/components/BannerBlock/BannerBlock'

const DEFAULT_BUTTONS = [
  { text: 'Ver catálogo', link: '/catalogo', style: 'primary'   },
  { text: 'Conocer más',  link: '/nosotras', style: 'secondary' },
]

export default function Hero({ banner }) {
  const { settings } = useSiteSettings()
  const waHref = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(settings.whatsappMessage ?? 'Hola Serena Glow!')}`

  const resolved = {
    title:    banner?.title    ?? 'Belleza que resalta\ntu esencia',
    subtitle: banner?.subtitle ?? 'Descubre nuestra selección de cosméticos, perfumes, cremas corporales y trajes de baño pensados para ti.',
    label:    banner?.label    ?? 'Nueva colección',
    imageUrl: banner?.imageUrl ?? null,
    buttons:  banner?.buttons?.length > 0 ? banner.buttons : DEFAULT_BUTTONS,
    contentAlign:   banner?.contentAlign   ?? 'left',
    textColor:      banner?.textColor      ?? 'light',
    overlayOpacity: banner?.overlayOpacity ?? 0.3,
  }

  return (
    <BannerBlock
      banner={resolved}
      isHero
      waHref={waHref}
      showScrollHint
    />
  )
}
