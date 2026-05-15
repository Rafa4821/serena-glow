import {
  collection, doc, query, where, orderBy, limit,
  startAfter, getDocs, getDoc, addDoc, updateDoc,
  deleteDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firestore'

const COL = 'products'

export const productService = {
  /** Fetch paginated published products, optionally filtered by category */
  async getPublished({ categorySlug = null, pageSize = 24, lastDoc = null } = {}) {
    let q = query(
      collection(db, COL),
      where('status', '==', 'published'),
      orderBy('order', 'asc'),
      limit(pageSize),
    )
    if (categorySlug) q = query(q, where('categorySlug', '==', categorySlug))
    if (lastDoc)      q = query(q, startAfter(lastDoc))
    const snap = await getDocs(q)
    return {
      items:   snap.docs.map(d => ({ id: d.id, ...d.data() })),
      lastDoc: snap.docs[snap.docs.length - 1] ?? null,
      hasMore: snap.docs.length === pageSize,
    }
  },

  /** Fetch featured published products for the home page */
  async getFeatured(max = 8) {
    const q = query(
      collection(db, COL),
      where('status', '==', 'published'),
      where('featured', '==', true),
      orderBy('order', 'asc'),
      limit(max),
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  },

  /** Get a single product by slug */
  async getBySlug(slug) {
    const q = query(collection(db, COL), where('slug', '==', slug), limit(1))
    const snap = await getDocs(q)
    if (snap.empty) return null
    return { id: snap.docs[0].id, ...snap.docs[0].data() }
  },

  /** Get a single product by id */
  async getById(id) {
    const snap = await getDoc(doc(db, COL, id))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
  },

  /** Admin: create product */
  async create(data) {
    return addDoc(collection(db, COL), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  },

  /** Admin: update product */
  async update(id, data) {
    return updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() })
  },

  /** Admin: delete product (caller must clean storage first) */
  async delete(id) {
    return deleteDoc(doc(db, COL, id))
  },

  /** Admin: get all products (no status filter) */
  async getAll() {
    const q    = query(collection(db, COL), orderBy('order', 'asc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  },
}
