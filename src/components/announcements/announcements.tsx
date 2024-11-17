'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useAdmin } from '@/contexts/admin-context'
import { Announcement } from '@/types/announcement'
import { PlusCircle, Pin, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { CreateAnnouncementModal } from './create-announcement-modal'

interface Props {
  type?: 'all' | 'sticky'
}

export function Announcements({ type = 'all' }: Props) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { user } = useAuth()
  const { isAdmin } = useAdmin()

  useEffect(() => {
    fetchAnnouncements()
  }, [type])

  const fetchAnnouncements = async () => {
    try {
      console.log('Fetching announcements:', { type })
      const response = await fetch('/api/announcements')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('Fetched announcements:', { count: data.length })
      
      if (Array.isArray(data)) {
        // Filter active announcements
        let filteredAnnouncements = data.filter(announcement => announcement.status === 'active')

        // Filter based on type
        if (type === 'sticky') {
          filteredAnnouncements = filteredAnnouncements.filter(announcement => announcement.isSticky)
        } else {
          // For 'all' type, show sticky ones first, then latest 3 non-sticky
          const stickyAnnouncements = filteredAnnouncements.filter(announcement => announcement.isSticky)
          const nonStickyAnnouncements = filteredAnnouncements
            .filter(announcement => !announcement.isSticky)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3)

          filteredAnnouncements = [...stickyAnnouncements, ...nonStickyAnnouncements]
        }

        setAnnouncements(filteredAnnouncements)
      } else {
        console.error('Unexpected response format:', data)
        setAnnouncements([])
      }
    } catch (error) {
      console.error('Error fetching announcements:', error instanceof Error ? error.message : 'Unknown error')
      setError(error instanceof Error ? error.message : 'Failed to fetch announcements')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async (data: { title: string; content: string; markdownContent: string; isSticky: boolean; status: 'active' | 'inactive' }) => {
    if (!user) return

    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          ...data,
          author: {
            name: user.displayName || 'Anonymous',
            email: user.email,
            image: user.photoURL,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const newAnnouncement = await response.json()
      
      // Only add to current list if it matches the filter
      if (type === 'all' || (type === 'sticky' && newAnnouncement.isSticky)) {
        setAnnouncements(prev => [newAnnouncement, ...prev])
      }
      
      setShowCreateModal(false)
      toast.success('Announcement created successfully')
    } catch (error) {
      console.error('Error creating announcement:', error instanceof Error ? error.message : 'Unknown error')
      toast.error('Failed to create announcement. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          {isAdmin && <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32" />}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
        <button
          onClick={fetchAnnouncements}
          className="mt-4 text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {type === 'sticky' ? 'Sticky Notes' : 'Announcements'}
        </h2>
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 text-sm text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
          >
            <PlusCircle className="w-4 h-4" />
            New Announcement
          </button>
        )}
      </div>

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <Link
            key={announcement.id}
            href={`/announcements/${announcement.id}`}
            className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 hover:ring-2 hover:ring-pink-500 dark:hover:ring-pink-400 transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <Image
                src={announcement.author.image || '/images/default-avatar.svg'}
                alt={announcement.author.name}
                width={24}
                height={24}
                className="rounded-full"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{announcement.author.name}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
                </span>
                {announcement.isSticky && (
                  <span className="text-xs bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400 px-2 py-0.5 rounded-full">
                    Pinned
                  </span>
                )}
              </div>
            </div>
            <h3 className="font-semibold mb-1">{announcement.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {announcement.content}
            </p>
          </Link>
        ))}

        {announcements.length === 0 && (
          <p className="text-center py-8 text-gray-600 dark:text-gray-400">
            {type === 'sticky' 
              ? 'No sticky notes yet'
              : 'No announcements yet'}
          </p>
        )}
      </div>

      {showCreateModal && (
        <CreateAnnouncementModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  )
}
