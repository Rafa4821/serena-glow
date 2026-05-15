import {
  collection, doc, query, where, orderBy, limit,
  getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firestore'

const COL = 'gallery'

export const galleryService = {
  async getActive(max = 50) {
    const q    = query(collection(db, COL), where('active', '==', true), orderBy('order', 'asc'), limit(max))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  },

  async getAll() {
    const q    = query(collection(db, COL), orderBy('order', 'asc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  },

  async create(data) {
    return addDoc(collection(db, COL), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
  },

  async update(id, data) {
    return updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() })
  },

  async delete(id) {
    return deleteDoc(doc(db, COL, id))
  },
}
