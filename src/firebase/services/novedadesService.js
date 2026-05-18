import {
  doc, getDoc, setDoc, getDocs, query,
  collection, where, orderBy, limit, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/firebase/firestore'

export const DEFAULT_CONFIG = {
  campaign: {
    badge:      '✦ Novedades',
    title:      'Lo más nuevo ha llegado',
    subtitle:   'Descubre nuestros últimos productos y tendencias de belleza, elegidos especialmente para ti.',
    ctaText:    'Explorar catálogo',
    ctaLink:    '/catalogo',
    coverImage: '',
    bgColor:    '#f5eaf0',
  },
  sections: {
    newProducts:    true,
    pinnedProducts: true,
    blog:           true,
    gallery:        true,
  },
  newProductsCount: 8,
  pinnedProductIds: [],
}

export const novedadesService = {
  async getConfig() {
    const snap = await getDoc(doc(db, 'novedadesConfig', 'main'))
    if (!snap.exists()) {
      return {
        ...DEFAULT_CONFIG,
        campaign:         { ...DEFAULT_CONFIG.campaign },
        sections:         { ...DEFAULT_CONFIG.sections },
        pinnedProductIds: [],
      }
    }
    const data = snap.data()
    return {
      ...DEFAULT_CONFIG,
      ...data,
      campaign:         { ...DEFAULT_CONFIG.campaign,  ...(data.campaign  ?? {}) },
      sections:         { ...DEFAULT_CONFIG.sections,  ...(data.sections  ?? {}) },
      pinnedProductIds: data.pinnedProductIds ?? [],
    }
  },

  async saveConfig(data) {
    return setDoc(doc(db, 'novedadesConfig', 'main'), {
      ...data,
      updatedAt: serverTimestamp(),
    }, { merge: true })
  },

  async getNewestProducts(count = 8) {
    const snap = await getDocs(
      query(
        collection(db, 'products'),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        limit(count)
      )
    )
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  },

  async getAllProducts() {
    const snap = await getDocs(
      query(collection(db, 'products'), orderBy('title', 'asc'))
    )
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  },

  async getProductsByIds(ids) {
    if (!ids?.length) return []
    const snaps = await Promise.all(ids.map(id => getDoc(doc(db, 'products', id))))
    return snaps
      .filter(s => s.exists())
      .map(s => ({ id: s.id, ...s.data() }))
      .filter(p => p.status === 'published')
  },

  async getGalleryImages(count = 6) {
    try {
      const snap = await getDocs(
        query(collection(db, 'gallery'), orderBy('order', 'asc'), limit(count))
      )
      if (!snap.empty) return snap.docs.map(d => ({ id: d.id, ...d.data() }))
      const fallback = await getDocs(query(collection(db, 'gallery'), limit(count)))
      return fallback.docs.map(d => ({ id: d.id, ...d.data() }))
    } catch {
      return []
    }
  },
}
