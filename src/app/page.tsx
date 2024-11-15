import { Metadata } from 'next'
import { getAllPosts } from '@/lib/blog'
import { BlogList } from '@/components/blog-list'

export const metadata: Metadata = {
  title: 'Emmanuel Fabiani - Blog',
  description: 'Thoughts on software development, technology, and more.',
}

export default async function HomePage() {
  const posts = await getAllPosts()

  return (
    <main className="flex-auto">
      <div className="px-4 py-16 sm:px-8 sm:py-24 lg:px-12">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Blog
          </h1>
          <p className="mt-6 text-base text-gray-600 dark:text-gray-400">
            Thoughts on software development, technology, and more.
          </p>
        </div>
        <div className="mt-16">
          <BlogList posts={posts} />
        </div>
      </div>
    </main>
  )
}
