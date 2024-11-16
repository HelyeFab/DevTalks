'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import {
  User,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface AuthUser {
  id: string
  email: string | null
  name: string | null
  image: string | null
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  isAdmin: boolean
  signInWithGoogle: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  signInWithGoogle: async () => {},
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
})

const ADMIN_EMAIL = 'emmanuelfabiani23@gmail.com'
const DEFAULT_AVATAR = '/images/default-avatar.svg'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('Setting up auth state listener...')
    
    // Try to get cached user first
    const cachedUser = sessionStorage.getItem('auth_user')
    if (cachedUser) {
      console.log('Found cached user:', JSON.parse(cachedUser))
      setUser(JSON.parse(cachedUser))
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user?.email)

      if (user) {
        const authUser: AuthUser = {
          id: user.uid,
          email: user.email,
          name: user.displayName,
          image: user.photoURL || DEFAULT_AVATAR,
        }
        setUser(authUser)
        sessionStorage.setItem('auth_user', JSON.stringify(authUser))
        console.log('User authenticated:', authUser)
      } else {
        setUser(null)
        sessionStorage.removeItem('auth_user')
        console.log('User signed out')
      }

      setLoading(false)
    })

    return () => {
      console.log('Cleaning up auth state listener...')
      unsubscribe()
    }
  }, [])

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    try {
      const result = await signInWithPopup(auth, provider)
      console.log('Google sign in successful:', result.user.email)
    } catch (error) {
      console.error('Google sign in error:', error)
      throw error
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      console.log('Sign in successful:', result.user.email)
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(result.user, {
        displayName: name,
      })
      console.log('Sign up successful:', result.user.email)
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      console.log('Sign out successful')
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  const isAdmin = user?.email === ADMIN_EMAIL

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        signInWithGoogle,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}