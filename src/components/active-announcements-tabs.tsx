'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Pin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Announcement } from '@/lib/announcements'

interface ActiveAnnouncementsTabsProps {
  announcements: Announcement[]
}

// Client Component - only handles tab state and rendering
export function ActiveAnnouncementsTabs({ announcements }: ActiveAnnouncementsTabsProps) {
  const [showPinnedOnly, setShowPinnedOnly] = useState(false)

  const filteredAnnouncements = showPinnedOnly
    ? announcements.filter(a => a.pinned)
    : announcements

  return (
    <>
      <h2 className="text-lg font-semibold mb-4 text-foreground">Announcements</h2>
      <div className="flex gap-2">
        <button
          onClick={() => setShowPinnedOnly(false)}
          className={cn(
            'px-3 py-1 text-sm rounded-full transition-colors',
            !showPinnedOnly
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
        >
          All
        </button>
        <button
          onClick={() => setShowPinnedOnly(true)}
          className={cn(
            'px-3 py-1 text-sm rounded-full inline-flex items-center gap-1 transition-colors',
            showPinnedOnly
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
        >
          <Pin className="h-4 w-4" />
          Pinned
        </button>
      </div>

      {filteredAnnouncements.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No {showPinnedOnly ? 'pinned ' : ''}announcements at this time.
        </p>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map(announcement => (
            <Link
              key={announcement.id}
              href={`/announcements/${announcement.id}`}
              className="block p-4 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-card-foreground mb-1 truncate">
                    {announcement.title}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
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
                  <div className="text-destructive">
                    <Pin className="h-4 w-4" />
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
