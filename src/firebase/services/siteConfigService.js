import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firestore'

const DOC = 'main'
const COL = 'siteConfig'

export const siteConfigService = {
  async get() {
    const snap = await getDoc(doc(db, COL, DOC))
    return snap.exists() ? snap.data() : {}
  },

  async save(data) {
    return setDoc(doc(db, COL, DOC), {
      ...data,
      updatedAt: serverTimestamp(),
    }, { merge: true })
  },
}
