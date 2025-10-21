'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { CommentForm } from './comment-form'
import { CommentItemEnhanced } from './comment-item-enhanced'
import type { Comment, CommentSortOption } from '@/types/comment'
import { MessageCircle, ArrowUpDown } from 'lucide-react'
import { toast } from 'sonner'
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { sortComments } from '@/lib/comments-client'

interface Props {
  postId: string
}

export function CommentSectionEnhanced({ postId }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [displayComments, setDisplayComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<CommentSortOption>('newest')
  const { user, loading: authLoading } = useAuth()

  // Real-time listener for comments
  useEffect(() => {
    if (!db || !postId) {
      setIsLoading(false)
      return undefined
    }

    console.log('Setting up real-time listener for post:', postId)

    try {
      const commentsRef = collection(db, 'comments')
      const q = query(
        commentsRef,
        where('postId', '==', postId),
        orderBy('createdAt', 'desc')
      )

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          console.log('Received real-time update:', snapshot.size, 'comments')

          // Separate top-level comments and replies
          const topLevelComments: Comment[] = []
          const repliesMap = new Map<string, Comment[]>()

          snapshot.forEach((doc) => {
            const data = doc.data()
            const comment: Comment = {
              id: doc.id,
              content: data.content,
              postId: data.postId,
              userId: data.userId,
              author: data.author,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
              parentId: data.parentId,
              reactions: data.reactions || { likes: [] },
              isReported: data.isReported || false,
              status: data.status || 'active',
              replies: []
            }

            if (data.parentId) {
              const replies = repliesMap.get(data.parentId) || []
              replies.push(comment)
              repliesMap.set(data.parentId, replies)
            } else {
              topLevelComments.push(comment)
            }
          })

          // Attach replies to top-level comments
          const commentsWithReplies = topLevelComments.map(comment => ({
            ...comment,
            replies: (repliesMap.get(comment.id) || [])
              .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          }))

          setComments(commentsWithReplies)
          setFetchError(null)
          setIsLoading(false)
        },
        (error) => {
          console.error('Error in real-time listener:', error)
          setFetchError('Failed to load comments')
          setIsLoading(false)
        }
      )

      return () => {
        console.log('Cleaning up real-time listener')
        unsubscribe()
      }
    } catch (error) {
      console.error('Error setting up listener:', error)
      setFetchError('Failed to initialize comments')
      setIsLoading(false)
    }
  }, [postId])

  // Apply sorting whenever comments or sortBy changes
  useEffect(() => {
    const sorted = sortComments(comments, sortBy)
    setDisplayComments(sorted)
  }, [comments, sortBy])

  const addComment = async (content: string) => {
    if (!user) return

    // Optimistic update
    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      content,
      postId,
      userId: user.uid,
      author: {
        name: user.displayName || 'Anonymous',
        email: user.email || '',
        image: user.photoURL || undefined
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reactions: { likes: [] },
      status: 'active',
      replies: []
    }

    setComments(prev => [optimisticComment, ...prev])

    try {
      const effectivePostId = postId

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
            email: user.email || '',
            image: user.photoURL || '',
          },
        }),
      })

      // If 404, fallback to the regular posts endpoint
      if (response.status === 404) {
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
              email: user.email || '',
              image: user.photoURL || '',
            },
          }),
        })
      }

      if (!response.ok) {
        throw new Error('Failed to add comment')
      }

      toast.success('Comment added successfully')
      // Real-time listener will update the UI automatically
    } catch (error) {
      console.error('Error adding comment:', error)
      // Remove optimistic comment on error
      setComments(prev => prev.filter(c => c.id !== optimisticComment.id))
      toast.error('Failed to add comment. Please try again.')
    }
  }

  const addReply = async (parentId: string, content: string) => {
    if (!user) return

    // Optimistic update for reply
    const optimisticReply: Comment = {
      id: `temp-${Date.now()}`,
      content,
      postId,
      userId: user.uid,
      parentId,
      author: {
        name: user.displayName || 'Anonymous',
        email: user.email || '',
        image: user.photoURL || undefined
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reactions: { likes: [] },
      status: 'active'
    }

    setComments(prev => prev.map(comment =>
      comment.id === parentId ? {
        ...comment,
        replies: [...(comment.replies || []), optimisticReply]
      } : comment
    ))

    try {
      const effectivePostId = postId

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
            email: user.email || '',
            image: user.photoURL || '',
          },
        }),
      })

      // If 404, fallback to the regular posts endpoint
      if (response.status === 404) {
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
              email: user.email || '',
              image: user.photoURL || '',
            },
          }),
        })
      }

      if (!response.ok) {
        throw new Error('Failed to add reply')
      }

      toast.success('Reply added successfully')
      // Real-time listener will update the UI automatically
    } catch (error) {
      console.error('Error adding reply:', error)
      // Remove optimistic reply on error
      setComments(prev => prev.map(comment =>
        comment.id === parentId ? {
          ...comment,
          replies: (comment.replies || []).filter(r => r.id !== optimisticReply.id)
        } : comment
      ))
      toast.error('Failed to add reply. Please try again.')
    }
  }

  const editComment = async (commentId: string, content: string) => {
    if (!user) return

    try {
      const effectivePostId = postId

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
        throw new Error('Failed to edit comment')
      }

      toast.success('Comment updated successfully')
      // Real-time listener will update the UI automatically
    } catch (error) {
      console.error('Error editing comment:', error)
      toast.error('Failed to edit comment. Please try again.')
    }
  }

  const deleteComment = async (commentId: string) => {
    if (!user) return

    try {
      const effectivePostId = postId

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
        response = await fetch(`/api/posts/${effectivePostId}/comments/${commentId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await user.getIdToken()}`
          }
        })
      }

      if (!response.ok) {
        throw new Error('Failed to delete comment')
      }

      toast.success('Comment deleted successfully')
      // Real-time listener will update the UI automatically
    } catch (error) {
      console.error('Error deleting comment:', error)
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
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Comments</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({comments.length})
          </span>
        </div>

        {/* Sort dropdown */}
        {comments.length > 0 && (
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as CommentSortOption)}
              className="px-3 py-1 text-sm rounded-md focus:ring-2"
              style={{
                backgroundColor: 'var(--card)',
                color: 'var(--card-foreground)',
                borderColor: 'var(--border)',
                borderWidth: '1px',
                borderStyle: 'solid'
              }}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="most-liked">Most liked</option>
            </select>
          </div>
        )}
      </div>

      {user ? (
        <CommentForm postId={postId} onSubmit={addComment} submitLabel="Comment" />
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-3">
            Please sign in to leave a comment
          </p>
          <a
            href="/auth"
            className="inline-block px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-foreground)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary)'
            }}
          >
            Sign In
          </a>
        </div>
      )}

      <div className="space-y-6">
        {displayComments.map((comment) => (
          <CommentItemEnhanced
            key={comment.id}
            comment={comment}
            currentUser={user}
            postId={postId}
            onReply={addReply}
            onEdit={editComment}
            onDelete={deleteComment}
          />
        ))}

        {displayComments.length === 0 && (
          <p className="text-center py-8 text-gray-600 dark:text-gray-400">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  )
}
