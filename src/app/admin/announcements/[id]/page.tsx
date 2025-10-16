'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { getAnnouncement, type Announcement } from '@/lib/announcements'
import { UnifiedContentEditor } from '@/components/admin/unified-content-editor'

export default function EditAnnouncement() {
  const router = useRouter()
  const params = useParams()
  const { user, loading, isAdmin } = useAuth()
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const id = params.id as string

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/auth/signin')
      return
    }

    async function fetchAnnouncement() {
      try {
        const fetchedAnnouncement = await getAnnouncement(id)
        if (!fetchedAnnouncement) {
          setError('Announcement not found')
          return
        }
        setAnnouncement(fetchedAnnouncement)
      } catch (error) {
        console.error('Error fetching announcement:', error)
        setError('Failed to load announcement')
      } finally {
        setIsLoading(false)
      }
    }

    if (user && isAdmin) {
      fetchAnnouncement()
    }
  }, [user, loading, isAdmin, router, id])

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 max-w-3xl py-12">
        <div className="p-4 text-red-700 bg-red-100 dark:bg-red-900/20 dark:text-red-400 rounded-md">
          {error}
        </div>
      </div>
    )
  }

  if (!user || !isAdmin || !announcement) {
    return null
  }

  return <UnifiedContentEditor existingAnnouncement={announcement} mode="edit" initialContentType="announcement" />
}
