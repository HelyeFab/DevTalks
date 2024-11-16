'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { CommentForm } from './comment-form'
import { CommentItem } from './comment-item'
import type { Comment } from '@/types/comment'
import { MessageCircle } from 'lucide-react'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'

interface Props {
  postId: string
}

export function CommentSection({ postId }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const { user, loading: authLoading } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null)

  // Fetch comments
  useEffect(() => {
    fetchComments()
  }, [postId])

  const fetchComments = async () => {
    try {
      console.log('Fetching comments for post:', { postId })
      const response = await fetch(`/api/posts/${postId}/comments`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
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
      console.error('Error fetching comments:', error)
      setFetchError(error instanceof Error ? error.message : 'Failed to fetch comments')
      setComments([])
    } finally {
      setIsLoading(false)
    }
  }

  // Create comment
  const handleCreateComment = async (content: string) => {
    if (!user) {
      throw new Error('Authentication required')
    }

    try {
      console.log('Current user:', {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      })

      console.log('Creating comment:', { 
        postId, 
        userId: user.uid,
        content: content.substring(0, 20) + '...'
      })

      const token = await user.getIdToken()
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create comment')
      }

      const comment = await response.json()
      console.log('Comment created:', { commentId: comment.id })
      setComments((prev) => [comment, ...prev])
    } catch (error) {
      console.error('Error creating comment:', error)
      throw error instanceof Error ? error : new Error('Failed to create comment')
    }
  }

  // Create reply
  const handleCreateReply = async (parentId: string, content: string) => {
    if (!user) {
      throw new Error('Authentication required')
    }

    try {
      const token = await user.getIdToken()
      console.log('Creating reply:', { parentId, content: content.substring(0, 20) + '...' })
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content, parentId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create reply')
      }

      const newReply = await response.json()
      console.log('Reply created:', { commentId: newReply.id })
      setComments((prev) =>
        prev.map((comment) => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newReply],
            }
          }
          return comment
        })
      )
    } catch (error) {
      console.error('Error creating reply:', error)
      throw error instanceof Error ? error : new Error('Failed to create reply')
    }
  }

  // Update comment
  const handleUpdateComment = async (commentId: string, content: string) => {
    if (!user) {
      throw new Error('Authentication required')
    }

    try {
      console.log('Getting token for user:', { 
        id: user.uid,
        email: user.email,
        name: user.displayName 
      })

      const token = await user.getIdToken()
      console.log('Got token:', token.substring(0, 20) + '...')

      console.log('Updating comment:', { 
        commentId, 
        content: content.substring(0, 20) + '...',
        token: token.substring(0, 20) + '...'
      })

      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Comment update failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error
        })
        throw new Error(errorData.error || 'Failed to update comment')
      }

      console.log('Comment updated successfully:', { commentId })
      setComments((prev) =>
        prev.map((comment) => {
          if (comment.id === commentId) {
            return { ...comment, content }
          }
          return comment
        })
      )
    } catch (error) {
      console.error('Error updating comment:', error)
      throw error instanceof Error ? error : new Error('Failed to update comment')
    }
  }

  // Delete comment
  const handleDeleteComment = (commentId: string) => {
    setCommentToDelete(commentId)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!user || !commentToDelete) {
      throw new Error('Authentication required')
    }

    try {
      console.log('Getting token for user:', { 
        id: user.uid,
        email: user.email,
        name: user.displayName 
      })

      const token = await user.getIdToken()
      console.log('Got token:', token.substring(0, 20) + '...')

      console.log('Deleting comment:', { 
        commentId: commentToDelete,
        token: token.substring(0, 20) + '...'
      })

      const response = await fetch(`/api/comments/${commentToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Comment deletion failed:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error
        })
        throw new Error(errorData.error || 'Failed to delete comment')
      }

      console.log('Comment deleted successfully:', { commentId: commentToDelete })
      setComments((prev) => prev.filter((comment) => comment.id !== commentToDelete))
    } catch (error) {
      console.error('Error deleting comment:', error)
      throw error instanceof Error ? error : new Error('Failed to delete comment')
    } finally {
      setCommentToDelete(null)
      setDeleteModalOpen(false)
    }
  }

  if (isLoading || authLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg mb-4"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-6 h-6" />
        <h2 className="text-2xl font-bold">Comments</h2>
        <span className="text-gray-500">({comments.length})</span>
      </div>

      {fetchError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-600 dark:text-red-400">
          {fetchError}
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <CommentForm postId={postId} onSubmit={handleCreateComment} />
      
      <div className="space-y-6">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            currentUser={user}
            onReply={handleCreateReply}
            onEdit={handleUpdateComment}
            onDelete={handleDeleteComment}
          />
        ))}
        
        {comments.length === 0 && !fetchError && (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              No comments yet
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Be the first to share your thoughts!
            </p>
          </div>
        )}
      </div>
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  )
}
