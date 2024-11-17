'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { 
  User, 
  onAuthStateChanged, 
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  signInWithGoogle: async () => {},
  signOut: async () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const auth = getAuth()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Get admin email from environment collection
          const envRef = doc(db, 'env', 'admin')
          const envSnap = await getDoc(envRef)
          const adminEmail = envSnap.exists() ? envSnap.data().adminEmail : null

          // Check if user is admin
          const isUserAdmin = user.email === adminEmail

          // Create or update user profile
          const profileRef = doc(db, 'profiles', user.uid)
          const profileSnap = await getDoc(profileRef)
          
          if (!profileSnap.exists()) {
            await setDoc(profileRef, {
              email: user.email,
              name: user.displayName,
              photoURL: user.photoURL,
              isAdmin: isUserAdmin,
              createdAt: new Date().toISOString()
            })
          }

          setIsAdmin(isUserAdmin)
          setUser(user)
        } else {
          setIsAdmin(false)
          setUser(null)
        }
      } catch (error) {
        console.error('Error checking admin status:', error)
        setIsAdmin(false)
        setUser(null)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [auth])

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      
      // Get admin email from environment collection
      const envRef = doc(db, 'env', 'admin')
      const envSnap = await getDoc(envRef)
      const adminEmail = envSnap.exists() ? envSnap.data().adminEmail : null

      // Check if user is admin
      const isUserAdmin = result.user.email === adminEmail
      
      // Create or update user profile
      const profileRef = doc(db, 'profiles', result.user.uid)
      const profileSnap = await getDoc(profileRef)
      
      if (!profileSnap.exists()) {
        await setDoc(profileRef, {
          email: result.user.email,
          name: result.user.displayName,
          photoURL: result.user.photoURL,
          isAdmin: isUserAdmin,
          createdAt: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error('Error signing in with Google:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}