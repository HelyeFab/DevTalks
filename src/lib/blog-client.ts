/**
 * Client-only blog operations
 *
 * This module contains all client-side blog post operations.
 * These functions can be safely imported in client components.
 */

'use client'

import { getAuth } from 'firebase/auth'
import { FirestoreError } from 'firebase/firestore'

class BlogError extends Error {
  constructor(message: string, public originalError?: FirestoreError) {
    super(message)
    this.name = 'BlogError'
  }
}

/**
 * Client-side upvote operation
 * Makes API call to server-side route handler
 */
export async function upvotePost(postId: string, _userId: string): Promise<void> {
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

/**
 * Subscribe to real-time post updates
 * (Future enhancement - not yet implemented)
 */
export function subscribeToPost(postId: string, callback: (post: any) => void): () => void {
  // TODO: Implement onSnapshot for real-time updates
  console.log('Real-time updates not yet implemented for post:', postId)
  return () => { /* unsubscribe */ }
}

/**
 * Subscribe to real-time posts list updates
 * (Future enhancement - not yet implemented)
 */
export function subscribeToPosts(callback: (posts: any[]) => void): () => void {
  // TODO: Implement onSnapshot for real-time updates
  console.log('Real-time updates not yet implemented for posts list')
  return () => { /* unsubscribe */ }
}
