import { Metadata } from 'next'
import { getAllPosts } from '@/lib/blog'
import { BlogList } from '@/components/blog-list'
import { RecentPosts } from '@/components/recent-posts'
import { Announcements } from '@/components/announcements'

export const metadata: Metadata = {
  title: 'iTalkDevs - Blog',
  description: 'Thoughts on software development, technology, and more.',
}

export const revalidate = 3600 // Revalidate every hour

export default async function HomePage() {
  const posts = await getAllPosts()

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Mobile Asides */}
      <div className="lg:hidden space-y-6 mb-12">
        <RecentPosts posts={posts} />
        <Announcements />
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
          <RecentPosts posts={posts} />
          <Announcements />
        </aside>
      </div>
    </div>
  )
}
