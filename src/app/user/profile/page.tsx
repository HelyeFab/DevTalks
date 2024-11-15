'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { isAdmin } from '@/lib/auth'

export default function UserProfile() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
    // Redirect admin to admin dashboard
    if (!loading && user && isAdmin(user)) {
      router.push('/admin/dashboard')
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

  if (!user || isAdmin(user)) {
    return null // This will be handled by the useEffect redirect
  }

  return (
    <div className="container mx-auto px-4 max-w-6xl py-12">
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Email
              </label>
              <p className="text-gray-900 dark:text-white">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Display Name
              </label>
              <p className="text-gray-900 dark:text-white">
                {user.displayName || 'Not set'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Account Status
              </label>
              <p className="text-gray-900 dark:text-white">
                {user.emailVerified ? 'Verified' : 'Not verified'}
              </p>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
          <div className="space-y-4">
            <button className="w-full bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition-colors">
              Update Profile
            </button>
            <button className="w-full bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition-colors">
              Change Password
            </button>
            {!user.emailVerified && (
              <button className="w-full bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition-colors">
                Verify Email
              </button>
            )}
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Preferences</h2>
          <div className="space-y-4">
            <button className="w-full bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition-colors">
              Notification Settings
            </button>
            <button className="w-full bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition-colors">
              Privacy Settings
            </button>
          </div>
        </div>

        {/* Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              No recent activity to display.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
