'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { updatePost, type BlogPost } from '@/lib/blog'
import dynamic from 'next/dynamic'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'
import { ImagePicker } from '@/components/image-picker'
import { DatePicker } from '@/components/date-picker'
import { Eye, Edit, Code } from 'lucide-react'

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
)

interface Tag {
  id: string
  name: string
}

interface Props {
  post: BlogPost
}

type EditorMode = 'edit' | 'live' | 'preview'

export function EditPostForm({ post: initialPost }: Props) {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState(initialPost.title)
  const [subtitle, setSubtitle] = useState(initialPost.subtitle)
  const [content, setContent] = useState(initialPost.content)
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<Tag[]>(
    initialPost.tags.map(tag => ({ id: tag, name: tag }))
  )
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [published, setPublished] = useState(initialPost.published)
  const [image, setImage] = useState(initialPost.image || '')
  const [imageAlt, setImageAlt] = useState(initialPost.imageAlt || '')
  const [editorMode, setEditorMode] = useState<EditorMode>('live')
  const [postDate, setPostDate] = useState(initialPost.date)

  const handleAddTag = () => {
    if (!tagInput.trim()) return

    const newTag = {
      id: tagInput.toLowerCase(),
      name: tagInput.trim()
    }

    if (!tags.some(tag => tag.id === newTag.id)) {
      setTags([...tags, newTag])
    }

    setTagInput('')
  }

  const handleRemoveTag = (tagId: string) => {
    setTags(tags.filter(tag => tag.id !== tagId))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
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
      setError('Title is required')
      return
    }

    if (!content) {
      setError('Content is required')
      return
    }

    try {
      setSaving(true)

      const post: BlogPost = {
        id: initialPost.id,
        title,
        subtitle,
        content,
        excerpt: createExcerpt(content),
        tags: tags.map(tag => tag.name),
        image,
        imageAlt,
        author: {
          name: user?.displayName || 'Admin',
          email: user?.email!,
          image: user?.photoURL || '/images/default-avatar.png'
        },
        date: postDate,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        published: publish
      }

      await updatePost(post)
      router.push('/admin/posts')
    } catch (error) {
      console.error('Error updating post:', error)
      setError(error instanceof Error ? error.message : 'Failed to update post')
    } finally {
      setSaving(false)
    }
  }

  const handleImageSelected = (url: string, alt?: string) => {
    setImage(url)
    setImageAlt(alt || '')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 max-w-6xl py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Edit Post</h1>
        <button
          onClick={() => router.push('/admin/dashboard')}
          className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
            {error}
          </div>
        )}

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
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200"
              >
                {tag.name}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag.id)}
                  className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-primary-200 dark:hover:bg-primary-800 focus:outline-none"
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
            onKeyPress={handleKeyPress}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800"
            placeholder="Add a tag and press Enter"
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
            <MDEditor
              value={content}
              onChange={(value) => setContent(value || '')}
              preview={editorMode}
              height={500}
              visibleDragbar={false}
            />
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

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Save as Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {published ? 'Update' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  )
}
