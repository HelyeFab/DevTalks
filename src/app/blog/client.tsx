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
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-12 text-center">Blog</h1>
        {displayPosts.length === 0 ? (
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No posts found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-12">
            {displayPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}