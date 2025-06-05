'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { createPost } from '@/lib/blog'
import dynamic from 'next/dynamic'
import { ImagePicker } from '@/components/image-picker'
import { DatePicker } from '@/components/date-picker'
import { Modal } from '@/components/modal'
import { AlertTriangle, Eye, Edit, Code } from 'lucide-react'

// Dynamically import the MDEditor and its styles
const MDEditor = dynamic(
  () => {
    // Only import styles on client side
    if (typeof window !== 'undefined') {
      // @ts-ignore
      import('@uiw/react-md-editor/markdown-editor.css')
      // @ts-ignore
      import('@uiw/react-markdown-preview/markdown.css')
    }
    return import('@uiw/react-md-editor').then((mod) => mod.default)
  },
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[500px] w-full animate-pulse bg-gray-200 dark:bg-gray-800 rounded-lg" />
    ),
  }
)

interface Tag {
  id: string
  name: string
}

type EditorMode = 'edit' | 'live' | 'preview'

export default function NewPost() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [content, setContent] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<Tag[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [published, setPublished] = useState(false)
  const [image, setImage] = useState('')
  const [imageAlt, setImageAlt] = useState('')
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [editorMounted, setEditorMounted] = useState(false)
  const [editorMode, setEditorMode] = useState<EditorMode>('live')
  const [postDate, setPostDate] = useState(new Date().toISOString())

  useEffect(() => {
    setEditorMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      console.log('Redirecting to signin - User:', !!user, 'Admin:', isAdmin)
      router.push('/auth/signin')
    }
  }, [user, loading, isAdmin, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null
  }

  const handleAddTag = () => {
    if (tagInput.trim()) {
      setTags([...tags, { id: Date.now().toString(), name: tagInput.trim() }])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagId: string) => {
    setTags(tags.filter(tag => tag.id !== tagId))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  // Helper function to create clean excerpt from content
  const createExcerpt = (content: string): string => {
    // Strip HTML tags and clean up the text
    const cleanText = content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&[^;]+;/g, ' ') // Replace HTML entities with spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim()

    // Return first 150 characters with ellipsis if needed
    return cleanText.length > 150 ? cleanText.slice(0, 150) + '...' : cleanText
  }

  const handleSave = async (publish = false) => {
    if (!title) {
      setErrorMessage('Title is required')
      setShowErrorModal(true)
      return
    }

    if (!content) {
      setErrorMessage('Content is required')
      setShowErrorModal(true)
      return
    }

    if (!user) {
      setErrorMessage('You must be logged in to create a post')
      setShowErrorModal(true)
      return
    }

    try {
      setSaving(true)
      console.log('Creating post with data:', {
        title,
        subtitle,
        content: content.slice(0, 100) + '...', // Log first 100 chars of content
        tags: tags.map(tag => tag.name),
        author: {
          name: user.displayName || 'Admin',
          email: user.email!,
          image: user.photoURL || '/images/default-avatar.png'
        },
        date: postDate,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        published: publish,
        image,
        imageAlt
      })

      const post = {
        title,
        subtitle,
        content,
        excerpt: createExcerpt(content),
        tags: tags.map(tag => tag.name),
        image,
        imageAlt,
        author: {
          name: user.displayName || 'Admin',
          email: user.email!,
          image: user.photoURL || '/images/default-avatar.png'
        },
        date: postDate,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        published: publish
      }

      // Create post using the blog service
      await createPost(post)
      console.log('Post created successfully')
      router.push('/admin/posts')
    } catch (error) {
      console.error('Detailed error saving post:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save the post')
      setShowErrorModal(true)
    } finally {
      setSaving(false)
    }
  }

  const handleImageSelected = (url: string, alt?: string) => {
    setImage(url)
    setImageAlt(alt || '')
  }

  return (
    <div className="container mx-auto px-4 max-w-6xl py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Create New Post</h1>
        <button
          onClick={() => router.push('/admin/dashboard')}
          className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800"
            placeholder="Enter post title"
          />
        </div>

        {/* Subtitle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Subtitle
          </label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800"
            placeholder="Enter post subtitle"
          />
        </div>

        {/* Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Cover Image
          </label>
          <ImagePicker
            onImageSelected={handleImageSelected}
            currentImage={image}
            currentAlt={imageAlt}
            className="mb-4"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200"
              >
                {tag.name}
                <button
                  onClick={() => handleRemoveTag(tag.id)}
                  className="ml-2 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800"
            placeholder="Enter tags (press Enter to add)"
          />
        </div>

        {/* Date */}
        <DatePicker
          value={postDate}
          onChange={setPostDate}
          label="Publication Date"
        />

        {/* Content */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Content
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Editor Mode:</span>
              <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setEditorMode('edit')}
                  className={`px-3 py-1 text-xs font-medium flex items-center gap-1 ${
                    editorMode === 'edit'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode('live')}
                  className={`px-3 py-1 text-xs font-medium flex items-center gap-1 ${
                    editorMode === 'live'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Code className="h-3 w-3" />
                  Live
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode('preview')}
                  className={`px-3 py-1 text-xs font-medium flex items-center gap-1 ${
                    editorMode === 'preview'
                      ? 'bg-primary-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <Eye className="h-3 w-3" />
                  Preview
                </button>
              </div>
            </div>
          </div>

          <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            {editorMounted && (
              <MDEditor
                value={content}
                onChange={(value) => setContent(value || '')}
                preview={editorMode}
                height={500}
                visibleDragbar={false}
              />
            )}
          </div>

          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            <p className="mb-1"><strong>Tip:</strong> This editor supports both Markdown and HTML:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li><strong>Edit mode:</strong> Raw markdown/HTML editing only</li>
              <li><strong>Live mode:</strong> Split view with editor and live preview</li>
              <li><strong>Preview mode:</strong> Full preview of rendered content</li>
              <li>You can use HTML tags like <code>&lt;p&gt;</code>, <code>&lt;strong&gt;</code>, <code>&lt;ul&gt;</code>, etc.</li>
              <li>Markdown syntax like <code>**bold**</code>, <code>*italic*</code>, <code># headers</code> also works</li>
            </ul>
          </div>
        </div>

        {/* Save Buttons */}
        <div className="flex justify-end gap-4">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error"
      >
        <div className="mt-2 flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertTriangle className="h-5 w-5" />
          <p>{errorMessage}</p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-700 rounded-lg transition-colors"
            onClick={() => setShowErrorModal(false)}
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  )
}
