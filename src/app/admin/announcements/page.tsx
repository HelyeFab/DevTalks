'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Announcement, AnnouncementType, createAnnouncement, getAllAnnouncements, updateAnnouncement, deleteAnnouncement } from '@/lib/announcements'
import { Bell, Plus, Pencil, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/modal'

export default function AnnouncementsPage() {
  const router = useRouter()
  const { user, loading, isAdmin } = useAuth()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null)
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Partial<Announcement>>({
    title: '',
    content: '',
    type: 'info' as AnnouncementType,
    active: true
  })

  useEffect(() => {
    if (loading) return

    if (!user || !isAdmin) {
      router.push('/')
      return
    }

    loadAnnouncements()
  }, [user, loading, isAdmin, router])

  async function loadAnnouncements() {
    if (!user || !isAdmin) return

    try {
      const data = await getAllAnnouncements()
      setAnnouncements(data)
    } catch (error) {
      console.error('Error loading announcements:', error)
      toast.error('Failed to load announcements')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !isAdmin) return

    try {
      const announcementData = {
        ...currentAnnouncement,
        authorId: user.uid,
        authorName: user.displayName || 'Admin'
      }

      if (currentAnnouncement.id) {
        await updateAnnouncement(currentAnnouncement.id, announcementData)
        toast.success('Announcement updated')
      } else {
        await createAnnouncement(announcementData as Omit<Announcement, 'id' | 'date'>)
        toast.success('Announcement created')
      }

      setIsEditing(false)
      setCurrentAnnouncement({
        title: '',
        content: '',
        type: 'info',
        active: true
      })
      loadAnnouncements()
    } catch (error) {
      console.error('Error saving announcement:', error)
      toast.error('Failed to save announcement')
    }
  }

  async function handleDelete() {
    if (!announcementToDelete?.id) return
    
    try {
      await deleteAnnouncement(announcementToDelete.id)
      toast.success('Announcement deleted')
      setShowDeleteModal(false)
      setAnnouncementToDelete(null)
      loadAnnouncements()
    } catch (error) {
      console.error('Error deleting announcement:', error)
      toast.error('Failed to delete announcement')
    }
  }

  const handleDeleteClick = (announcement: Announcement) => {
    setAnnouncementToDelete(announcement)
    setShowDeleteModal(true)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Manage Announcements</h1>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Announcement
            </button>
          )}
        </div>

        {isEditing && (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {currentAnnouncement.id ? 'Edit Announcement' : 'New Announcement'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  setCurrentAnnouncement({
                    title: '',
                    content: '',
                    type: 'info',
                    active: true
                  })
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={currentAnnouncement.title}
                  onChange={(e) => setCurrentAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Content</label>
                <textarea
                  value={currentAnnouncement.content}
                  onChange={(e) => setCurrentAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={currentAnnouncement.type}
                    onChange={(e) => setCurrentAnnouncement(prev => ({ ...prev, type: e.target.value as AnnouncementType }))}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="info">Info</option>
                    <option value="update">Update</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={currentAnnouncement.active ? 'active' : 'inactive'}
                    onChange={(e) => setCurrentAnnouncement(prev => ({ ...prev, active: e.target.value === 'active' }))}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {currentAnnouncement.id ? 'Update' : 'Create'} Announcement
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 flex items-start justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium">{announcement.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    announcement.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {announcement.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{announcement.content}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{new Date(announcement.date).toLocaleDateString()}</span>
                  <span>{announcement.type}</span>
                  <span>By {announcement.authorName}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentAnnouncement(announcement)
                    setIsEditing(true)
                  }}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteClick(announcement)}
                  className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setAnnouncementToDelete(null)
        }}
        showCloseButton={false}
      >
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Delete Announcement</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Are you sure you want to delete "{announcementToDelete?.title}"? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => {
                setShowDeleteModal(false)
                setAnnouncementToDelete(null)
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
