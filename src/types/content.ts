/**
 * Unified Content Type System
 *
 * This module defines a shared type system for all content types (posts, announcements)
 * to enable a unified editor experience while maintaining separate Firestore collections.
 */

import type { Author, SEOMetadata } from './blog'

export type ContentType = 'post' | 'announcement'

export interface BaseContent {
  id: string
  title: string
  subtitle: string
  content: string // MDX/Markdown content
  excerpt?: string
  image?: string
  imageAlt?: string
  tags: string[]
  author: Author
  date: string
  slug: string
  published: boolean
  publishedAt?: string
  readTime?: number
  seo?: SEOMetadata
  createdAt?: string
  updatedAt?: string
}

export interface Post extends BaseContent {
  contentType: 'post'
  upvotes?: number
}

export interface Announcement extends BaseContent {
  contentType: 'announcement'
  pinned: boolean
  priority: 'low' | 'normal' | 'high' | 'urgent'
  startDate?: string | null
  endDate?: string | null
}

export type Content = Post | Announcement

/**
 * Type guard to check if content is a Post
 */
export function isPost(content: Content): content is Post {
  return content.contentType === 'post'
}

/**
 * Type guard to check if content is an Announcement
 */
export function isAnnouncement(content: Content): content is Announcement {
  return content.contentType === 'announcement'
}

/**
 * Editor state for creating/editing content
 */
export interface ContentEditorState {
  contentType: ContentType
  // Common fields
  title: string
  subtitle: string
  content: string
  image: string
  imageAlt: string
  tags: Array<{ id: string; name: string }>
  postDate: string
  published: boolean

  // SEO fields (common)
  seo: SEOMetadata

  // Post-specific fields
  upvotes?: number

  // Announcement-specific fields
  pinned?: boolean
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  startDate?: string | null
  endDate?: string | null
}

/**
 * Default content editor state
 */
export const getDefaultEditorState = (contentType: ContentType): Partial<ContentEditorState> => ({
  contentType,
  title: '',
  subtitle: '',
  content: '',
  image: '',
  imageAlt: '',
  tags: [],
  postDate: new Date().toISOString(),
  published: false,
  seo: {
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
  },
  // Post defaults
  ...(contentType === 'post' ? {
    upvotes: 0
  } : {}),
  // Announcement defaults
  ...(contentType === 'announcement' ? {
    pinned: false,
    priority: 'normal' as const,
    startDate: null,
    endDate: null
  } : {})
})
