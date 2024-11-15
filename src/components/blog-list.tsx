'use client'

import { BlogPost } from '@/types/blog'
import { PostCard } from '@/components/post-card'

interface Props {
  posts: BlogPost[]
}

export function BlogList({ posts }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
