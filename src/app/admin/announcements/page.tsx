'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { PenSquare, Trash2, Eye } from 'lucide-react'
import { getAllAnnouncements, deleteAnnouncement, updateAnnouncement, type Announcement } from '@/lib/announcements'
import { format } from 'date-fns'

export default function AnnouncementsList() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      console.log('Redirecting to signin - User:', !!user, 'Admin:', isAdmin)
      router.push('/auth/signin')
    }
  }, [user, loading, isAdmin, router])

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        console.log('Fetching all announcements including drafts...')
        const fetchedAnnouncements = await getAllAnnouncements(false)
        console.log('Fetched announcements:', fetchedAnnouncements)
        setAnnouncements(fetchedAnnouncements)
      } catch (error) {
        console.error('Error fetching announcements:', error)
        setError('Failed to load announcements')
      } finally {
        setIsLoading(false)
      }
    }

    if (user && isAdmin) {
      fetchAnnouncements()
    }
  }, [user, isAdmin])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return
    }

    try {
      await deleteAnnouncement(id)
      setAnnouncements(announcements.filter(announcement => announcement.id !== id))
    } catch (error) {
      console.error('Error deleting announcement:', error)
      setError('Failed to delete announcement')
    }
  }

  const handleTogglePublish = async (announcement: Announcement) => {
    if (!announcement.id) return

    try {
      const newStatus = !announcement.published
      const updatedAnnouncement = await updateAnnouncement(announcement.id, {
        published: newStatus,
        publishedAt: newStatus ? new Date().toISOString() : undefined
      })
      setAnnouncements(announcements.map(a => 
        a.id === announcement.id ? updatedAnnouncement : a
      ))
    } catch (error) {
      console.error('Error updating announcement:', error)
      setError('Failed to update announcement')
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
      default:
        return 'text-green-600 bg-green-50 dark:bg-green-900/20'
    }
  }

  return (
    <div className="container mx-auto px-4 max-w-6xl py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Announcements</h1>
        <div className="flex gap-4">
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/announcements/new"
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            New Announcement
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 text-red-700 bg-red-100 dark:bg-red-900/20 dark:text-red-400 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {announcements.map((announcement) => (
            <li key={announcement.id} className="px-4 py-5 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {announcement.title}
                    </h2>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(announcement.priority)}`}>
                      {announcement.priority}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      announcement.published
                        ? 'text-green-600 bg-green-50 dark:bg-green-900/20'
                        : 'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
                    }`}>
                      {announcement.published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:gap-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Start: {format(new Date(announcement.startDate), 'MMM d, yyyy')}
                    </p>
                    {announcement.endDate && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        End: {format(new Date(announcement.endDate), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <button
                    onClick={() => handleTogglePublish(announcement)}
                    className={`text-sm px-3 py-1 rounded-md ${
                      announcement.published
                        ? 'text-yellow-700 bg-yellow-50 hover:bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/40'
                        : 'text-green-700 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-900/20 dark:hover:bg-green-900/40'
                    }`}
                  >
                    {announcement.published ? 'Unpublish' : 'Publish'}
                  </button>
                  <Link
                    href={`/admin/announcements/${announcement.id}`}
                    className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    <PenSquare className="h-5 w-5" />
                  </Link>
                  <button
                    onClick={() => announcement.id && handleDelete(announcement.id)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
          {announcements.length === 0 && (
            <li className="px-4 py-5 sm:px-6 text-center text-gray-500 dark:text-gray-400">
              No announcements found
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
