'use client'

import { useEffect } from 'react'
import { ThemeProvider } from 'next-themes'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'

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
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  )
}
