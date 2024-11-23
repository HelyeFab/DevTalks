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
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  DocumentData,
  setDoc
} from 'firebase/firestore'
import { db } from './firebase'
import { getAuth } from 'firebase/auth'
import { calculateReadTime } from '@/utils/read-time'
import type { BlogPost, Author } from '@/types/blog'

const ADMIN_EMAIL = 'emmanuelfabiani23@gmail.com'

export interface BlogPost {
  id?: string
  title: string
  subtitle: string
  content: string
  excerpt?: string
  image?: string
  imageAlt?: string
  tags: string[]
  author: Author
  date: string
  slug: string
  published: boolean
  publishedAt?: string
  upvotes?: number
  readTime?: number
}

class BlogError extends Error {
  constructor(message: string, public originalError?: FirestoreError) {
    super(message)
    this.name = 'BlogError'
  }
}

const COLLECTION_NAME = 'blog_posts'
const UPVOTES_COLLECTION = 'post_upvotes'

// Helper function to convert Firestore data to BlogPost
function convertPost(id: string, data: DocumentData): BlogPost {
  // Ensure all date fields are converted to ISO strings
  const date = data.date instanceof Timestamp 
    ? data.date.toDate().toISOString() 
    : typeof data.date === 'string'
      ? data.date
      : new Date().toISOString()

  const publishedAt = data.publishedAt instanceof Timestamp
    ? data.publishedAt.toDate().toISOString()
    : typeof data.publishedAt === 'string'
      ? data.publishedAt
      : undefined

  // Ensure author object is properly structured
  const author: Author = {
    name: data.author?.name || '',
    email: data.author?.email || '',
    image: data.author?.image || undefined,
    uid: data.author?.uid || undefined,
  }

  // Convert and sanitize the post data
  const post: BlogPost = {
    id,
    title: String(data.title || ''),
    subtitle: String(data.subtitle || ''),
    content: String(data.content || ''),
    excerpt: data.excerpt ? String(data.excerpt) : undefined,
    image: data.image ? String(data.image) : undefined,
    imageAlt: data.imageAlt ? String(data.imageAlt) : undefined,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    author,
    date,
    slug: String(data.slug || ''),
    published: Boolean(data.published),
    publishedAt,
    upvotes: typeof data.upvotes === 'number' ? data.upvotes : 0,
    readTime: typeof data.readTime === 'number' ? data.readTime : calculateReadTime(String(data.content || ''))
  }

  return post
}

// Server-side functions
export async function createPost(post: Omit<BlogPost, 'id'>): Promise<BlogPost> {
  try {
    if (!db) {
      throw new Error('Firestore is not initialized')
    }

    const auth = getAuth()
    const user = auth.currentUser
    
    if (!user) {
      throw new BlogError('User must be authenticated to create posts')
    }

    // Check if user has a profile and is admin
    const profileRef = doc(db, 'profiles', user.uid)
    const profileSnap = await getDoc(profileRef)

    // Create profile if it doesn't exist and user is admin email
    if (!profileSnap.exists() && user.email === ADMIN_EMAIL) {
      await setDoc(profileRef, {
        isAdmin: true,
        email: user.email,
        name: user.displayName || '',
        photoURL: user.photoURL || '',
        createdAt: new Date().toISOString()
      })
    } else if (!profileSnap.exists() || !profileSnap.data()?.isAdmin) {
      throw new BlogError('User must be an admin to create posts')
    }

    const postData = {
      ...post,
      date: post.date || new Date().toISOString(),
      upvotes: 0,
      readTime: calculateReadTime(post.content),
      author: {
        uid: user.uid,
        name: user.displayName || '',
        email: user.email || '',
        image: user.photoURL || ''
      }
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), postData)

    return {
      id: docRef.id,
      ...postData
    }
  } catch (error) {
    console.error('Error creating post:', error)
    throw new BlogError(
      'Failed to create post',
      error as FirestoreError
    )
  }
}

