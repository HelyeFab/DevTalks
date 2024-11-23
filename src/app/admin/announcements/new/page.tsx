'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { createAnnouncement } from '@/lib/announcements'

export default function NewAnnouncement() {
  const router = useRouter()
  const { user, loading, isAdmin } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!loading && (!user || !isAdmin)) {
    router.push('/auth/signin')
    return null
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const startDate = formData.get('startDate') as string
    const endDate = formData.get('endDate') as string
    
    const announcement = {
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      pinned: formData.get('pinned') === 'true',
      startDate: startDate || null,
      endDate: endDate || null,
      published: formData.get('published') === 'true',
    }

    try {
      await createAnnouncement(announcement)
      router.push('/admin/announcements')
    } catch (error) {
      console.error('Error creating announcement:', error)
      setError('Failed to create announcement')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 max-w-3xl py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">New Announcement</h1>
        <Link
          href="/admin/announcements"
          className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        >
          Back to Announcements
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 text-red-700 bg-red-100 dark:bg-red-900/20 dark:text-red-400 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Title
          </label>
          <input
            type="text"
            name="title"
            id="title"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Content
          </label>
          <textarea
            name="content"
            id="content"
            rows={4}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Start Date (Optional)
          </label>
          <input
            type="date"
            name="startDate"
            id="startDate"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            End Date (Optional)
          </label>
          <input
            type="date"
            name="endDate"
            id="endDate"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="pinned"
            id="pinned"
            value="true"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="pinned" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Pin this announcement
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="published"
            id="published"
            value="true"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="published" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Published
          </label>
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href="/admin/announcements"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating...' : 'Create Announcement'}
          </button>
        </div>
      </form>
    </div>
  )
}
