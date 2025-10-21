'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'

interface Props {
  postId: string
  parentId?: string
  onSubmit: (content: string) => Promise<void>
  onCancel?: () => void
  placeholder?: string
  initialValue?: string
  submitLabel?: string
}

export function CommentForm({
  postId,
  parentId,
  onSubmit,
  onCancel,
  placeholder = 'Write a comment...',
  initialValue = '',
  submitLabel = 'Submit',
}: Props) {
  const [content, setContent] = useState(initialValue)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, loading: isLoading } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSubmitting || !user) return

    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit(content)
      setContent('')
    } catch (error) {
      console.error('Error submitting comment:', error)
      setError(error instanceof Error ? error.message : 'Failed to submit comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Please sign in to leave a comment.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:border-transparent resize-none"
        style={{
          backgroundColor: 'var(--input)',
          color: 'var(--foreground)',
          borderColor: 'var(--border)',
          borderWidth: '1px',
          borderStyle: 'solid'
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--ring)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)'
        }}
      />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-3 w-full">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          className="px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-foreground)'
          }}
          onMouseEnter={(e) => {
            if (!content.trim() || isSubmitting) return
            e.currentTarget.style.backgroundColor = 'var(--primary-hover)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--primary)'
          }}
        >
          {isSubmitting ? 'Submitting...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
