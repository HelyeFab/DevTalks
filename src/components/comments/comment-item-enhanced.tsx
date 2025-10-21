'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  MoreVertical,
  MessageSquare,
  Trash,
  Edit,
  AlertTriangle,
  Heart,
  Flag
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { type User } from 'firebase/auth'
import { CommentForm } from './comment-form'
import { ReportModal } from './report-modal'
import { useAdmin } from '@/contexts/admin-context'
import { toast } from 'sonner'
import type { Comment } from '@/types/comment'

const DEFAULT_AVATAR = '/images/default-avatar.svg'

interface Props {
  comment: Comment
  currentUser: User | null
  postId: string
  onReply: (parentId: string, content: string) => Promise<void>
  onEdit: (commentId: string, content: string) => Promise<void>
  onDelete: (commentId: string) => void
}

export function CommentItemEnhanced({
  comment,
  currentUser,
  postId,
  onReply,
  onEdit,
  onDelete
}: Props) {
  const [isReplying, setIsReplying] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [likeCount, setLikeCount] = useState(comment.reactions?.likes?.length || 0)
  const [hasLiked, setHasLiked] = useState(
    currentUser ? comment.reactions?.likes?.includes(currentUser.uid) || false : false
  )
  const { isAdmin } = useAdmin()

  // Check if the current user is the author of the comment
  const isAuthor = Boolean(currentUser?.uid && comment.userId === currentUser.uid)

  const handleLike = async () => {
    if (!currentUser || isLiking) return

    setIsLiking(true)
    const previousLikeCount = likeCount
    const previousHasLiked = hasLiked

    // Optimistic update
    setHasLiked(!hasLiked)
    setLikeCount(hasLiked ? likeCount - 1 : likeCount + 1)

    try {
      const response = await fetch(`/api/comments/${comment.id}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await currentUser.getIdToken()}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to toggle reaction')
      }

      const result = await response.json()
      setHasLiked(result.liked)
      setLikeCount(result.likeCount)
    } catch (error) {
      console.error('Error toggling like:', error)
      // Revert optimistic update
      setHasLiked(previousHasLiked)
      setLikeCount(previousLikeCount)
      toast.error('Failed to update reaction')
    } finally {
      setIsLiking(false)
    }
  }

  const handleReport = async (reason: string) => {
    if (!currentUser) return

    try {
      const response = await fetch(`/api/comments/${comment.id}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await currentUser.getIdToken()}`
        },
        body: JSON.stringify({ reason })
      })

      if (!response.ok) {
        throw new Error('Failed to report comment')
      }

      toast.success('Comment reported successfully. Our team will review it.')
      setShowReportModal(false)
    } catch (error) {
      console.error('Error reporting comment:', error)
      toast.error('Failed to report comment')
    }
  }

  const handleEdit = async (content: string) => {
    try {
      await onEdit(comment.id, content)
      setIsEditing(false)
    } catch (error) {
      console.error('Error editing comment:', error)
    }
  }

  const handleReply = async (content: string) => {
    try {
      await onReply(comment.id, content)
      setIsReplying(false)
    } catch (error) {
      console.error('Error adding reply:', error)
    }
  }

  const handleDelete = async () => {
    try {
      await onDelete(comment.id)
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }

  // Don't show hidden comments to non-admins
  if (comment.status === 'hidden' && !isAdmin) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <Image
            src={comment.author.image || DEFAULT_AVATAR}
            alt={comment.author.name}
            width={40}
            height={40}
            className="rounded-full object-cover object-center-top"
          />
        </div>

        {/* Comment content */}
        <div className="flex-grow space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{comment.author.name}</span>
              <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
              {isAdmin && !isAuthor && (
                <span className="text-xs bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300 px-2 py-0.5 rounded-full">
                  Moderating
                </span>
              )}
              {comment.status === 'hidden' && (
                <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 px-2 py-0.5 rounded-full">
                  Hidden
                </span>
              )}
              {comment.isReported && isAdmin && (
                <span className="text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 px-2 py-0.5 rounded-full">
                  Reported
                </span>
              )}
            </div>

            {/* Actions dropdown */}
            {currentUser && (isAuthor || isAdmin) && (
              <div className="relative">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="p-1 transition-colors"
                  style={{ color: 'var(--muted-foreground)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--foreground)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted-foreground)'}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {showActions && (
                  <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg z-10" style={{
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--border)',
                    borderWidth: '1px',
                    borderStyle: 'solid'
                  }}>
                    {isAuthor && (
                      <button
                        onClick={() => {
                          setShowActions(false)
                          setIsEditing(true)
                        }}
                        className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors"
                        style={{ color: 'var(--card-foreground)' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--accent)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowActions(false)
                        setShowConfirmDelete(true)
                      }}
                      className="w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors"
                      style={{ color: 'var(--destructive)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--destructive)'
                        e.currentTarget.style.color = 'var(--destructive-foreground)'
                        e.currentTarget.style.opacity = '0.9'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = 'var(--destructive)'
                        e.currentTarget.style.opacity = '1'
                      }}
                    >
                      <Trash className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Comment text */}
          {isEditing ? (
            <CommentForm
              postId={postId}
              initialValue={comment.content}
              onSubmit={handleEdit}
              onCancel={() => setIsEditing(false)}
              submitLabel="Save"
            />
          ) : (
            <p style={{ color: 'var(--foreground)' }}>{comment.content}</p>
          )}

          {/* Comment actions */}
          {!isEditing && (
            <div className="flex items-center gap-4 flex-wrap">
              {/* Like button */}
              {currentUser && (
                <button
                  onClick={handleLike}
                  disabled={isLiking}
                  className="flex items-center gap-1 text-sm transition-colors"
                  style={{
                    color: hasLiked ? '#ef4444' : 'var(--muted-foreground)'
                  }}
                  onMouseEnter={(e) => {
                    if (!hasLiked) e.currentTarget.style.color = '#ef4444'
                  }}
                  onMouseLeave={(e) => {
                    if (!hasLiked) e.currentTarget.style.color = 'var(--muted-foreground)'
                  }}
                >
                  <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
                  <span>{likeCount > 0 ? likeCount : 'Like'}</span>
                </button>
              )}

              {/* Reply button */}
              {currentUser && !isAuthor && (
                <button
                  onClick={() => setIsReplying(!isReplying)}
                  className="text-sm flex items-center gap-1 transition-colors"
                  style={{ color: 'var(--muted-foreground)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--foreground)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted-foreground)'}
                >
                  <MessageSquare className="w-4 h-4" />
                  Reply
                </button>
              )}

              {/* Report button */}
              {currentUser && !isAuthor && (
                <button
                  onClick={() => setShowReportModal(true)}
                  className="text-sm flex items-center gap-1 transition-colors"
                  style={{ color: 'var(--muted-foreground)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--foreground)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted-foreground)'}
                >
                  <Flag className="w-4 h-4" />
                  Report
                </button>
              )}
            </div>
          )}

          {/* Reply form */}
          {isReplying && (
            <div className="mt-4">
              <CommentForm
                postId={postId}
                parentId={comment.id}
                onSubmit={handleReply}
                onCancel={() => setIsReplying(false)}
                submitLabel="Reply"
              />
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="p-6 rounded-lg shadow-xl max-w-md w-full mx-4" style={{ backgroundColor: 'var(--card)' }}>
            <div className="flex items-center gap-3 mb-4" style={{ color: 'var(--destructive)' }}>
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Delete Comment</h3>
            </div>
            <p className="mb-6" style={{ color: 'var(--muted-foreground)' }}>
              {isAdmin && !isAuthor
                ? 'Are you sure you want to delete this comment as a moderator? This action cannot be undone.'
                : 'Are you sure you want to delete this comment? This action cannot be undone.'}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 text-sm font-medium transition-colors"
                style={{ color: 'var(--muted-foreground)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--foreground)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted-foreground)'}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDelete()
                  setShowConfirmDelete(false)
                }}
                className="px-4 py-2 text-sm font-medium rounded-md"
                style={{
                  backgroundColor: 'var(--destructive)',
                  color: 'var(--destructive-foreground)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report modal */}
      {showReportModal && (
        <ReportModal
          onSubmit={handleReport}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-12 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItemEnhanced
              key={reply.id}
              comment={reply}
              currentUser={currentUser}
              postId={postId}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
