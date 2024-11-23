import { Metadata } from 'next'
import { getAnnouncement } from '@/lib/announcements'
import { format } from 'date-fns'
import { ArrowLeft, Pin } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Markdown } from '@/components/markdown'

type Props = {
  params: Promise<{ id: string }> | { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params
  const announcement = await getAnnouncement(resolvedParams.id)

  if (!announcement) {
    return {
      title: 'Announcement Not Found',
    }
  }

  return {
    title: announcement.title,
    description: announcement.content.slice(0, 160),
  }
}

export default async function AnnouncementPage({ params }: Props) {
  const resolvedParams = await params
  const announcement = await getAnnouncement(resolvedParams.id)

  if (!announcement || !announcement.published) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 max-w-3xl py-12">
      <Link
        href="/"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-8"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Blog Posts
      </Link>

      <article>
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-4">{announcement.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <time dateTime={announcement.startDate}>
              {format(new Date(announcement.startDate), 'MMMM d, yyyy')}
            </time>
            {announcement.pinned && (
              <Badge variant="destructive" className="gap-1">
                <Pin className="h-3 w-3" />
                Pinned
              </Badge>
            )}
          </div>
        </header>

        <div className="prose dark:prose-invert max-w-none">
          <Markdown content={announcement.content} />
        </div>
      </article>
    </div>
  )
}
