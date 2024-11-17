'use client'

import { BlogPost } from '@/types/blog'
import { PostCard } from '@/components/post-card'

interface Props {
  posts: BlogPost[]
}

export function BlogList({ posts }: Props) {
  return (
    <div className="grid grid-cols-1 gap-12">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
