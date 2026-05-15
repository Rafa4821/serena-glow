/**
 * firebaseClient.js
 *
 * Single entry-point for the entire Firebase layer.
 * Import everything Firebase-related from here instead of the individual files.
 *
 * Usage:
 *   import { db, auth, storage }    from '@/firebase/firebaseClient'
 *   import { productService }       from '@/firebase/firebaseClient'
 *   import { INQUIRY_STATUS }       from '@/firebase/firebaseClient'
 */

// ─── Core singletons ────────────────────────────────────────────────────────
export { default as app }     from './config'
export { auth }               from './auth'
export { db }                 from './firestore'
export { storage }            from './storage'
export { initAppCheck }       from './appCheck'

// ─── Services ───────────────────────────────────────────────────────────────
export { productService }             from './services/productService'
export { categoryService }            from './services/categoryService'
export { bannerService }              from './services/bannerService'
export { galleryService }             from './services/galleryService'
export { inquiryService, INQUIRY_STATUS } from './services/inquiryService'
export { mediaService }               from './services/mediaService'
export { siteConfigService }          from './services/siteConfigService'
export { auditLogService, AUDIT_ACTION } from './services/auditLogService'
