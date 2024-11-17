'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useAdmin } from '@/contexts/admin-context'
import { Announcement } from '@/types/announcement'
import { PlusCircle, StickyNote } from 'lucide-react'
import { toast } from 'sonner'
import { AnnouncementItem } from './announcement-item'
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
        // Filter announcements based on type
        const filteredAnnouncements = type === 'sticky' 
          ? data.filter(announcement => announcement.isSticky)
          : data

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

  const handleCreate = async (data: { title: string; content: string; isSticky: boolean }) => {
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

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      setAnnouncements(prev => prev.filter(announcement => announcement.id !== id))
      toast.success('Announcement deleted successfully')
    } catch (error) {
      console.error('Error deleting announcement:', error instanceof Error ? error.message : 'Unknown error')
      toast.error('Failed to delete announcement. Please try again.')
    }
  }

  const handleToggleSticky = async (id: string, isSticky: boolean) => {
    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`
        },
        body: JSON.stringify({ isSticky })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      // If we're in sticky view and unsticking, remove from list
      if (type === 'sticky' && !isSticky) {
        setAnnouncements(prev => prev.filter(announcement => announcement.id !== id))
      } else {
        setAnnouncements(prev => prev.map(announcement => 
          announcement.id === id ? { ...announcement, isSticky } : announcement
        ))
      }

      toast.success(`Announcement ${isSticky ? 'pinned' : 'unpinned'} successfully`)
    } catch (error) {
      console.error('Error updating announcement:', error instanceof Error ? error.message : 'Unknown error')
      toast.error('Failed to update announcement. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <StickyNote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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

      {announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <AnnouncementItem
              key={announcement.id}
              announcement={announcement}
              onDelete={handleDelete}
              onToggleSticky={handleToggleSticky}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      ) : (
        <p className="text-center py-8 text-gray-600 dark:text-gray-400">
          {type === 'sticky' 
            ? 'No sticky notes yet'
            : 'No announcements yet'}
        </p>
      )}

      {showCreateModal && (
        <CreateAnnouncementModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  )
}
