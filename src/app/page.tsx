import { Metadata } from 'next'
import { getAllPosts, getMostUpvotedPosts } from '@/lib/blog'
import { getActiveAnnouncements } from '@/lib/announcements'
import { BlogList } from '@/components/blog-list'
import { RecentPosts } from '@/components/recent-posts'
import { ActiveAnnouncements } from '@/components/active-announcements'
import { serializeBlogPosts } from '@/utils/serialization'
import { SITE_CONFIG } from '@/lib/seo/utils'
import { generateWebSiteSchema, generateOrganizationSchema, generateCollectionPageSchema, combineSchemas, toJsonLd } from '@/lib/seo/schema'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Home',
  description: SITE_CONFIG.description,
  keywords: [
    'software development blog',
    'programming tutorials',
    'web development',
    'coding community',
    'tech articles',
    'developer resources',
    'javascript tutorials',
    'react tutorials',
    'nextjs blog',
  ],
  openGraph: {
    type: 'website',
    locale: SITE_CONFIG.locale,
    url: SITE_CONFIG.url,
    title: `${SITE_CONFIG.name} - Software Development Blog & Community`,
    description: SITE_CONFIG.description,
    siteName: SITE_CONFIG.name,
    images: [
      {
        url: `${SITE_CONFIG.url}/api/og?type=blog&title=${encodeURIComponent('Latest Articles')}`,
        width: 1200,
        height: 630,
        alt: SITE_CONFIG.name,
        type: 'image/png',
      },
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: `${SITE_CONFIG.name} - Default`,
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: SITE_CONFIG.twitterHandle,
    creator: SITE_CONFIG.twitterHandle,
    title: `${SITE_CONFIG.name} - Software Development Blog`,
    description: SITE_CONFIG.description,
    images: [
      {
        url: `${SITE_CONFIG.url}/api/og?type=blog&title=${encodeURIComponent('Latest Articles')}`,
        alt: SITE_CONFIG.name,
      },
    ],
  },
  alternates: {
    canonical: SITE_CONFIG.url,
    languages: {
      'en-US': SITE_CONFIG.url,
      'x-default': SITE_CONFIG.url,
    },
  },
  other: {
    'og:type': 'website',
    'og:site_name': SITE_CONFIG.name,
  },
}

export const revalidate = 3600 // Revalidate every hour

export default async function HomePage() {
  // Get regular posts
  const result = await getAllPosts()
  const posts = serializeBlogPosts(result.items)

  // Get most upvoted posts with better filtering criteria
  const upvotedPosts = await getMostUpvotedPosts({
    limit: 5,
    minUpvotes: 1,     // Only show posts with at least 1 upvote
    maxAgeDays: 90,    // Only consider posts from the last 90 days
    publishedOnly: true
  })
  const serializedUpvotedPosts = serializeBlogPosts(upvotedPosts)

  const announcements = await getActiveAnnouncements()

  // Generate structured data
  const websiteSchema = generateWebSiteSchema()
  const organizationSchema = generateOrganizationSchema()
  const collectionSchema = generateCollectionPageSchema(
    'Blog Posts',
    'Latest articles on software development, technology, and programming',
    '/'
  )
  const combinedSchema = combineSchemas(websiteSchema, organizationSchema, collectionSchema)

  return (
    <>
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(combinedSchema) }}
      />

      <div className="container mx-auto px-4 max-w-6xl py-12">
      {/* Mobile Asides */}
      <div className="lg:hidden space-y-6 mb-12">
        <aside className="space-y-6">
          <ActiveAnnouncements announcements={announcements} />
        </aside>
        <aside>
          <RecentPosts posts={posts} upvotedPosts={serializedUpvotedPosts} />
        </aside>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main content */}
        <main className="lg:col-span-8">
          <h1 className="text-3xl font-bold mb-8">Blog</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-12 max-w-2xl">
            Thoughts on software development, technology, and more.
          </p>
          <BlogList posts={posts} />
        </main>

        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:col-span-4 space-y-6">
          <ActiveAnnouncements announcements={announcements} />
          <RecentPosts posts={posts} upvotedPosts={serializedUpvotedPosts} />
        </aside>
      </div>
    </div>
    </>
  )
}
