'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { createProject } from '@/lib/projects-client'
import dynamic from 'next/dynamic'
import { ImagePicker } from '@/components/image-picker'
import { Modal } from '@/components/modal'
import { AlertTriangle } from 'lucide-react'

// Dynamically import the MDEditor and its styles
const MDEditor = dynamic(
  () => {
    // Only import styles on client side
    if (typeof window !== 'undefined') {
      // These imports trigger TypeScript errors but work at runtime
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

interface Technology {
  id: string
  name: string
}

export default function NewProject() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [content, setContent] = useState('')
  const [description, setDescription] = useState('')
  const [techInput, setTechInput] = useState('')
  const [technologies, setTechnologies] = useState<Technology[]>([])
  const [saving, setSaving] = useState(false)
  const [featured, setFeatured] = useState(false)
  const [image, setImage] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [liveUrl, setLiveUrl] = useState('')
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [editorMounted, setEditorMounted] = useState(false)

  useEffect(() => {
    setEditorMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      console.log('Redirecting to signin - User:', !!user, 'Admin:', isAdmin)
      router.push('/auth')
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

  const handleAddTechnology = () => {
    if (techInput.trim()) {
      setTechnologies([...technologies, { id: Date.now().toString(), name: techInput.trim() }])
      setTechInput('')
    }
  }

  const handleRemoveTechnology = (techId: string) => {
    setTechnologies(technologies.filter(tech => tech.id !== techId))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTechnology()
    }
  }

  const handleSave = async () => {
    if (!title) {
      setErrorMessage('Title is required')
      setShowErrorModal(true)
      return
    }

    if (!description) {
      setErrorMessage('Description is required')
      setShowErrorModal(true)
      return
    }

    if (!content) {
      setErrorMessage('Content is required')
      setShowErrorModal(true)
      return
    }

    if (!image) {
      setErrorMessage('Image is required')
      setShowErrorModal(true)
      return
    }

    if (!user) {
      setErrorMessage('You must be logged in to create a project')
      setShowErrorModal(true)
      return
    }

    try {
      setSaving(true)
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

      console.log('Creating project with data:', {
        title,
        slug,
        subtitle,
        description,
        content: content.slice(0, 100) + '...', // Log first 100 chars of content
        technologies: technologies.map(tech => tech.name),
        featured,
        image,
        githubUrl,
        liveUrl
      })

      const project = {
        title,
        slug,
        subtitle,
        description,
        content,
        technologies: technologies.map(tech => tech.name),
        featured,
        image,
        githubUrl,
        liveUrl
      }

      // Create project using the projects service
      const token = await user!.getIdToken()
      await createProject(project, token)
      console.log('Project created successfully')
      router.push('/admin/projects')
    } catch (error) {
      console.error('Detailed error saving project:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save the project')
      setShowErrorModal(true)
    } finally {
      setSaving(false)
    }
  }

  const handleImageSelected = (url: string) => {
    setImage(url)
  }

  return (
    <div className="container mx-auto px-4 max-w-6xl py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Create New Project</h1>
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
            placeholder="Enter project title"
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
            placeholder="Enter project subtitle"
          />
        </div>

        {/* Short Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Short Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800"
            placeholder="Enter a short description"
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
            className="mb-4"
          />
        </div>

        {/* GitHub URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            GitHub URL
          </label>
          <input
            type="text"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800"
            placeholder="Enter GitHub URL (optional)"
          />
        </div>

        {/* Live URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Live URL
          </label>
          <input
            type="text"
            value={liveUrl}
            onChange={(e) => setLiveUrl(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800"
            placeholder="Enter Live URL (optional)"
          />
        </div>

        {/* Technologies */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Technologies
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {technologies.map((tech) => (
              <span
                key={tech.id}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200"
              >
                {tech.name}
                <button
                  onClick={() => handleRemoveTechnology(tech.id)}
                  className="ml-2 text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={techInput}
            onChange={(e) => setTechInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800"
            placeholder="Enter technologies (press Enter to add)"
          />
        </div>

        {/* Featured */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="featured"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="featured" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
            Featured project
          </label>
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

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Project'}
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
