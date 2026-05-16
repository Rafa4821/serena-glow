import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth } from '@/firebase/auth'
import { db }   from '@/firebase/firestore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [role, setRole]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdTokenResult()
        let resolvedRole = token.claims?.role ?? null

        if (!resolvedRole) {
          try {
            const snap = await getDoc(doc(db, 'adminUsers', firebaseUser.uid))
            if (snap.exists() && snap.data().active !== false) {
              resolvedRole = snap.data().role ?? null
            }
          } catch { /* sin acceso aún */ }
        }

        setUser(firebaseUser)
        setRole(resolvedRole)
      } else {
        setUser(null)
        setRole(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function signIn(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  async function signUp(email, password, displayName) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await setDoc(doc(db, 'adminUsers', cred.user.uid), {
      email,
      displayName: displayName || email,
      role:        'admin',
      active:      true,
      createdAt:   serverTimestamp(),
      updatedAt:   serverTimestamp(),
    })
    return cred
  }

  async function signOut() {
    return firebaseSignOut(auth)
  }

  const isAdmin  = role === 'admin'
  const isEditor = role === 'editor' || isAdmin

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, signUp, signOut, isAdmin, isEditor }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
