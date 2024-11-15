'use client'

import { useAuth } from '@/contexts/auth-context'
import { BlogPost } from '@/lib/blog'
import { PostCard } from '@/components/post-card'

interface Props {
  posts: BlogPost[]
}

export default function BlogPageClient({ posts }: Props) {
  const { isAdmin } = useAuth()

  // Filter out unpublished posts for non-admin users
  const displayPosts = isAdmin ? posts : posts.filter((post) => post.published)

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <h1 className="text-4xl font-bold mb-8">Blog</h1>
      {displayPosts.length === 0 ? (
        <div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">No posts found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}