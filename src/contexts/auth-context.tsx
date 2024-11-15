'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import {
  User,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  signIn: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {},
  logout: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const checkIsAdmin = (email: string | null) => {
    if (!email) return false
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',') || []
    return adminEmails.includes(email.toLowerCase().trim())
  }

  useEffect(() => {
    console.log('Setting up auth state listener...')
    console.log('Current auth instance:', auth)
    console.log('Firebase config:', {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    })

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', { 
        email: user?.email,
        loading: true
      })

      if (user) {
        setUser(user)
        const userIsAdmin = checkIsAdmin(user.email)
        setIsAdmin(userIsAdmin)
        console.log('Auth state updated:', {
          email: user.email,
          isAdmin: userIsAdmin
        })
      } else {
        setUser(null)
        setIsAdmin(false)
        console.log('User signed out')
      }
      setLoading(false)
    })

    return () => {
      console.log('Cleaning up auth state listener')
      unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign in:', { email })
      console.log('Current auth instance:', auth)
      setLoading(true)
      const result = await signInWithEmailAndPassword(auth, email, password)
      console.log('Sign in successful:', result.user)
      setUser(result.user)
      setIsAdmin(checkIsAdmin(result.user.email))
    } catch (error) {
      console.error('Error signing in:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log('Attempting to sign up:', { email, name })
      setLoading(true)
      const result = await createUserWithEmailAndPassword(auth, email, password)
      console.log('Sign up successful:', result.user)

      await updateProfile(result.user, { displayName: name })
      setUser(result.user)
      setIsAdmin(checkIsAdmin(result.user.email))
    } catch (error) {
      console.error('Error signing up:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async () => {
    try {
      console.log('Attempting Google sign in')
      setLoading(true)
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      console.log('Google sign in successful:', result.user)
      setUser(result.user)
      setIsAdmin(checkIsAdmin(result.user.email))
    } catch (error) {
      console.error('Error signing in with Google:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      console.log('Attempting to sign out')
      await firebaseSignOut(auth)
      setUser(null)
      setIsAdmin(false)
      console.log('Sign out successful')
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        signIn,
        signUp,
        signInWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}