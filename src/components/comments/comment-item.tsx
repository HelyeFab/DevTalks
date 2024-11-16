'use client'

import { useState } from 'react'
import Image from 'next/image'
import { MoreVertical, MessageSquare, Trash, Edit } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '@/contexts/auth-context'
import { CommentForm } from './comment-form'
import type { Comment } from '@/types/comment'

const DEFAULT_AVATAR = '/images/default-avatar.svg'

interface Props {
  comment: Comment
  onReply: (content: string) => Promise<void>
  onEdit: (content: string) => Promise<void>
  onDelete: () => Promise<void>
}

export function CommentItem({ comment, onReply, onEdit, onDelete }: Props) {
  const [isReplying, setIsReplying] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const { user } = useAuth()

  const isAuthor = user?.id === comment.userId

  const handleReply = async (content: string) => {
    await onReply(content)
    setIsReplying(false)
  }

  const handleEdit = async (content: string) => {
    await onEdit(content)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      await onDelete()
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
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
                  const target = e.target as HTMLImageElement;
                  target.src = DEFAULT_AVATAR;
                  target.onerror = null; // Prevent infinite loop
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
          <div className="flex-grow min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  {comment.author.name}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </p>
              </div>

              {/* Actions Menu */}
              {isAuthor && (
                <div className="relative">
                  <button
                    onClick={() => setShowActions(!showActions)}
                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>

                  {showActions && (
                    <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10">
                      <button
                        onClick={() => {
                          setIsEditing(true)
                          setShowActions(false)
                        }}
                        className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          handleDelete()
                          setShowActions(false)
                        }}
                        className="w-full px-4 py-2 text-left flex items-center gap-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
              <div className="mt-2">
                <CommentForm
                  postId={comment.postId}
                  initialValue={comment.content}
                  onSubmit={handleEdit}
                  onCancel={() => setIsEditing(false)}
                  submitLabel="Save"
                />
              </div>
            ) : (
              <div className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {comment.content}
              </div>
            )}

            {/* Reply Button */}
            {!isEditing && (
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="mt-2 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
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
            postId={comment.postId}
            parentId={comment.id}
            onSubmit={handleReply}
            onCancel={() => setIsReplying(false)}
            placeholder="Write a reply..."
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
