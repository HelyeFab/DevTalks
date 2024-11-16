'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { updatePost, type BlogPost } from '@/lib/blog'
import dynamic from 'next/dynamic'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'
import { ImagePicker } from '@/components/image-picker'

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
      console.log('Updating post:', {
        id: initialPost.id,
        title,
        published: publish,
        tags: tags.map(tag => tag.name)
      })

      const post: BlogPost = {
        id: initialPost.id,
        title,
        subtitle,
        content,
        excerpt: content.slice(0, 150) + '...',
        tags: tags.map(tag => tag.name),
        image,
        imageAlt,
        author: {
          name: user?.name || 'Admin',
          email: user?.email!,
          image: user?.image || '/images/default-avatar.png'
        },
        date: initialPost.date,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        published: publish
      }

      await updatePost(post)
      console.log('Post updated successfully')
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

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Content
          </label>
          <MDEditor
            value={content}
            onChange={(value) => setContent(value || '')}
            preview="edit"
            height={500}
          />
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
