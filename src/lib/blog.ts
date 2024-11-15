import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  FirestoreError,
  increment,
  runTransaction,
  limit
} from 'firebase/firestore'
import { db } from './firebase'

export interface BlogPost {
  id?: string
  title: string
  subtitle: string
  content: string
  excerpt?: string
  image?: string
  imageAlt?: string
  tags: string[]
  author: {
    name: string
    email: string
    image?: string
  }
  date: string
  slug: string
  published: boolean
  publishedAt?: string
  upvotes?: number
}

class BlogError extends Error {
  constructor(message: string, public originalError?: FirestoreError) {
    super(message)
    this.name = 'BlogError'
  }
}

const COLLECTION_NAME = 'blog_posts'
const UPVOTES_COLLECTION = 'post_upvotes'

// Server-side functions
export async function createPost(post: Omit<BlogPost, 'id'>): Promise<string> {
  try {
    const response = await fetch('/api/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post)
    })
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create post')
    }
    
    return data.id
  } catch (error) {
    console.error('Error in createPost:', error)
    throw new BlogError('Failed to create post')
  }
}

export async function updatePost(id: string, post: Partial<BlogPost>): Promise<void> {
  try {
    const response = await fetch(`/api/blog/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post)
    })
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update post')
    }
  } catch (error) {
    console.error('Error in updatePost:', error)
    throw new BlogError('Failed to update post')
  }
}

export async function deletePost(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/blog/${id}`, {
      method: 'DELETE'
    })
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete post')
    }
  } catch (error) {
    console.error('Error in deletePost:', error)
    throw new BlogError('Failed to delete post')
  }
}

export async function getPost(id: string): Promise<BlogPost | null> {
  try {
    const response = await fetch(`/api/blog/${id}`)
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch post')
    }
    
    return data.post
  } catch (error) {
    console.error('Error in getPost:', error)
    throw new BlogError('Failed to fetch post')
  }
}

export async function getAllPosts(publishedOnly = true): Promise<BlogPost[]> {
  try {
    console.log('Fetching all posts')
    let q = query(
      collection(db, COLLECTION_NAME),
      orderBy('date', 'desc'),
      limit(50)
    )

    if (publishedOnly) {
      q = query(q, where('published', '==', true))
    }

    const querySnapshot = await getDocs(q)
    const posts = querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        title: data.title,
        subtitle: data.subtitle,
        content: data.content,
        excerpt: data.excerpt,
        image: data.image,
        imageAlt: data.imageAlt,
        tags: data.tags,
        author: data.author,
        date: data.date.toDate().toISOString(),
        slug: data.slug,
        published: data.published,
        publishedAt: data.publishedAt?.toDate()?.toISOString(),
        upvotes: data.upvotes
      } as BlogPost
    })

    console.log('Posts fetched successfully:', {
      count: posts.length,
      postsWithImages: posts.filter(p => !!p.image).length
    })
    return posts
  } catch (error) {
    console.error('Error in getAllPosts:', error)
    return []
  }
}

export async function getPostBySlug(slug: string, includeDrafts = false): Promise<BlogPost | null> {
  try {
    console.log('Fetching post by slug:', slug)
    const q = query(
      collection(db, COLLECTION_NAME),
      where('slug', '==', slug),
      where('published', '==', true),
      limit(1)
    )
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.log('Post not found:', slug)
      return null
    }

    const doc = querySnapshot.docs[0]
    const data = doc.data()

    if (!includeDrafts && !data.published) {
      console.log('Post is not published:', slug)
      return null
    }

    const post: BlogPost = {
      id: doc.id,
      title: data.title,
      subtitle: data.subtitle,
      content: data.content,
      excerpt: data.excerpt,
      image: data.image,
      imageAlt: data.imageAlt,
      tags: data.tags,
      author: data.author,
      date: data.date.toDate().toISOString(),
      slug: data.slug,
      published: data.published,
      publishedAt: data.publishedAt?.toDate()?.toISOString(),
      upvotes: data.upvotes
    }

    console.log('Post fetched successfully:', {
      slug,
      hasImage: !!post.image
    })
    return post
  } catch (error) {
    console.error('Error in getPostBySlug:', error)
    return null
  }
}

export async function getPostsByTag(tag: string): Promise<BlogPost[]> {
  try {
    const response = await fetch(`/api/blog?tag=${encodeURIComponent(tag)}`)
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch posts')
    }
    
    return data.posts
  } catch (error) {
    console.error('Error in getPostsByTag:', error)
    throw new BlogError('Failed to fetch posts')
  }
}

// Client-side only functions
export async function upvotePost(postId: string, userId: string): Promise<void> {
  if (!userId) {
    throw new BlogError('Must be logged in to upvote')
  }

  try {
    await runTransaction(db, async (transaction) => {
      const upvoteRef = doc(db, UPVOTES_COLLECTION, `${postId}_${userId}`)
      const upvoteDoc = await transaction.get(upvoteRef)

      if (upvoteDoc.exists()) {
        throw new BlogError('Already upvoted this post')
      }

      const postRef = doc(db, COLLECTION_NAME, postId)
      const postDoc = await transaction.get(postRef)

      if (!postDoc.exists()) {
        throw new BlogError('Post not found')
      }

      transaction.set(upvoteRef, {
        postId,
        userId,
        timestamp: Timestamp.now()
      })

      transaction.update(postRef, {
        upvotes: increment(1)
      })
    })

    console.log('Post upvoted successfully:', { postId, userId })
  } catch (error) {
    console.error('Error in upvotePost:', error)
    throw new BlogError('Failed to upvote post')
  }
}

export async function hasUserUpvoted(postId: string, userId: string | null): Promise<boolean> {
  if (!userId) return false

  try {
    const upvoteRef = doc(db, UPVOTES_COLLECTION, `${postId}_${userId}`)
    const upvoteDoc = await getDoc(upvoteRef)
    return upvoteDoc.exists()
  } catch (error) {
    console.error('Error checking upvote status:', error)
    return false
  }
}
