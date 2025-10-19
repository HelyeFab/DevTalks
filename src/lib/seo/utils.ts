/**
 * SEO Utilities
 * Helper functions for SEO optimization in Next.js
 */

// Default site configuration - can be moved to env variables
export const SITE_CONFIG = {
  name: 'DevTalks',
  title: 'DevTalks - Software Development Blog & Community',
  description: 'A blog and community for software developers. Explore articles on web development, programming, and technology.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://devtalks.com',
  author: 'DevTalks Team',
  twitterHandle: '@devtalks',
  locale: 'en_US',
  type: 'website',
} as const

/**
 * Generate canonical URL for a given path
 */
export function getCanonicalUrl(path: string): string {
  // Remove trailing slash and ensure leading slash
  const cleanPath = path.replace(/\/$/, '').replace(/^\//, '')
  const baseUrl = SITE_CONFIG.url.replace(/\/$/, '')

  return cleanPath ? `${baseUrl}/${cleanPath}` : baseUrl
}

/**
 * Generate OpenGraph image URL
 */
export function getOpenGraphImage(imagePath?: string): string {
  if (!imagePath) {
    // Default OG image
    return `${SITE_CONFIG.url}/images/og-default.jpg`
  }

  // If it's already a full URL, return it
  if (imagePath.startsWith('http')) {
    return imagePath
  }

  // Ensure leading slash
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`
  return `${SITE_CONFIG.url}${cleanPath}`
}

/**
 * Truncate text to a specific length while respecting word boundaries
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text

  const truncated = text.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')

  return lastSpace > 0
    ? `${truncated.substring(0, lastSpace)}...`
    : `${truncated}...`
}

/**
 * Generate SEO-friendly page title
 */
export function generatePageTitle(title: string, includeSiteName = true): string {
  const maxLength = 60

  if (includeSiteName) {
    const fullTitle = `${title} | ${SITE_CONFIG.name}`
    return truncateText(fullTitle, maxLength)
  }

  return truncateText(title, maxLength)
}

/**
 * Generate SEO-friendly meta description
 */
export function generateMetaDescription(description: string): string {
  const maxLength = 155
  return truncateText(description, maxLength)
}

/**
 * Generate keywords from tags
 */
export function generateKeywords(tags: string[]): string {
  return tags.join(', ')
}

/**
 * Create structured breadcrumb path
 */
export interface BreadcrumbItem {
  name: string
  url: string
}

export function generateBreadcrumbs(path: string): BreadcrumbItem[] {
  const segments = path.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = [
    { name: 'Home', url: '/' }
  ]

  let currentPath = ''
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const name = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    breadcrumbs.push({
      name,
      url: currentPath
    })
  })

  return breadcrumbs
}

/**
 * Format date for SEO (ISO 8601)
 */
export function formatSEODate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toISOString()
}

/**
 * Generate robots meta tag value
 */
export interface RobotsConfig {
  index?: boolean
  follow?: boolean
  noarchive?: boolean
  nosnippet?: boolean
  noimageindex?: boolean
}

export function generateRobotsMeta(config: RobotsConfig = {}): string {
  const {
    index = true,
    follow = true,
    noarchive = false,
    nosnippet = false,
    noimageindex = false,
  } = config

  const parts: string[] = []

  parts.push(index ? 'index' : 'noindex')
  parts.push(follow ? 'follow' : 'nofollow')

  if (noarchive) parts.push('noarchive')
  if (nosnippet) parts.push('nosnippet')
  if (noimageindex) parts.push('noimageindex')

  return parts.join(', ')
}

/**
 * Generate article tags for blog posts
 */
export function generateArticleTags(tags: string[]): string[] {
  // Clean and format tags
  return tags.map(tag =>
    tag.trim().toLowerCase().replace(/\s+/g, '-')
  )
}

/**
 * Calculate estimated reading time
 */
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const words = content.trim().split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}

/**
 * Extract plain text from markdown content
 */
export function extractPlainText(markdown: string): string {
  // Remove code blocks
  let text = markdown.replace(/```[\s\S]*?```/g, '')

  // Remove inline code
  text = text.replace(/`[^`]*`/g, '')

  // Remove images
  text = text.replace(/!\[.*?\]\(.*?\)/g, '')

  // Remove links but keep text
  text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')

  // Remove headers
  text = text.replace(/#{1,6}\s/g, '')

  // Remove bold/italic
  text = text.replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1')

  // Remove HTML tags
  text = text.replace(/<[^>]*>/g, '')

  // Clean up extra whitespace
  text = text.replace(/\s+/g, ' ').trim()

  return text
}

/**
 * Generate excerpt from content
 */
export function generateExcerpt(content: string, maxLength = 160): string {
  const plainText = extractPlainText(content)
  return truncateText(plainText, maxLength)
}

/**
 * Validate and format URL
 */
export function formatUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.toString()
  } catch {
    // If URL is relative, make it absolute
    return getCanonicalUrl(url)
  }
}

/**
 * Generate Twitter card type based on content
 */
export function getTwitterCardType(hasImage: boolean): 'summary' | 'summary_large_image' {
  return hasImage ? 'summary_large_image' : 'summary'
}

/**
 * Clean and format slug
 */
export function formatSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/**
 * Generate JSON-LD script tag content
 */
export function generateJsonLd(data: Record<string, any>): string {
  return JSON.stringify(data, null, 2)
}
