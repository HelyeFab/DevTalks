'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

export default function ProfileRedirect() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/user/profile')
      } else {
        router.replace('/auth/signin')
      }
    }
  }, [router, user, loading])

  // Show loading state
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-gray-600 dark:text-gray-400">
          Loading...
        </div>
      </div>
    </div>
  )
}
