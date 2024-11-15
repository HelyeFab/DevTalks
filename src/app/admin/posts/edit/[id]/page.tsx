'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { getPost, updatePost, type BlogPost } from '@/lib/blog'
import dynamic from 'next/dynamic'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
)

interface Tag {
  id: string
  name: string
}

interface Props {
  params: {
    id: string
  }
}

export default function EditPost({ params }: Props) {
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
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      console.log('Redirecting to signin - User:', !!user, 'Admin:', isAdmin)
      router.push('/auth/signin')
    }
  }, [user, loading, isAdmin, router])

  useEffect(() => {
    async function fetchPost() {
      try {
        console.log('Fetching post:', params.id)
        const post = await getPost(params.id)
        if (!post) {
          console.log('Post not found')
          router.push('/admin/posts')
          return
        }

        console.log('Post loaded:', post)
        setTitle(post.title)
        setSubtitle(post.subtitle)
        setContent(post.content)
        setTags(post.tags.map((tag, index) => ({ id: String(index), name: tag })))
        setPublished(post.published)
      } catch (error) {
        console.error('Error fetching post:', error)
        setError('Failed to load post')
      } finally {
        setIsLoading(false)
      }
    }

    if (user && isAdmin) {
      fetchPost()
    }
  }, [params.id, user, isAdmin, router])

  const handleAddTag = () => {
    if (tagInput.trim()) {
      const newTag = {
        id: String(Date.now()),
        name: tagInput.trim()
      }
      setTags([...tags, newTag])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagId: string) => {
    setTags(tags.filter(tag => tag.id !== tagId))
  }

  const handleSave = async (publish: boolean = published) => {
    if (!title || !content) {
      setError('Title and content are required')
      return
    }

    try {
      setSaving(true)
      setError('')

      console.log('Updating post:', {
        id: params.id,
        title,
        subtitle,
        content: content.slice(0, 100) + '...', // Log first 100 chars of content
        tags: tags.map(tag => tag.name),
        published: publish
      })

      await updatePost(params.id, {
        title,
        subtitle,
        content,
        tags: tags.map(tag => tag.name),
        published: publish,
        publishedAt: publish ? new Date().toISOString() : null
      })

      router.push('/admin/posts')
    } catch (error) {
      console.error('Error saving post:', error)
      setError('Failed to save post')
    } finally {
      setSaving(false)
    }
  }

  if (loading || isLoading) {
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

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Edit Post</h1>
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/admin/posts')}
            className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Save as Draft
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            {published ? 'Update' : 'Publish'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Post title"
          />
        </div>

        <div>
          <label htmlFor="subtitle" className="block text-sm font-medium mb-2">
            Subtitle
          </label>
          <input
            type="text"
            id="subtitle"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Post subtitle (optional)"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium mb-2">
            Content
          </label>
          <div data-color-mode="auto">
            <MDEditor
              value={content}
              onChange={(value) => setContent(value || '')}
              preview="edit"
              height={400}
            />
          </div>
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm font-medium mb-2">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200"
              >
                {tag.name}
                <button
                  onClick={() => handleRemoveTag(tag.id)}
                  className="hover:text-primary-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Add a tag"
            />
            <button
              onClick={handleAddTag}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Add Tag
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
