import type { BlogPost } from '@/types/blog'

export function ensureSerializable<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T
}

export function serializeBlogPosts(posts: BlogPost[] | null | undefined): BlogPost[] {
  if (!posts || !Array.isArray(posts)) {
    return [];
  }

  return posts.map(post => ({
    ...ensureSerializable(post),
    upvotes: post.upvotes ?? 0,
    readTime: post.readTime ?? 0,
    author: {
      ...post.author,
      image: post.author?.image ?? undefined,
      uid: post.author?.uid ?? undefined
    }
  }))
}
