'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { CommentForm } from './comment-form'
import { CommentItem } from './comment-item'
import type { Comment } from '@/types/comment'

interface Props {
  postId: string
}

export function CommentSection({ postId }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user, loading: authLoading } = useAuth()

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
      console.log('Creating comment:', { postId, content: content.substring(0, 20) + '...' })
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create comment')
      }

      const newComment = await response.json()
      console.log('Comment created:', { commentId: newComment.id })
      setComments((prev) => [newComment, ...prev])
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
      console.log('Creating reply:', { parentId, content: content.substring(0, 20) + '...' })
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      console.log('Updating comment:', { commentId, content: content.substring(0, 20) + '...' })
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update comment')
      }

      const updatedComment = await response.json()
      console.log('Comment updated:', { commentId })
      setComments((prev) =>
        prev.map((comment) => {
          if (comment.id === commentId) {
            return { ...comment, content: updatedComment.content }
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
  const handleDeleteComment = async (commentId: string) => {
    if (!user) {
      throw new Error('Authentication required')
    }

    try {
      console.log('Deleting comment:', { commentId })
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete comment')
      }

      console.log('Comment deleted:', { commentId })
      setComments((prev) => prev.filter((comment) => comment.id !== commentId))
    } catch (error) {
      console.error('Error deleting comment:', error)
      throw error instanceof Error ? error : new Error('Failed to delete comment')
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
      <h2 className="text-2xl font-bold">Comments</h2>
      <CommentForm postId={postId} onSubmit={handleCreateComment} />
      <div className="space-y-6">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onReply={(content) => handleCreateReply(comment.id, content)}
            onEdit={(content) => handleUpdateComment(comment.id, content)}
            onDelete={() => handleDeleteComment(comment.id)}
          />
        ))}
        {comments.length === 0 && (
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  )
}
