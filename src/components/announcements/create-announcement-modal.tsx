'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { AnnouncementStatus } from '../manage/announcement-status'
import { MDXContent } from '@/components/mdx-content'

interface Props {
  onClose: () => void
  onCreate: (data: { 
    title: string
    content: string
    markdownContent: string
    isSticky: boolean
    status: 'active' | 'inactive'
  }) => Promise<void>
}

export function CreateAnnouncementModal({ onClose, onCreate }: Props) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [markdownContent, setMarkdownContent] = useState('')
  const [isSticky, setIsSticky] = useState(false)
  const [status, setStatus] = useState<'active' | 'inactive'>('active')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      await onCreate({
        title,
        content,
        markdownContent,
        isSticky,
        status
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-4xl w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Create Announcement</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="text-sm text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
            >
              {previewMode ? 'Edit' : 'Preview'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {previewMode ? (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">{title || 'Untitled Announcement'}</h1>
            <div className="prose dark:prose-invert max-w-none">
              <MDXContent content={markdownContent || '*No content yet*'} />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Summary
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label htmlFor="markdownContent" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Content (Markdown)
              </label>
              <textarea
                id="markdownContent"
                value={markdownContent}
                onChange={(e) => setMarkdownContent(e.target.value)}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:text-white font-mono"
                required
              />
            </div>

            <AnnouncementStatus
              status={status}
              isSticky={isSticky}
              onStatusChange={setStatus}
              onStickyChange={setIsSticky}
            />

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 dark:bg-pink-700 dark:hover:bg-pink-800 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
