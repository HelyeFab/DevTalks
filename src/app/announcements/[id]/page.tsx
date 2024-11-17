'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Announcement } from '@/types/announcement'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { AlertTriangle } from 'lucide-react'
import { MDXContent } from '@/components/mdx-content'

export default function AnnouncementPage() {
  const { id } = useParams()
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnnouncement()
  }, [id])

  const fetchAnnouncement = async () => {
    try {
      const response = await fetch(`/api/announcements/${id}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setAnnouncement(data)
    } catch (error) {
      console.error('Error fetching announcement:', error instanceof Error ? error.message : 'Unknown error')
      setError(error instanceof Error ? error.message : 'Failed to fetch announcement')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !announcement) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {error || 'Announcement not found'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <article className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-4">{announcement.title}</h1>
          <div className="flex items-center gap-3">
            <Image
              src={announcement.author.image || '/images/default-avatar.svg'}
              alt={announcement.author.name}
              width={32}
              height={32}
              className="rounded-full"
            />
            <div className="flex items-center gap-2">
              <span className="font-medium">{announcement.author.name}</span>
              <span className="text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true })}
              </span>
              {announcement.isSticky && (
                <span className="text-xs bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400 px-2 py-0.5 rounded-full">
                  Pinned
                </span>
              )}
            </div>
          </div>
        </header>

        <div className="prose dark:prose-invert max-w-none">
          <MDXContent content={announcement.markdownContent} />
        </div>
      </article>
    </div>
  )
}
