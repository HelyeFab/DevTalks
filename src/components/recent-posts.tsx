import type { BlogPost } from '@/types/blog'
import { RecentPostsTabs } from './recent-posts-tabs'

interface RecentPostsProps {
  posts: BlogPost[]
  upvotedPosts?: BlogPost[]
}

// Server Component - prepares data and renders Client Component for interactivity
export function RecentPosts({ posts, upvotedPosts }: RecentPostsProps) {
  // Use provided upvoted posts if available, otherwise fall back to sorting the regular posts
  const mostLikedPosts = upvotedPosts ||
    [...posts].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))

  const recentPosts = [...posts].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div className="bg-card rounded-lg shadow-sm p-4 border border-border">
      <RecentPostsTabs
        recentPosts={recentPosts.slice(0, 3)}
        mostLikedPosts={mostLikedPosts.slice(0, 3)}
      />
    </div>
  )
}
