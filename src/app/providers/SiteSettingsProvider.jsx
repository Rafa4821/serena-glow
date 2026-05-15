import { createContext, useContext, useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase/firestore'

const SiteSettingsContext = createContext(null)

const DEFAULTS = {
  siteName: 'Serena Glow',
  tagline: 'Belleza que te define.',
  heroTitle: 'Tu ritual de belleza,\nelevado.',
  heroSubtitle: 'Cosméticos, perfumes, body care y trajes de baño pensados para vos.',
  heroCta: 'Explorar colección',
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER ?? '',
  whatsappMessage: '¡Hola! Me gustaría consultar sobre los productos de Serena Glow.',
  instagramUrl: '',
  instagram:    '',
  facebookUrl: '',
  tiktokUrl:   '',
  email:       '',
  phone:       '',
  address:     '',
  footerText:  '© 2025 Serena Glow. Todos los derechos reservados.',
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
