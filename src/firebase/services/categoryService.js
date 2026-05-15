import {
  collection, doc, query, where, orderBy,
  getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firestore'

const COL = 'categories'

export const categoryService = {
  async getActive() {
    const q    = query(collection(db, COL), where('active', '==', true), orderBy('order', 'asc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  },

  async getAll() {
    const q    = query(collection(db, COL), orderBy('order', 'asc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  },

  async getBySlug(slug) {
    const q    = query(collection(db, COL), where('slug', '==', slug))
    const snap = await getDocs(q)
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() }
  },

  async getById(id) {
    const snap = await getDoc(doc(db, COL, id))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
  },

  async create(data) {
    return addDoc(collection(db, COL), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  },

  async update(id, data) {
    return updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() })
  },

  async delete(id) {
    return deleteDoc(doc(db, COL, id))
  },
}
