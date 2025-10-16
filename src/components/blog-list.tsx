import { BlogPost } from '@/types/blog'
import { PostCard } from '@/components/post-card'

interface Props {
  posts: BlogPost[]
}

// Server Component - just maps over posts and renders PostCard components
export function BlogList({ posts }: Props) {
  return (
    <div className="grid grid-cols-1 gap-12">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
