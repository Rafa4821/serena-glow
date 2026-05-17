import { createContext, useContext, useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase/firestore'

const SiteSettingsContext = createContext(null)

const DEFAULTS = {
  siteName: 'Serena Glow',
  tagline: 'Belleza que te define.',
  footerText: '© 2025 Serena Glow. Todos los derechos reservados.',
  logoUrl: '',
  logoPath: '',
  heroTitle: 'Tu ritual de belleza,\nelevado.',
  heroSubtitle: 'Cosméticos, perfumes, body care y trajes de baño pensados para vos.',
  heroCta: 'Explorar colección',
  heroSecondCta: 'Conocer más',
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER ?? '',
  whatsappMessage: '¡Hola! Me gustaría consultar sobre los productos de Serena Glow.',
  email: '', phone: '', address: '', openingHours: '',
  instagramUrl: '', instagram: '',
  facebookUrl: '', tiktokUrl: '', youtubeUrl: '', pinterestUrl: '',
  currency: '$', showPrices: true, productsPerPage: 12,
  freeShippingFrom: null, stockAlertThreshold: 3,
  catalogTitle: '', catalogSubtitle: '',
  metaTitle: '', metaDescription: '', ogImageUrl: '', googleAnalyticsId: '',
  shippingInfo: '', returnPolicy: '', termsUrl: '', privacyUrl: '',
  maintenanceMode: false, maintenanceMessage: 'Estamos trabajando para vos. Volvemos pronto.',
}

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const ref = doc(db, 'siteConfig', 'main')
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setSettings({ ...DEFAULTS, ...snap.data() })
      }
      setLoading(false)
    }, () => {
      setLoading(false)
    })
    return unsub
  }, [])

  return (
    <SiteSettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext)
  if (!ctx) throw new Error('useSiteSettings must be used inside <SiteSettingsProvider>')
  return ctx
}
