import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'
import app from './config'

let appCheckInstance = null

export function initAppCheck() {
  if (appCheckInstance) return appCheckInstance

  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY

  if (!siteKey) {
    console.warn('[AppCheck] VITE_RECAPTCHA_SITE_KEY not set. App Check disabled.')
    return null
  }

  if (import.meta.env.DEV) {
    console.info('[AppCheck] Skipped in development mode.')
    return null
  }

  try {
    appCheckInstance = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    })
    return appCheckInstance
  } catch (err) {
    console.error('[AppCheck] Initialization error:', err)
    return null
  }
}
