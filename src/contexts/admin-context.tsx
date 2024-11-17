'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './auth-context'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

interface AdminContextType {
  isAdmin: boolean
  loading: boolean
  error: string | null
}

const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
  loading: true,
  error: null
})

export function useAdmin() {
  return useContext(AdminContext)
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      try {
        console.log('Checking admin status for user:', {
          uid: user.uid,
          email: user.email
        })

        const adminDoc = await getDoc(doc(db, 'env', 'admin'))
        if (!adminDoc.exists()) {
          console.error('Admin document not found')
          setError('Admin configuration not found')
          setIsAdmin(false)
          return
        }

        const adminEmail = adminDoc.data()?.adminEmail
        console.log('Admin email from config:', adminEmail)

        const isUserAdmin = user.email === adminEmail
        console.log('Admin status:', { isAdmin: isUserAdmin })

        setIsAdmin(isUserAdmin)
        setError(null)
      } catch (error) {
        console.error('Error checking admin status:', error)
        setError('Failed to verify admin status')
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      checkAdminStatus()
    }
  }, [user, authLoading])

  return (
    <AdminContext.Provider value={{ isAdmin, loading, error }}>
      {children}
    </AdminContext.Provider>
  )
}
