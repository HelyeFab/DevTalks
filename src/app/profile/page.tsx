'use client'

import { useAuth } from '@/contexts/auth-context'
import Image from 'next/image'

const DEFAULT_AVATAR = '/images/default-avatar.svg'

export default function ProfilePage() {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-gray-600 dark:text-gray-400">Please sign in to view your profile.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl px-6 py-8">
      <div className="rounded-lg bg-white dark:bg-dark-800 shadow-sm">
        <div className="px-8 py-6">
          {/* Header with avatar and name */}
          <div className="flex items-center gap-6 border-b border-gray-200 dark:border-dark-700 pb-6">
            <div className="relative h-24 w-24">
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={user.displayName || 'Profile picture'}
                  width={96}
                  height={96}
                  className="rounded-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = DEFAULT_AVATAR
                    target.onerror = null // Prevent infinite loop
                  }}
                />
              ) : (
                <Image
                  src={DEFAULT_AVATAR}
                  alt="Default profile picture"
                  width={96}
                  height={96}
                  className="rounded-full"
                />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {user.displayName || 'User'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
            </div>
          </div>

          {/* Profile information */}
          <div className="mt-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Profile Information
              </h2>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="bg-gray-50 dark:bg-dark-700/50 px-4 py-3 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Created</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}
                  </dd>
                </div>
                <div className="bg-gray-50 dark:bg-dark-700/50 px-4 py-3 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Sign In</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : 'N/A'}
                  </dd>
                </div>
                <div className="bg-gray-50 dark:bg-dark-700/50 px-4 py-3 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Verified</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {user.emailVerified ? 'Yes' : 'No'}
                  </dd>
                </div>
                <div className="bg-gray-50 dark:bg-dark-700/50 px-4 py-3 rounded-lg">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Provider</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {user.providerData[0]?.providerId === 'google.com' ? 'Google' : 'Email/Password'}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Activity Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Recent Activity
              </h2>
              <div className="bg-gray-50 dark:bg-dark-700/50 rounded-lg px-4 py-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Activity tracking coming soon...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
