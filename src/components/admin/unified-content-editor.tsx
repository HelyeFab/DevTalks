'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { createPost, updatePost } from '@/lib/blog'
import { createAnnouncement, updateAnnouncement, type Announcement as AnnouncementType } from '@/lib/announcements'
import type { BlogPost } from '@/types/blog'
import dynamic from 'next/dynamic'
import { ImagePicker } from '@/components/image-picker'
import { DatePicker } from '@/components/date-picker'
import { Modal } from '@/components/modal'
import { SEOAnalysis } from '@/components/seo-analysis'
import { MarkdownImporter } from '@/components/markdown-importer'
import { ImageUploadHelper } from '@/components/image-upload-helper'
import { useEditorData } from '@/hooks/use-editor-data'
import { AlertTriangle, Eye, Edit, Code, ChevronDown, ChevronUp, Search, Sparkles, FileDown, Megaphone, FileText } from 'lucide-react'
import type { SEOMetadata } from '@/types/blog'
import type { ParsedMarkdown } from '@/lib/markdown-parser'
import type { ContentType } from '@/types/content'

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

interface UnifiedContentEditorProps {
  initialContentType?: ContentType
  existingPost?: BlogPost
  existingAnnouncement?: AnnouncementType
  mode?: 'create' | 'edit'
}

