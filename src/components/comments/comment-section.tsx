'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { CommentForm } from './comment-form'
import { CommentItem } from './comment-item'
import type { Comment } from '@/types/comment'
import { MessageCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  postId: string
}

export function CommentSection({ postId }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const { user, loading: authLoading } = useAuth()

  // Check if we're in the test blog post (development mode convenience)
  const isTestPost = postId === 'test' || postId === 'test-post' || postId === 'pDdGSv9wkeTbLqw6VHOD';

  // Fetch comments
  useEffect(() => {
    fetchComments()
  }, [postId])

  const fetchComments = async () => {
    try {
      console.log('Fetching comments for post:', { postId })

      // Always use the actual postId
      const effectivePostId = postId;
      console.log('Using effective post ID:', effectivePostId);

      // Try to fetch from MDX endpoint first (for MDX posts)
      let response = await fetch(`/api/mdx-posts/${effectivePostId}/comments`)

      // If not found (404), try the regular posts endpoint
      if (response.status === 404) {
        console.log('Post not found in MDX posts, trying regular posts API')
        response = await fetch(`/api/posts/${effectivePostId}/comments`)
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('Fetched comments:', { count: data.length })

      if (Array.isArray(data)) {
        setComments(data)
      } else {
        console.error('Unexpected response format:', data)
        setComments([])
      }
    } catch (error) {
      console.error('Error fetching comments:', error instanceof Error ? error.message : 'Unknown error')
      setFetchError(error instanceof Error ? error.message : 'Failed to fetch comments')
      setComments([])
    } finally {
      setIsLoading(false)
    }
  }

  const addComment = async (content: string) => {
    if (!user) return

    try {
      // Always use the actual postId
      const effectivePostId = postId;

      // First try posting to MDX endpoint
      let response = await fetch(`/api/mdx-posts/${effectivePostId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          content,
          postId,
          author: {
            name: user.displayName || 'Anonymous',
            email: user.email,
            image: user.photoURL,
          },
        }),
      })

      // If 404, fallback to the regular posts endpoint
      if (response.status === 404) {
        console.log('Post not found in MDX posts, trying regular posts API for comment creation')
        response = await fetch(`/api/posts/${effectivePostId}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await user.getIdToken()}`
          },
          body: JSON.stringify({
            content,
            postId,
            author: {
              name: user.displayName || 'Anonymous',
              email: user.email,
              image: user.photoURL,
            },
          }),
        })
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const newComment = await response.json()
      setComments(prev => [newComment, ...prev])
      toast.success('Comment added successfully')
    } catch (error) {
      console.error('Error adding comment:', error instanceof Error ? error.message : 'Unknown error')
      toast.error('Failed to add comment. Please try again.')
    }
  }

  const addReply = async (parentId: string, content: string) => {
    if (!user) return

    try {
      // Always use the actual postId
      const effectivePostId = postId;

      // First try posting to MDX endpoint
      let response = await fetch(`/api/mdx-posts/${effectivePostId}/comments/${parentId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          content,
          postId,
          author: {
            name: user.displayName || 'Anonymous',
            email: user.email,
            image: user.photoURL,
          },
        }),
      })

      // If 404, fallback to the regular posts endpoint
      if (response.status === 404) {
        console.log('Post not found in MDX posts, trying regular posts API for reply creation')
        response = await fetch(`/api/posts/${effectivePostId}/comments/${parentId}/replies`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await user.getIdToken()}`
          },
          body: JSON.stringify({
            content,
            postId,
            author: {
              name: user.displayName || 'Anonymous',
              email: user.email,
              image: user.photoURL,
            },
          }),
        })
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const newReply = await response.json()
      setComments(prev => prev.map(comment =>
        comment.id === parentId ? {
          ...comment,
          replies: [...(comment.replies || []), newReply]
        } : comment
      ))
      toast.success('Reply added successfully')
    } catch (error) {
      console.error('Error adding reply:', error instanceof Error ? error.message : 'Unknown error')
      toast.error('Failed to add reply. Please try again.')
    }
  }

  const editComment = async (commentId: string, content: string) => {
    if (!user) return

    try {
      // Always use the actual postId
      const effectivePostId = postId;

      // First try MDX endpoint
      let response = await fetch(`/api/mdx-posts/${effectivePostId}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({ content, postId }),
      })

      // If 404, fallback to regular posts endpoint
      if (response.status === 404) {
        console.log('Post not found in MDX posts, trying regular posts API for edit')
        response = await fetch(`/api/posts/${effectivePostId}/comments/${commentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await user.getIdToken()}`
          },
          body: JSON.stringify({ content, postId }),
        })
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const { success } = await response.json()
      if (success) {
        setComments(prev => prev.map(comment =>
          comment.id === commentId ? {
            ...comment,
            content,
            updatedAt: new Date().toISOString()
          } : comment
        ))
        toast.success('Comment updated successfully')
      }
    } catch (error) {
      console.error('Error editing comment:', error instanceof Error ? error.message : 'Unknown error')
      toast.error('Failed to edit comment. Please try again.')
    }
  }

  const deleteComment = async (commentId: string) => {
    if (!user) return

    try {
      // Always use the actual postId
      const effectivePostId = postId;

      // First try MDX endpoint
      let response = await fetch(`/api/mdx-posts/${effectivePostId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      })

      // If 404, fallback to regular posts endpoint
      if (response.status === 404) {
        console.log('Post not found in MDX posts, trying regular posts API for delete')
        response = await fetch(`/api/posts/${effectivePostId}/comments/${commentId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await user.getIdToken()}`
          }
        })
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const { success } = await response.json()
      if (success) {
        setComments(prev => prev.filter(comment => comment.id !== commentId))
        toast.success('Comment deleted successfully')
      }
    } catch (error) {
      console.error('Error deleting comment:', error instanceof Error ? error.message : 'Unknown error')
      toast.error('Failed to delete comment. Please try again.')
    }
  }

  if (isLoading || authLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">{fetchError}</p>
        <button
          onClick={fetchComments}
          className="mt-4 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">Comments</h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          ({comments.length})
        </span>
      </div>

      {user ? (
        <CommentForm postId={postId} onSubmit={addComment} submitLabel="Comment" />
      ) : (
        <p className="text-center py-4 text-gray-600 dark:text-gray-400">
          Please sign in to comment
        </p>
      )}

      <div className="space-y-6">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            currentUser={user}
            onReply={addReply}
            onEdit={editComment}
            onDelete={deleteComment}
          />
        ))}

        {comments.length === 0 && (
          <p className="text-center py-8 text-gray-600 dark:text-gray-400">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  )
}
