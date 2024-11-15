'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { createPost } from '@/lib/blog'
import dynamic from 'next/dynamic'
import { ImagePicker } from '@/components/image-picker'
import { Modal } from '@/components/modal'
import { AlertTriangle } from 'lucide-react'

// Dynamically import the MDEditor and its styles
const MDEditor = dynamic(
  () => {
    // Only import styles on client side
    if (typeof window !== 'undefined') {
      import('@uiw/react-md-editor/markdown-editor.css')
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

  const handleSave = async (publish: boolean = false) => {
    if (!title || !content) {
      setErrorMessage('Title and content are required')
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
          name: user?.displayName || 'Admin',
          email: user?.email!,
          image: user?.photoURL || '/images/default-avatar.svg'
        },
        date: new Date().toISOString(),
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        published: publish,
        image,
        imageAlt
      })

      const post = {
        title,
        subtitle,
        content,
        excerpt: content.slice(0, 150) + '...',
        tags: tags.map(tag => tag.name),
        image,
        imageAlt,
        author: {
          name: user?.displayName || 'Admin',
          email: user?.email!,
          image: user?.photoURL || '/images/default-avatar.svg'
        },
        date: new Date().toISOString(),
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        published: publish
      }

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

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Content
          </label>
          <div className="min-h-[500px]">
            {editorMounted && (
              <MDEditor
                value={content}
                onChange={(value) => setContent(value || '')}
                preview="edit"
                height={500}
              />
            )}
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
