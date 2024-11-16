import { Metadata } from 'next'
import { getAllPosts } from '@/lib/blog'
import { BlogList } from '@/components/blog-list'

export const metadata: Metadata = {
  title: 'DevTalks - Blog',
  description: 'Thoughts on software development, technology, and more.',
}

export default async function HomePage() {
  const posts = await getAllPosts()

  return (
    <div className="container mx-auto px-4 max-w-6xl py-12">
      <h1 className="text-4xl font-bold mb-8">Blog</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-12 max-w-2xl">
        Thoughts on software development, technology, and more.
      </p>
      <BlogList posts={posts} />
    </div>
  )
}
