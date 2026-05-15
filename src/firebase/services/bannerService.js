import {
  collection, doc, query, where, orderBy,
  getDocs, getDoc, setDoc, updateDoc, deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firestore'

const COL = 'banners'

export const bannerService = {
  /** Get active banners ordered by position/order */
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

  async getById(id) {
    const snap = await getDoc(doc(db, COL, id))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
  },

  /** Upsert a banner by its id (hero, emotional, etc.) */
  async upsert(id, data) {
    return setDoc(doc(db, COL, id), {
      ...data,
      updatedAt: serverTimestamp(),
    }, { merge: true })
  },

  async update(id, data) {
    return updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() })
  },

  async delete(id) {
    return deleteDoc(doc(db, COL, id))
  },
}
