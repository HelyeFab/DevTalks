'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, onAuthStateChanged, getAuth } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false
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
          // Check if user has admin privileges
          const profileRef = doc(db, 'profiles', user.uid)
          const profileSnap = await getDoc(profileRef)
          const isAdmin = profileSnap.exists() && profileSnap.data()?.isAdmin === true
          setIsAdmin(isAdmin)
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

    // Cleanup subscription
    return () => unsubscribe()
  }, [auth])

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin }}>
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