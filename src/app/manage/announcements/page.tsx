import { Metadata } from 'next'
import { ManageAnnouncements } from '@/components/manage/announcements'

export const metadata: Metadata = {
  title: 'Manage Announcements',
  description: 'Manage blog announcements and sticky notes',
}

export default function ManageAnnouncementsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ManageAnnouncements />
    </div>
  )
}
