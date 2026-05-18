import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, orderBy, limit,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/firebase/firestore'

const COL = 'blogPosts'

export const BLOG_STATUS = {
  DRAFT:     'draft',
  PUBLISHED: 'published',
  ARCHIVED:  'archived',
}

export const BLOG_CATEGORIES = [
  'Cuidado de la piel',
  'Maquillaje',
  'Tutoriales',
  'Lifestyle',
  'Novedades',
]

export const blogService = {
  async create(data) {
    return addDoc(collection(db, COL), {
      ...data,
      publishedAt: data.status === BLOG_STATUS.PUBLISHED ? serverTimestamp() : null,
      views:       0,
      createdAt:   serverTimestamp(),
      updatedAt:   serverTimestamp(),
    })
  },

  async update(id, data, wasPublished = false) {
    const updates = { ...data, updatedAt: serverTimestamp() }
    if (data.status === BLOG_STATUS.PUBLISHED && !wasPublished) {
      updates.publishedAt = serverTimestamp()
    }
    return updateDoc(doc(db, COL, id), updates)
  },

  async delete(id) {
    return deleteDoc(doc(db, COL, id))
  },

  async getAll() {
    const snap = await getDocs(query(collection(db, COL), orderBy('createdAt', 'desc')))
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  },

  async getPublished() {
    const snap = await getDocs(
      query(collection(db, COL), where('status', '==', BLOG_STATUS.PUBLISHED), orderBy('publishedAt', 'desc'))
    )
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  },

  async getBySlug(slug) {
    const snap = await getDocs(query(collection(db, COL), where('slug', '==', slug), limit(1)))
    if (snap.empty) return null
    return { id: snap.docs[0].id, ...snap.docs[0].data() }
  },

  async getById(id) {
    const snap = await getDoc(doc(db, COL, id))
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() }
  },

  async getRelated(category, excludeId, max = 3) {
    const snap = await getDocs(
      query(collection(db, COL),
        where('status',   '==', BLOG_STATUS.PUBLISHED),
        where('category', '==', category),
        orderBy('publishedAt', 'desc'),
        limit(max + 1)
      )
    )
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(p => p.id !== excludeId)
      .slice(0, max)
  },

  async incrementViews(id) {
    const ref  = doc(db, COL, id)
    const snap = await getDoc(ref)
    if (snap.exists()) await updateDoc(ref, { views: (snap.data().views ?? 0) + 1 })
  },
}