export function UnifiedContentEditor({
  initialContentType = 'post',
  existingPost,
  existingAnnouncement,
  mode = 'create'
}: UnifiedContentEditorProps) {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const editorData = useEditorData()

  // Content type selection
  const [contentType, setContentType] = useState<ContentType>(initialContentType)

  // Basic fields
  const [title, setTitle] = useState(existingPost?.title || existingAnnouncement?.title || '')
  const [subtitle, setSubtitle] = useState(existingPost?.subtitle || existingAnnouncement?.subtitle || '')
  const [content, setContent] = useState(existingPost?.content || existingAnnouncement?.content || '')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<Tag[]>(
    (existingPost?.tags || existingAnnouncement?.tags || []).map((tag, idx) => ({
      id: `${Date.now()}-${idx}`,
      name: tag
    }))
  )
  const [saving, setSaving] = useState(false)
  const [image, setImage] = useState(existingPost?.image || existingAnnouncement?.image || '')
  const [imageAlt, setImageAlt] = useState(existingPost?.imageAlt || existingAnnouncement?.imageAlt || '')
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [editorMounted, setEditorMounted] = useState(false)
  const [editorMode, setEditorMode] = useState<EditorMode>('live')
  const [postDate, setPostDate] = useState(existingPost?.date || existingAnnouncement?.date || new Date().toISOString())

  // Announcement-specific fields
  const [pinned, setPinned] = useState(existingAnnouncement?.pinned || false)
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>(
    existingAnnouncement?.priority || 'normal'
  )
  const [startDate, setStartDate] = useState<string | null>(existingAnnouncement?.startDate || null)
  const [endDate, setEndDate] = useState<string | null>(existingAnnouncement?.endDate || null)

  // SEO fields
  const [seo, setSeo] = useState<SEOMetadata>(
    existingPost?.seo || existingAnnouncement?.seo || {
      metaTitle: '',
      metaDescription: '',
      focusKeyword: '',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      canonicalUrl: '',
      category: '',
      keywords: [],
      schemaType: 'BlogPosting'
    }
  )

  // UI State
  const [showSEOSection, setShowSEOSection] = useState(true)
  const [autoSlug, setAutoSlug] = useState(mode === 'create')
  const [showImporter, setShowImporter] = useState(false)
  const [pendingImages, setPendingImages] = useState<Array<{ alt: string; src: string; isLocal: boolean }>>([])
  const [showImageUploader, setShowImageUploader] = useState(false)

  useEffect(() => {
    setEditorMounted(true)
  }, [])

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      console.log('Redirecting to signin - User:', !!user, 'Admin:', isAdmin)
      router.push('/auth')
    }
  }, [user, loading, isAdmin, router])

  // Auto-generate slug from title
  useEffect(() => {
    if (autoSlug && title) {
      const generatedSlug = title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setSeo(prev => ({ ...prev, canonicalUrl: generatedSlug }))
    }
  }, [title, autoSlug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
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

  const handleQuickAddTag = (tagName: string) => {
    if (!tags.some(t => t.name === tagName)) {
      setTags([...tags, { id: Date.now().toString(), name: tagName }])
    }
  }

  // Helper function to create clean excerpt from content
  const createExcerpt = (content: string): string => {
    const cleanText = content
      .replace(/<[^>]*>/g, '')
      .replace(/&[^;]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

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
      setErrorMessage('You must be logged in to create content')
      setShowErrorModal(true)
      return
    }

    // SEO Validation
    if (publish) {
      if (!seo.metaTitle && !title) {
        setErrorMessage('Meta title is required for published content')
        setShowErrorModal(true)
        return
      }
      if (!seo.metaDescription) {
        setErrorMessage('Meta description is recommended for better SEO')
        setShowErrorModal(true)
        return
      }
    }

    try {
      setSaving(true)

      const commonFields = {
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
        slug: seo.canonicalUrl || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        published: publish,
        seo: {
          ...seo,
          metaTitle: seo.metaTitle || title,
          ogTitle: seo.ogTitle || seo.metaTitle || title,
          ogDescription: seo.ogDescription || seo.metaDescription,
          ogImage: seo.ogImage || image,
          keywords: seo.focusKeyword ? [seo.focusKeyword, ...tags.map(t => t.name)] : tags.map(t => t.name)
        }
      }

      if (contentType === 'post') {
        if (mode === 'create') {
          await createPost(commonFields)
        } else if (existingPost) {
          await updatePost({ ...commonFields, id: existingPost.id })
        }
        router.push('/admin/posts')
      } else {
        const announcementData = {
          ...commonFields,
          pinned,
          priority,
          startDate,
          endDate
        }
        if (mode === 'create') {
          await createAnnouncement(announcementData)
        } else if (existingAnnouncement) {
          await updateAnnouncement({ ...announcementData, id: existingAnnouncement.id })
        }
        router.push('/admin/announcements')
      }
    } catch (error) {
      console.error('Detailed error saving content:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save the content')
      setShowErrorModal(true)
    } finally {
      setSaving(false)
    }
  }

  const handleImageSelected = (url: string, alt?: string) => {
    setImage(url)
    setImageAlt(alt || '')
    if (!seo.ogImage) {
      setSeo(prev => ({ ...prev, ogImage: url }))
    }
  }

  const handleMarkdownImport = (parsed: ParsedMarkdown) => {
    setTitle(parsed.title)
    setSubtitle(parsed.subtitle)
    setContent(parsed.content)
    setPostDate(parsed.date)
    setImage(parsed.image || '')
    setImageAlt(parsed.imageAlt || '')

    setTags(parsed.tags.map((tag, index) => ({
      id: `${Date.now()}-${index}`,
      name: tag
    })))

    setSeo({
      metaTitle: parsed.seo.metaTitle || '',
      metaDescription: parsed.seo.metaDescription || '',
      focusKeyword: parsed.seo.focusKeyword || '',
      ogTitle: parsed.seo.ogTitle || '',
      ogDescription: parsed.seo.ogDescription || '',
      ogImage: parsed.seo.ogImage || parsed.image || '',
      category: parsed.seo.category || '',
      keywords: parsed.seo.keywords || [],
      schemaType: parsed.seo.schemaType || 'BlogPosting',
      canonicalUrl: parsed.seo.canonicalUrl || ''
    })

    if (parsed.extractedImages.length > 0) {
      setPendingImages(parsed.extractedImages)
      setShowImageUploader(true)
    }

    setShowImporter(false)
  }

  const handleImagesUploaded = (mappings: Record<string, string>) => {
    let updatedContent = content
    Object.entries(mappings).forEach(([localPath, uploadedUrl]) => {
      updatedContent = updatedContent.replace(
        new RegExp(`\\(${localPath}\\)`, 'g'),
        `(${uploadedUrl})`
      )
    })
    setContent(updatedContent)
    setShowImageUploader(false)
    setPendingImages([])
  }

  const handleSkipImageUpload = () => {
    setShowImageUploader(false)
    setPendingImages([])
  }

  const contentTypeDisplay = contentType === 'post' ? 'Post' : 'Announcement'
  const contentTypeIcon = contentType === 'post' ? FileText : Megaphone

  return (
    <div className="container mx-auto px-4 max-w-7xl py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          {mode === 'create' ? 'Create' : 'Edit'} {contentTypeDisplay}
        </h1>
        <div className="flex items-center gap-3">
          {mode === 'create' && (
            <button
              onClick={() => setShowImporter(!showImporter)}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <FileDown className="h-4 w-4" />
              {showImporter ? 'Hide Importer' : 'Import Markdown'}
            </button>
          )}
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="px-4 py-2 text-sm bg-muted rounded-lg hover:bg-muted/80 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Content Type Toggle (only show in create mode) */}
      {mode === 'create' && (
        <div className="mb-6 p-4 bg-card rounded-lg border border-border">
          <label className="block text-sm font-medium mb-3">Content Type</label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setContentType('post')}
              className={`flex-1 px-6 py-4 rounded-lg border-2 transition-all ${
                contentType === 'post'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FileText className="h-5 w-5" />
                <div>
                  <div className="font-semibold">Blog Post</div>
                  <div className="text-xs text-muted-foreground">Standard blog article with upvotes</div>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setContentType('announcement')}
              className={`flex-1 px-6 py-4 rounded-lg border-2 transition-all ${
                contentType === 'announcement'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Megaphone className="h-5 w-5" />
                <div>
                  <div className="font-semibold">Announcement</div>
                  <div className="text-xs text-muted-foreground">Time-sensitive notice with priority</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Markdown Importer */}
      {showImporter && (
        <div className="mb-6">
          <MarkdownImporter onImport={handleMarkdownImport} />
        </div>
      )}

      {/* Image Upload Helper */}
      {showImageUploader && (
        <ImageUploadHelper
          localImages={pendingImages}
          onImagesUploaded={handleImagesUploaded}
          onSkip={handleSkipImageUpload}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-input"
              placeholder="Enter title"
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Subtitle
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-input"
              placeholder="Enter subtitle"
            />
          </div>

          {/* Announcement-Specific Fields */}
          {contentType === 'announcement' && (
            <div className="space-y-4 p-4 bg-card rounded-lg border border-border">
              <h3 className="font-semibold flex items-center gap-2">
                <Megaphone className="h-4 w-4" />
                Announcement Settings
              </h3>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium mb-2">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-input"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Pinned */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinned"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="pinned" className="text-sm font-medium">
                  Pin to top of announcements
                </label>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium mb-2">Start Date (Optional)</label>
                <input
                  type="date"
                  value={startDate || ''}
                  onChange={(e) => setStartDate(e.target.value || null)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-input"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium mb-2">End Date (Optional)</label>
                <input
                  type="date"
                  value={endDate || ''}
                  onChange={(e) => setEndDate(e.target.value || null)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-input"
                />
              </div>
            </div>
          )}

          {/* Image */}
          <div>
            <label className="block text-sm font-medium mb-2">
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
            <label className="block text-sm font-medium mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary"
                >
                  {tag.name}
                  <button
                    onClick={() => handleRemoveTag(tag.id)}
                    className="ml-2 hover:text-primary/80"
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
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-input"
              placeholder="Enter tags (press Enter to add)"
            />
            {editorData.popularTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-xs text-muted-foreground">Popular:</span>
                {editorData.popularTags.slice(0, 5).map((tag) => (
                  <button
                    key={tag.name}
                    type="button"
                    onClick={() => handleQuickAddTag(tag.name)}
                    className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-colors"
                  >
                    {tag.name} ({tag.count})
                  </button>
                ))}
              </div>
            )}
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
              <label className="block text-sm font-medium">
                Content <span className="text-destructive">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Editor Mode:</span>
                <div className="flex rounded-lg border border-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setEditorMode('edit')}
                    className={`px-3 py-1 text-xs font-medium flex items-center gap-1 ${
                      editorMode === 'edit'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-foreground hover:bg-muted'
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
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-foreground hover:bg-muted'
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
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card text-foreground hover:bg-muted'
                    }`}
                  >
                    <Eye className="h-3 w-3" />
                    Preview
                  </button>
                </div>
              </div>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
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

            <div className="mt-2 text-sm text-muted-foreground">
              <p className="mb-1"><strong>Tip:</strong> This editor supports both Markdown and HTML</p>
            </div>
          </div>

          {/* SEO Section */}
          <div className="border border-border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSEOSection(!showSEOSection)}
              className="w-full px-6 py-4 flex items-center justify-between bg-card hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">SEO Optimization</h3>
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                  Boost Rankings
                </span>
              </div>
              {showSEOSection ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>

            {showSEOSection && (
              <div className="p-6 space-y-4 bg-card">
                {/* Meta Title */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Meta Title {seo.metaTitle && <span className="text-xs text-muted-foreground">({seo.metaTitle.length}/60)</span>}
                  </label>
                  <input
                    type="text"
                    value={seo.metaTitle}
                    onChange={(e) => setSeo({ ...seo, metaTitle: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-input"
                    placeholder="Leave empty to use title"
                    maxLength={70}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Optimal: 50-60 characters</p>
                </div>

                {/* Meta Description */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Meta Description {seo.metaDescription && <span className="text-xs text-muted-foreground">({seo.metaDescription.length}/160)</span>}
                  </label>
                  <textarea
                    value={seo.metaDescription}
                    onChange={(e) => setSeo({ ...seo, metaDescription: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-input resize-none"
                    placeholder="A compelling description for search results"
                    rows={3}
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Optimal: 120-160 characters</p>
                </div>

                {/* Focus Keyword */}
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                    Focus Keyword
                    <Sparkles className="h-4 w-4 text-primary" />
                  </label>
                  <input
                    type="text"
                    value={seo.focusKeyword}
                    onChange={(e) => setSeo({ ...seo, focusKeyword: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-input"
                    placeholder="Main keyword to optimize for"
                  />
                  {editorData.suggestedKeywords.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="text-xs text-muted-foreground">Suggestions:</span>
                      {editorData.suggestedKeywords.map((keyword) => (
                        <button
                          key={keyword}
                          type="button"
                          onClick={() => setSeo({ ...seo, focusKeyword: keyword })}
                          className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-colors"
                        >
                          {keyword}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* URL Slug */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">
                      URL Slug
                    </label>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={autoSlug}
                        onChange={(e) => setAutoSlug(e.target.checked)}
                        className="rounded"
                      />
                      Auto-generate
                    </label>
                  </div>
                  <input
                    type="text"
                    value={seo.canonicalUrl}
                    onChange={(e) => {
                      setAutoSlug(false)
                      setSeo({ ...seo, canonicalUrl: e.target.value })
                    }}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-input font-mono text-sm"
                    placeholder="content-url-slug"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={seo.category}
                    onChange={(e) => setSeo({ ...seo, category: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-input"
                    placeholder="e.g., Web Development, AI, Tutorial"
                  />
                  {editorData.recentCategories.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="text-xs text-muted-foreground">Recent:</span>
                      {editorData.recentCategories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSeo({ ...seo, category: cat })}
                          className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-colors"
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Schema Type */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Schema Type
                  </label>
                  <select
                    value={seo.schemaType}
                    onChange={(e) => setSeo({ ...seo, schemaType: e.target.value as any })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-input"
                  >
                    <option value="BlogPosting">Blog Post</option>
                    <option value="Article">Article</option>
                    <option value="NewsArticle">News Article</option>
                    <option value="TechArticle">Technical Article</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Save Buttons */}
          <div className="flex justify-end gap-4">
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save as Draft'}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>

        {/* Sidebar - SEO Analysis */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <SEOAnalysis
              title={title}
              metaTitle={seo.metaTitle}
              metaDescription={seo.metaDescription}
              content={content}
              focusKeyword={seo.focusKeyword}
              slug={seo.canonicalUrl || ''}
              imageAlt={imageAlt}
            />
          </div>
        </div>
      </div>

      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error"
      >
        <div className="mt-2 flex items-center gap-3 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <p>{errorMessage}</p>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
            onClick={() => setShowErrorModal(false)}
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  )
}
