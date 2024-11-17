'use client'

import { useState } from 'react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { MoreVertical, Trash, Pin, PinOff } from 'lucide-react'
import { type Announcement } from '@/types/announcement'
import { toast } from 'sonner'

interface Props {
  announcement: Announcement
  onDelete: (id: string) => Promise<void>
  onToggleSticky: (id: string, isSticky: boolean) => Promise<void>
  isAdmin: boolean
}

export function AnnouncementItem({ announcement, onDelete, onToggleSticky, isAdmin }: Props) {
  const [showActions, setShowActions] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  const handleDelete = async () => {
    try {
      await onDelete(announcement.id)
    } catch (error) {
      console.error('Error deleting announcement:', error)
      toast.error('Failed to delete announcement')
    }
  }

  const handleToggleSticky = async () => {
    try {
      await onToggleSticky(announcement.id, !announcement.isSticky)
    } catch (error) {
      console.error('Error updating announcement:', error)
      toast.error('Failed to update announcement')
    }
  }

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      {/* Author info and actions */}
      <div className="flex items-center justify-between mb-2">
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
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {announcement.author.name} • {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showActions && (
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                <button
                  onClick={handleToggleSticky}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  {announcement.isSticky ? (
                    <>
                      <PinOff className="w-4 h-4" />
                      Unpin
                    </>
                  ) : (
                    <>
                      <Pin className="w-4 h-4" />
                      Pin
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="w-full px-4 py-2 text-left text-sm text-pink-600 hover:bg-pink-50 dark:text-pink-400 dark:hover:bg-pink-900/20 flex items-center gap-2"
                >
                  <Trash className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mt-2 text-gray-800 dark:text-gray-200">
        {announcement.content}
      </div>

      {/* Delete confirmation */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Delete Announcement</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this announcement? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDelete()
                  setShowConfirmDelete(false)
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
