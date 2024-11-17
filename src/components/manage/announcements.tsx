'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useAdmin } from '@/contexts/admin-context'
import { Announcement } from '@/types/announcement'
import { PlusCircle, Pin, PinOff, Trash, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { CreateAnnouncementModal } from '../announcements/create-announcement-modal'

export function ManageAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null)
  const { user } = useAuth()
  const { isAdmin } = useAdmin()

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      console.log('Fetching announcements')
      const response = await fetch('/api/announcements')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('Fetched announcements:', { count: data.length })
      
      if (Array.isArray(data)) {
        setAnnouncements(data)
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
      setAnnouncements(prev => [newAnnouncement, ...prev])
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

      setAnnouncements(prev => prev.map(announcement => 
        announcement.id === id ? { ...announcement, isSticky } : announcement
      ))
      toast.success(`Announcement ${isSticky ? 'pinned' : 'unpinned'} successfully`)
    } catch (error) {
      console.error('Error updating announcement:', error instanceof Error ? error.message : 'Unknown error')
      toast.error('Failed to update announcement. Please try again.')
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user?.getIdToken()}`
        },
        body: JSON.stringify({ status })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      setAnnouncements(prev => prev.map(announcement => 
        announcement.id === id ? { ...announcement, status } : announcement
      ))
      toast.success(`Announcement ${status === 'active' ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      console.error('Error updating announcement:', error instanceof Error ? error.message : 'Unknown error')
      toast.error('Failed to update announcement. Please try again.')
    }
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-pink-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-gray-600 dark:text-gray-400">
          You don't have permission to manage announcements.
        </p>
      </div>
    )
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
        <h1 className="text-2xl font-bold">Manage Announcements</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 text-sm text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
        >
          <PlusCircle className="w-4 h-4" />
          New Announcement
        </button>
      </div>

      <div className="grid gap-4">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Image
                  src={announcement.author.image || '/images/default-avatar.svg'}
                  alt={announcement.author.name}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <div>
                  <h3 className="font-semibold">{announcement.title}</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {announcement.author.name} • {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      announcement.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}>
                      {announcement.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                    {announcement.isSticky && (
                      <span className="text-xs bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400 px-2 py-0.5 rounded-full">
                        Pinned
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleSticky(announcement.id, !announcement.isSticky)}
                  className={`p-1 rounded-md ${
                    announcement.isSticky
                      ? 'text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                  title={announcement.isSticky ? 'Unpin announcement' : 'Pin announcement'}
                >
                  {announcement.isSticky ? (
                    <PinOff className="w-4 h-4" />
                  ) : (
                    <Pin className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleUpdateStatus(announcement.id, announcement.status === 'active' ? 'inactive' : 'active')}
                  className={`p-1 rounded-md ${
                    announcement.status === 'active'
                      ? 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                  title={announcement.status === 'active' ? 'Deactivate announcement' : 'Activate announcement'}
                >
                  {announcement.status === 'active' ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => setShowConfirmDelete(announcement.id)}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  title="Delete announcement"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="text-gray-800 dark:text-gray-200">
              {announcement.content}
            </div>
          </div>
        ))}

        {announcements.length === 0 && (
          <p className="text-center py-8 text-gray-600 dark:text-gray-400">
            No announcements yet
          </p>
        )}
      </div>

      {showCreateModal && (
        <CreateAnnouncementModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      )}

      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center gap-3 text-pink-600 dark:text-pink-400 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Delete Announcement</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this announcement? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (showConfirmDelete) {
                    handleDelete(showConfirmDelete)
                  }
                  setShowConfirmDelete(null)
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 dark:bg-pink-700 dark:hover:bg-pink-800 rounded-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
