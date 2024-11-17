'use client'

import { useState, useEffect } from 'react'
import { Bell, Info, RefreshCw, AlertTriangle } from 'lucide-react'
import { getActiveAnnouncements } from '@/lib/announcements'
import type { Announcement } from '@/lib/announcements'

export function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnnouncements()
  }, [])

  async function loadAnnouncements() {
    try {
      setLoading(true)
      const data = await getActiveAnnouncements()
      setAnnouncements(data)
    } catch (error) {
      console.error('Error loading announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />
      case 'update':
        return <RefreshCw className="h-4 w-4 text-green-500" />
      case 'maintenance':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          <h2 className="text-lg font-semibold">Announcements</h2>
        </div>
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border-b border-gray-100 dark:border-gray-700 last:border-0 pb-3 last:pb-0">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (announcements.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          <h2 className="text-lg font-semibold">Announcements</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">No active announcements</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        <h2 className="text-lg font-semibold">Announcements</h2>
      </div>
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className="border-b border-gray-100 dark:border-gray-700 last:border-0 pb-3 last:pb-0"
          >
            <div className="flex items-center gap-2 mb-1">
              {getIcon(announcement.type)}
              <h3 className="font-medium">{announcement.title}</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {announcement.content}
            </p>
            <time className="text-xs text-gray-500 dark:text-gray-500">
              {new Date(announcement.date).toLocaleDateString()}
            </time>
          </div>
        ))}
      </div>
    </div>
  )
}
