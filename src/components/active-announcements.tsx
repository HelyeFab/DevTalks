'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Pin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Announcement } from '@/lib/announcements'

interface ActiveAnnouncementsProps {
  announcements: Announcement[]
}

export function ActiveAnnouncements({ announcements }: ActiveAnnouncementsProps) {
  console.log('ActiveAnnouncements received props:', {
    announcementsCount: announcements?.length,
    announcements: announcements?.map(a => ({
      id: a.id,
      title: a.title,
      pinned: a.pinned,
      startDate: a.startDate,
      endDate: a.endDate
    }))
  })

  const [showPinnedOnly, setShowPinnedOnly] = useState(false)

  const filteredAnnouncements = showPinnedOnly
    ? announcements.filter(a => a.pinned)
    : announcements

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Announcements</h2>
      <div className="flex gap-2">
        <button
          onClick={() => setShowPinnedOnly(false)}
          className={cn(
            'px-3 py-1 text-sm rounded-full',
            !showPinnedOnly
              ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
          )}
        >
          All
        </button>
        <button
          onClick={() => setShowPinnedOnly(true)}
          className={cn(
            'px-3 py-1 text-sm rounded-full inline-flex items-center gap-1',
            showPinnedOnly
              ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
          )}
        >
          <Pin className="h-4 w-4" />
          Pinned
        </button>
      </div>

      {filteredAnnouncements.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          No {showPinnedOnly ? 'pinned ' : ''}announcements at this time.
        </p>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map(announcement => (
            <Link
              key={announcement.id}
              href={`/announcements/${announcement.id}`}
              className="block p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1 truncate">
                    {announcement.title}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    {announcement.startDate ? (
                      <time dateTime={announcement.startDate}>
                        {format(new Date(announcement.startDate), 'MMM d, yyyy')}
                      </time>
                    ) : null}
                    {announcement.pinned && (
                      <Badge variant="destructive" className="gap-1">
                        <Pin className="h-3 w-3" />
                        Pinned
                      </Badge>
                    )}
                  </div>
                </div>
                {announcement.pinned && (
                  <div className="text-red-500 dark:text-red-400">
                    <Pin className="h-4 w-4" />
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
