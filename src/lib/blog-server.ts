/**
 * Server-only blog operations
 *
 * This module contains all server-side blog post operations that interact
 * directly with Firestore. It should NEVER be imported in client components.
 */

import 'server-only'

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
import { PaginationParams, PaginationResult, DEFAULT_PAGINATION, paginateArray } from './pagination'

// Use environment variable for admin email
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

// Export the imported type for convenience
export type { BlogPost, Author }

class BlogError extends Error {
  constructor(message: string, public originalError?: FirestoreError) {
    super(message)
    this.name = 'BlogError'
  }
}

const COLLECTION_NAME = 'blog_posts'

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
    image: data.image !== undefined && data.image !== null ? String(data.image) : undefined,
    imageAlt: data.imageAlt !== undefined && data.imageAlt !== null ? String(data.imageAlt) : undefined,
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

    // Create update data without the id field
    const { id, ...updateData } = post

    const docRef = doc(db, COLLECTION_NAME, post.id)
    await updateDoc(docRef, {
      ...updateData,
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

/**
 * Get all blog posts with pagination support
 */
export async function getAllPosts(
  options: {
    publishedOnly?: boolean,
    pagination?: PaginationParams
  } = {}
): Promise<PaginationResult<BlogPost>> {
  try {
    if (!db) {
      throw new Error('Firestore is not initialized')
    }

    const { publishedOnly = true, pagination = DEFAULT_PAGINATION } = options;

    const postsRef = collection(db, COLLECTION_NAME);
    let q = query(postsRef);

    // Start with a simple query - just sort by date
    q = query(postsRef, orderBy('date', pagination.orderDirection || 'desc'));

    // Execute the query
    const querySnapshot = await getDocs(q);
    let allPosts = querySnapshot.docs.map(doc => convertPost(doc.id, doc.data()));

    // If we need to filter for published posts, do it in memory
    if (publishedOnly) {
      allPosts = allPosts.filter(post => post.published);
    }

    // Apply pagination
    return paginateArray(allPosts, pagination);
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

    // Use a simple query without composite indexes
    const q = query(
      collection(db, COLLECTION_NAME),
      where('slug', '==', slug)
    );

    const querySnapshot = await getDocs(q);

    // Process results in memory
    if (querySnapshot.empty) {
      return null;
    }

    // Filter for published status in memory if needed
    const docs = querySnapshot.docs;
    for (const doc of docs) {
      const post = convertPost(doc.id, doc.data());
      if (includeDrafts || post.published) {
        return post;
      }
    }

    return null;
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

    // Use a simpler query to avoid composite index requirements
    const q = query(
      collection(db, COLLECTION_NAME),
      where('tags', 'array-contains', tag)
    );

    const querySnapshot = await getDocs(q);

    // Filter and sort in memory
    const posts = querySnapshot.docs
      .map(doc => convertPost(doc.id, doc.data()))
      .filter(post => post.published)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return posts;
  } catch (error) {
    console.error('Error getting posts by tag:', error)
    throw new BlogError(
      'Failed to get posts by tag',
      error as FirestoreError
    )
  }
}

/**
 * Get most upvoted blog posts
 */
export async function getMostUpvotedPosts(
  options: {
    limit?: number,
    publishedOnly?: boolean,
    minUpvotes?: number,
    maxAgeDays?: number
  } = {}
): Promise<BlogPost[]> {
  try {
    if (!db) {
      throw new Error('Firestore is not initialized')
    }

    const {
      limit: postLimit = 5,
      publishedOnly = true,
      minUpvotes = 1,
      maxAgeDays = 90
    } = options;

    // Calculate the cutoff date for the age filter
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
    const cutoffDateIso = cutoffDate.toISOString();

    // Query for posts ordered by upvotes in descending order
    const postsRef = collection(db, COLLECTION_NAME);
    let q = query(
      postsRef,
      orderBy('upvotes', 'desc'),
      limit(postLimit * 2)
    );

    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map(doc => convertPost(doc.id, doc.data()));

    // Filter in memory for more complex criteria
    const filteredPosts = posts.filter(post => {
      if (publishedOnly && !post.published) {
        return false;
      }

      if ((post.upvotes || 0) < minUpvotes) {
        return false;
      }

      if (maxAgeDays > 0 && post.date < cutoffDateIso) {
        return false;
      }

      return true;
    });

    return filteredPosts.slice(0, postLimit);
  } catch (error) {
    console.error('Error getting most upvoted posts:', error);
    throw new BlogError('Failed to get most upvoted posts', error as FirestoreError);
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
