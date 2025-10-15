'use client'

import { useEffect } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize Firebase Auth listener
    console.log('Initializing Firebase Auth...')
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed in Providers:', {
        isAuthenticated: !!user,
        email: user?.email,
        displayName: user?.displayName
      })
    })

    return () => {
      console.log('Cleaning up Firebase Auth listener')
      unsubscribe()
    }
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  )
}
