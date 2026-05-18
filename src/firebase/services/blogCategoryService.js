import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, query, orderBy, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/firebase/firestore'

const COL = 'blogCategories'

export const blogCategoryService = {
  async getAll() {
    const snap = await getDocs(query(collection(db, COL), orderBy('name', 'asc')))
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
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
