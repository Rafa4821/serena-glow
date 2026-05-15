import {
  collection, doc, query, orderBy, getDocs, getDoc, addDoc,
  updateDoc, deleteDoc, serverTimestamp, arrayUnion, arrayRemove, increment,
} from 'firebase/firestore'
import {
  ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject,
} from 'firebase/storage'
import { db } from '../firestore'
import { storage } from '../storage'

const COL = 'media'

/** Internal: delete a storage path, silently ignoring "not found" */
async function removeStoragePath(path) {
  if (!path) return
  try {
    await deleteObject(storageRef(storage, path))
  } catch (e) {
    if (e.code !== 'storage/object-not-found') throw e
  }
}

/** Internal: upload a Blob to a storage path and return the download URL */
function uploadBlob(path, blob, mimeType, onProgress) {
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef(storage, path), blob, { contentType: mimeType })
    task.on(
      'state_changed',
      snap => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      async () => resolve(await getDownloadURL(task.snapshot.ref)),
    )
  })
}

export const mediaService = {
  /**
   * Upload pre-converted catalog + thumb Blobs and register in the media collection.
   * Progress: 0–88% catalog upload, 89–95% thumb upload, 96–100% Firestore write.
   */
  uploadConverted({ catalogBlob, thumbBlob, folder, originalName, ext, mimeType, width, height }, onProgress) {
    const id          = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const catalogPath = `${folder}/${id}.${ext}`
    const thumbPath   = `${folder}/thumbs/${id}.${ext}`

    return new Promise((resolve, reject) => {
      uploadBlob(catalogPath, catalogBlob, mimeType, pct => onProgress?.(Math.round(pct * 0.88)))
        .then(async catalogUrl => {
          try {
            onProgress?.(89)
            const thumbUrl = await uploadBlob(thumbPath, thumbBlob, mimeType, pct => onProgress?.(89 + Math.round(pct * 0.06)))
            onProgress?.(96)

            const docRef = await addDoc(collection(db, COL), {
              url:       catalogUrl,
              thumbUrl,
              path:      catalogPath,
              thumbPath,
              folder,
              name:      originalName,
              altText:   '',
              size:      catalogBlob.size,
              mimeType,
              width,
              height,
              usedBy:    [],
              refCount:  0,
              createdAt: serverTimestamp(),
            })
            onProgress?.(100)
            resolve({ id: docRef.id, url: catalogUrl, thumbUrl, path: catalogPath, thumbPath })
          } catch (err) {
            reject(err)
          }
        })
        .catch(reject)
    })
  },

  /**
   * Legacy raw-file upload (kept for ImageUploader component).
   * Note: useImageUpload already converts to WebP before calling this path,
   * so the file arriving here may already be a WebP blob.
   */
  upload(file, folder = 'uploads', onProgress) {
    const ext      = file.name.split('.').pop()
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    return new Promise((resolve, reject) => {
      const task = uploadBytesResumable(storageRef(storage, filename), file, { contentType: file.type })
      task.on(
        'state_changed',
        snap => onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        reject,
        async () => {
          const url    = await getDownloadURL(task.snapshot.ref)
          const docRef = await addDoc(collection(db, COL), {
            url, path: filename, folder,
            name: file.name, altText: '',
            size: file.size, mimeType: file.type,
            usedBy: [], refCount: 0,
            createdAt: serverTimestamp(),
          })
          resolve({ id: docRef.id, url, path: filename })
        },
      )
    })
  },

  async getAll() {
    const snap = await getDocs(query(collection(db, COL), orderBy('createdAt', 'desc')))
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  },

  async updateAltText(id, altText) {
    return updateDoc(doc(db, COL, id), { altText })
  },

  /**
   * Atomically add a usage reference.
   * entityRef — e.g. 'products/abc123'
   */
  async addUsage(mediaId, entityRef) {
    return updateDoc(doc(db, COL, mediaId), {
      usedBy:   arrayUnion(entityRef),
      refCount: increment(1),
    })
  },

  /** Atomically remove a usage reference */
  async removeUsage(mediaId, entityRef) {
    return updateDoc(doc(db, COL, mediaId), {
      usedBy:   arrayRemove(entityRef),
      refCount: increment(-1),
    })
  },

  /**
   * Safe delete: removes catalog + thumb from Storage and the Firestore doc,
   * but only if refCount === 0.
   */
  async safeDelete(id) {
    const snap = await getDoc(doc(db, COL, id))
    if (!snap.exists()) return { deleted: false, reason: 'not found' }

    const data = snap.data()
    const refs = data.refCount ?? data.usedBy?.length ?? 0
    if (refs > 0) return { deleted: false, reason: 'still referenced' }

    await Promise.allSettled([
      removeStoragePath(data.path),
      removeStoragePath(data.thumbPath),
    ])
    await deleteDoc(doc(db, COL, id))
    return { deleted: true }
  },

  /** Bulk delete all orphans (refCount === 0). Returns count deleted. */
  async deleteOrphans() {
    const snap = await getDocs(query(collection(db, COL), orderBy('createdAt', 'desc')))
    const orphans = snap.docs.filter(d => {
      const data = d.data()
      return (data.refCount ?? data.usedBy?.length ?? 0) === 0
    })
    await Promise.allSettled(
      orphans.map(async d => {
        const data = d.data()
        await Promise.allSettled([removeStoragePath(data.path), removeStoragePath(data.thumbPath)])
        return deleteDoc(d.ref)
      })
    )
    return orphans.length
  },
}
