import {
  collection, doc, query, orderBy, where,
  getDocs, addDoc, updateDoc, deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firestore'

const COL = 'messages'

/** Valid status values */
export const INQUIRY_STATUS = { PENDING: 'pending', ANSWERED: 'answered', ARCHIVED: 'archived' }

export const inquiryService = {
  /** Public: submit a contact form message */
  async create(data) {
    return addDoc(collection(db, COL), {
      name:      data.name,
      email:     data.email    ?? '',
      phone:     data.phone    ?? '',
      message:   data.message,
      status:    INQUIRY_STATUS.PENDING,
      read:      false,
      createdAt: serverTimestamp(),
    })
  },

  /** Admin: get all messages ordered by date */
  async getAll() {
    const q    = query(collection(db, COL), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  },

  /** Admin: get by status */
  async getByStatus(status) {
    const q    = query(collection(db, COL), where('status', '==', status), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  },

  async markRead(id) {
    return updateDoc(doc(db, COL, id), { read: true })
  },

  async setStatus(id, status) {
    return updateDoc(doc(db, COL, id), { status, read: true })
  },

  async delete(id) {
    return deleteDoc(doc(db, COL, id))
  },
}