export async function updatePost(post: BlogPost): Promise<BlogPost> {
  try {
    if (!db) {
      throw new Error('Firestore is not initialized')
    }

    if (!post.id) {
      throw new Error('Post ID is required')
    }

    const docRef = doc(db, COLLECTION_NAME, post.id)
    await updateDoc(docRef, {
      ...post,
      updatedAt: new Date().toISOString(),
    })

    return post
  } catch (error) {
    console.error('Error updating post:', error)
    throw new BlogError(
      'Failed to update post',
      error as FirestoreError
    )
  }
}

export async function deletePost(id: string): Promise<void> {
  try {
    if (!db) {
      throw new Error('Firestore is not initialized')
    }

    const docRef = doc(db, COLLECTION_NAME, id)
    await deleteDoc(docRef)
  } catch (error) {
    console.error('Error deleting post:', error)
    throw new BlogError(
      'Failed to delete post',
      error as FirestoreError
    )
  }
}

export async function getPost(id: string): Promise<BlogPost | null> {
  try {
    if (!db) {
      throw new Error('Firestore is not initialized')
    }

    const docRef = doc(db, COLLECTION_NAME, id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return null
    }

    return convertPost(docSnap.id, docSnap.data())
  } catch (error) {
    console.error('Error getting post:', error)
    throw new BlogError(
      'Failed to get post',
      error as FirestoreError
    )
  }
}

export async function getAllPosts(publishedOnly = true): Promise<BlogPost[]> {
  try {
    if (!db) {
      throw new Error('Firestore is not initialized')
    }

    const postsRef = collection(db, COLLECTION_NAME)
    const constraints = publishedOnly ? [where('published', '==', true)] : []
    const q = query(postsRef, ...constraints, orderBy('date', 'desc'))
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => convertPost(doc.id, doc.data()))
  } catch (error) {
    console.error('Error getting posts:', error)
    throw new BlogError(
      'Failed to get posts',
      error as FirestoreError
    )
  }
}

export async function getPostBySlug(slug: string, includeDrafts = false): Promise<BlogPost | null> {
  try {
    if (!db) {
      throw new Error('Firestore is not initialized')
    }

    let q = query(
      collection(db, COLLECTION_NAME),
      where('slug', '==', slug),
      limit(1)
    )

    if (!includeDrafts) {
      q = query(
        q,
        where('published', '==', true)
      )
    }

    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return null
    }

    const doc = querySnapshot.docs[0]
    return convertPost(doc.id, doc.data())
  } catch (error) {
    console.error('Error getting post by slug:', error)
    throw new BlogError(
      'Failed to get post by slug',
      error as FirestoreError
    )
  }
}

export async function getPostsByTag(tag: string): Promise<BlogPost[]> {
  try {
    if (!db) {
      throw new Error('Firestore is not initialized')
    }

    const q = query(
      collection(db, COLLECTION_NAME),
      where('tags', 'array-contains', tag),
      where('published', '==', true),
      orderBy('date', 'desc')
    )

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => convertPost(doc.id, doc.data()))
  } catch (error) {
    console.error('Error getting posts by tag:', error)
    throw new BlogError(
      'Failed to get posts by tag',
      error as FirestoreError
    )
  }
}

// Client-side only functions
export async function upvotePost(postId: string, userId: string): Promise<void> {
  try {
    const idToken = await getAuth().currentUser?.getIdToken()
    if (!idToken) {
      throw new Error('User not authenticated')
    }

    const response = await fetch(`/api/posts/${postId}/upvote`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to upvote post')
    }
  } catch (error) {
    console.error('Error upvoting post:', error)
    throw new BlogError(
      'Failed to upvote post',
      error as FirestoreError
    )
  }
}

export async function hasUserUpvoted(postId: string, userId: string | null): Promise<boolean> {
  if (!userId) return false

  try {
    if (!db) {
      throw new Error('Firestore is not initialized')
    }

    const docRef = doc(db, `${COLLECTION_NAME}/${postId}/upvotes`, userId)
    const docSnap = await getDoc(docRef)
    return docSnap.exists()
  } catch (error) {
    console.error('Error checking upvote status:', error)
    return false
  }
}
