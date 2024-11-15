'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

export default function Dashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // This will be handled by the useEffect redirect
  }

  return (
    <div className="container mx-auto px-4 max-w-6xl py-12">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Welcome, {user.displayName || user.email}!</h2>
          <p className="text-gray-600 dark:text-gray-400">
            This is your personal dashboard where you can manage your account and preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-semibold mb-2">Profile Information</h3>
            <p className="text-gray-600 dark:text-gray-400">Email: {user.email}</p>
            {user.displayName && (
              <p className="text-gray-600 dark:text-gray-400">Name: {user.displayName}</p>
            )}
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-semibold mb-2">Account Status</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Email verified: {user.emailVerified ? 'Yes' : 'No'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
