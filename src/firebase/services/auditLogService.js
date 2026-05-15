import {
  collection, doc, query, orderBy, where, limit,
  addDoc, getDocs, serverTimestamp,
} from 'firebase/firestore'
import { db }   from '../firestore'
import { auth } from '../auth'

const COL = 'auditLogs'

/** Action type constants */
export const AUDIT_ACTION = {
  CREATE:  'create',
  UPDATE:  'update',
  DELETE:  'delete',
  LOGIN:   'login',
  LOGOUT:  'logout',
  PUBLISH: 'publish',
  ARCHIVE: 'archive',
  UPLOAD:  'upload',
  SETTING: 'setting',
}

export const auditLogService = {
  /**
   * Record an admin action.
   * @param {string} action  — one of AUDIT_ACTION values
   * @param {string} entity  — collection name (e.g. 'products')
   * @param {string} entityId — document ID acted upon
   * @param {object} [meta]  — extra context (name, before/after snapshot…)
   */
  async log(action, entity, entityId = '', meta = {}) {
    const user = auth.currentUser
    return addDoc(collection(db, COL), {
      action,
      entity,
      entityId,
      meta,
      userId:    user?.uid   ?? 'anonymous',
      userEmail: user?.email ?? 'anonymous',
      createdAt: serverTimestamp(),
    })
  },

  /** Admin: get recent logs (default 100) */
  async getRecent(max = 100) {
    const q    = query(collection(db, COL), orderBy('createdAt', 'desc'), limit(max))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  },

  /** Admin: filter logs by entity */
  async getByEntity(entity, max = 50) {
    const q    = query(
      collection(db, COL),
      where('entity', '==', entity),
      orderBy('createdAt', 'desc'),
      limit(max),
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  },

  /** Admin: filter logs by user */
  async getByUser(userId, max = 50) {
    const q    = query(
      collection(db, COL),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(max),
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  },
}
