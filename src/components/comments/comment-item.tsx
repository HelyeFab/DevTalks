'use client'

import { useState } from 'react'
import Image from 'next/image'
import { MoreVertical, MessageSquare, Trash, Edit } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { type User } from 'firebase/auth'
import { CommentForm } from './comment-form'
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

  // Check if the current user is the author of the comment
  const isAuthor = Boolean(currentUser?.uid && comment.userId === currentUser.uid)

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
    isAuthor
  })

  const handleEdit = async (content: string) => {
    try {
      await onEdit(comment.id, content)
      setIsEditing(false)
    } catch (error) {
      console.error('Error editing comment:', error)
    }
  }

  const handleDelete = () => {
    onDelete(comment.id)
    setShowActions(false)
  }

  const handleReply = async (content: string) => {
    try {
      await onReply(comment.id, content)
      setIsReplying(false)
    } catch (error) {
      console.error('Error replying to comment:', error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
        <div className="flex items-start gap-4">
          {/* Author Image */}
          <div className="flex-shrink-0">
            {comment.author.image ? (
              <Image
                src={comment.author.image}
                alt={comment.author.name}
                width={40}
                height={40}
                className="rounded-full"
                style={{ width: '40px', height: '40px' }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = DEFAULT_AVATAR
                  target.onerror = null // Prevent infinite loop
                }}
              />
            ) : (
              <Image
                src={DEFAULT_AVATAR}
                alt={comment.author.name}
                width={40}
                height={40}
                className="rounded-full"
                style={{ width: '40px', height: '40px' }}
              />
            )}
          </div>

          {/* Comment Content */}
          <div className="min-w-0 flex-grow">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  {comment.author.name}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>

              {/* Actions Menu */}
              {isAuthor && (
                <div className="relative">
                  <button
                    onClick={() => setShowActions(!showActions)}
                    className="rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>

                  {showActions && (
                    <div className="absolute right-0 z-10 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                      <button
                        onClick={() => {
                          setIsEditing(true)
                          setShowActions(false)
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={handleDelete}
                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700"
                      >
                        <Trash className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {isEditing ? (
              <CommentForm
                initialValue={comment.content}
                onSubmit={handleEdit}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <div className="mt-2">
                <p className="text-gray-900 dark:text-gray-100">{comment.content}</p>
              </div>
            )}

            {/* Reply Button */}
            {currentUser && !isEditing && (
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="mt-2 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <MessageSquare className="h-4 w-4" />
                Reply
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reply Form */}
      {isReplying && (
        <div className="ml-12">
          <CommentForm
            onSubmit={handleReply}
            onCancel={() => setIsReplying(false)}
            submitLabel="Reply"
          />
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
