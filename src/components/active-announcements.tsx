import type { Announcement } from '@/lib/announcements'
import { ActiveAnnouncementsTabs } from './active-announcements-tabs'

interface ActiveAnnouncementsProps {
  announcements: Announcement[]
}

// Server Component - passes data to Client Component for interactivity
export function ActiveAnnouncements({ announcements }: ActiveAnnouncementsProps) {
  return (
    <div className="space-y-4 rounded-lg border border-border p-4 bg-card">
      <ActiveAnnouncementsTabs announcements={announcements} />
    </div>
  )
}
