'use client'

import { useState } from 'react'
import Image from 'next/image'
import { MoreVertical, MessageSquare, Trash, Edit, AlertTriangle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { type User } from 'firebase/auth'
import { CommentForm } from './comment-form'
import { useAdmin } from '@/contexts/admin-context'
import { toast } from 'sonner'
import type { Comment } from '@/types/comment'

const DEFAULT_AVATAR = '/images/default-avatar.svg'

interface Props {
  comment: Comment
  currentUser: User | null
  onReply: (parentId: string, content: string) => Promise<void>
  onEdit: (commentId: string, content: string) => Promise<void>
  onDelete: (commentId: string) => void
}

export function CommentItem({ comment, currentUser, onReply, onEdit, onDelete }: Props) {
  const [isReplying, setIsReplying] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const { isAdmin } = useAdmin()

  // Check if the current user is the author of the comment
  const isAuthor = Boolean(currentUser?.uid && comment.userId === currentUser.uid)
  const canModerate = isAdmin || isAuthor

  console.log('Comment author check:', {
    comment: {
      id: comment.id,
      userId: comment.userId,
      author: {
        name: comment.author.name,
        email: comment.author.email
      },
      content: comment.content.substring(0, 20) + '...'
    },
    currentUser: currentUser ? {
      uid: currentUser.uid,
      email: currentUser.email,
      displayName: currentUser.displayName
    } : null,
    isAuthor,
    isAdmin,
    canModerate
  })

  const handleEdit = async (content: string) => {
    try {
      await onEdit(comment.id, content)
      setIsEditing(false)
      toast.success('Comment updated successfully')
    } catch (error) {
      console.error('Error editing comment:', error)
      toast.error('Failed to edit comment')
    }
  }

  const handleReply = async (content: string) => {
    try {
      await onReply(comment.id, content)
      setIsReplying(false)
      toast.success('Reply added successfully')
    } catch (error) {
      console.error('Error adding reply:', error)
      toast.error('Failed to add reply')
    }
  }

  const handleDelete = async () => {
    try {
      await onDelete(comment.id)
      toast.success('Comment deleted successfully')
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast.error('Failed to delete comment')
    }
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
            className="rounded-full"
          />
        </div>

        {/* Comment content */}
        <div className="flex-grow space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{comment.author.name}</span>
              <span className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
              {isAdmin && !isAuthor && (
                <span className="text-xs bg-pink-100 text-pink-800 px-2 py-0.5 rounded-full">
                  Moderating
                </span>
              )}
            </div>
            
            {/* Actions dropdown */}
            {(currentUser && (isAuthor || isAdmin)) && (
              <div className="relative">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                
                {showActions && (
                  <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                    {isAuthor && (
                      <button
                        onClick={() => {
                          setShowActions(false)
                          setIsEditing(true)
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
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
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 flex items-center gap-2"
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
              initialValue={comment.content}
              onSubmit={handleEdit}
              onCancel={() => setIsEditing(false)}
              submitLabel="Save"
            />
          ) : (
            <p className="text-gray-800 dark:text-gray-200">{comment.content}</p>
          )}

          {/* Comment actions */}
          {currentUser && !isEditing && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center gap-1"
              >
                <MessageSquare className="w-4 h-4" />
                Reply
              </button>
            </div>
          )}

          {/* Reply form */}
          {isReplying && (
            <div className="mt-4">
              <CommentForm
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
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center gap-3 text-pink-600 dark:text-pink-400 mb-4">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Delete Comment</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {isAdmin && !isAuthor
                ? 'Are you sure you want to delete this comment as a moderator? This action cannot be undone.'
                : 'Are you sure you want to delete this comment? This action cannot be undone.'}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleDelete()
                  setShowConfirmDelete(false)
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 dark:bg-pink-700 dark:hover:bg-pink-800 rounded-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-12 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUser={currentUser}
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
