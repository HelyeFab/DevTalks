import matter from 'gray-matter'
import type { SEOMetadata } from '@/types/blog'

export interface MarkdownFrontmatter {
  title?: string
  subtitle?: string
  date?: string
  published?: boolean
  seo?: {
    metaTitle?: string
    metaDescription?: string
    focusKeyword?: string
    category?: string
    tags?: string[]
    schemaType?: 'Article' | 'BlogPosting' | 'NewsArticle' | 'TechArticle'
  }
  image?: string
  imageAlt?: string
  author?: {
    name?: string
    bio?: string
    credentials?: string
  }
  tags?: string[]
}

export interface ParsedMarkdown {
  title: string
  subtitle: string
  content: string
  date: string
  published: boolean
  image?: string
  imageAlt?: string
  tags: string[]
  seo: SEOMetadata
  author?: {
    name?: string
    bio?: string
    credentials?: string
  }
  extractedImages: Array<{ alt: string; src: string; isLocal: boolean }>
}

/**
 * Extract images from markdown content
 */
function extractImagesFromMarkdown(content: string): Array<{ alt: string; src: string; isLocal: boolean }> {
  const images: Array<{ alt: string; src: string; isLocal: boolean }> = []

  // Match markdown images: ![alt](src)
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
  let match

  while ((match = imageRegex.exec(content)) !== null) {
    const alt = match[1] || ''
    const src = match[2]
    const isLocal = !src.startsWith('http://') && !src.startsWith('https://')

    images.push({ alt, src, isLocal })
  }

  return images
}

/**
 * Extract title from first H1 in markdown content
 */
function extractTitleFromContent(content: string): string {
  const h1Match = content.match(/^#\s+(.+)$/m)
  return h1Match ? h1Match[1].trim() : ''
}

/**
 * Extract subtitle from first italic paragraph or second line
 */
function extractSubtitleFromContent(content: string): string {
  // Look for italic text near the top (often used for subtitles)
  const italicMatch = content.match(/^\*(.+)\*$/m)
  if (italicMatch) return italicMatch[1].trim()

  // Or look for text after the title before first H2
  const lines = content.split('\n')
  const h1Index = lines.findIndex(line => line.startsWith('# '))
  if (h1Index >= 0 && h1Index + 2 < lines.length) {
    const potentialSubtitle = lines[h1Index + 2].trim()
    if (potentialSubtitle && !potentialSubtitle.startsWith('#')) {
      return potentialSubtitle.replace(/^\*(.+)\*$/, '$1') // Remove italic markers if present
    }
  }

  return ''
}

/**
 * Generate excerpt from content (first meaningful paragraph)
 */
function generateExcerpt(content: string, maxLength = 150): string {
  // Remove markdown syntax
  let text = content
    .replace(/^#+\s+.+$/gm, '') // Remove headers
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '') // Remove images
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1') // Convert links to text
    .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.+?)\*/g, '$1') // Remove italic
    .replace(/`(.+?)`/g, '$1') // Remove code
    .replace(/^[\s-]+/gm, '') // Remove list markers
    .trim()

  // Get first meaningful paragraph
  const paragraphs = text.split(/\n\n+/)
  const firstParagraph = paragraphs.find(p => p.length > 50) || paragraphs[0] || ''

  // Truncate to maxLength
  if (firstParagraph.length > maxLength) {
    return firstParagraph.substring(0, maxLength).trim() + '...'
  }

  return firstParagraph
}

/**
 * Fix heading structure - ensures only one H1, converts subsequent H1s to H2s
 */
export function fixHeadingStructure(content: string): string {
  const lines = content.split('\n')
  let h1Count = 0

  const fixedLines = lines.map(line => {
    // Check if line is an H1 (starts with exactly one # followed by space)
    const isH1 = /^#\s+/.test(line)

    if (isH1) {
      h1Count++
      // Keep first H1, convert subsequent ones to H2
      if (h1Count > 1) {
        return '#' + line // Add one more # to make it H2
      }
    }

    return line
  })

  return fixedLines.join('\n')
}

/**
 * Analyze heading structure and return recommendations
 */
export function analyzeHeadingStructure(content: string): {
  h1Count: number
  h2Count: number
  h3Count: number
  hasProperStructure: boolean
  issues: string[]
} {
  const lines = content.split('\n')
  const headings = {
    h1: 0,
    h2: 0,
    h3: 0
  }

  lines.forEach(line => {
    if (/^#\s+/.test(line)) headings.h1++
    else if (/^##\s+/.test(line)) headings.h2++
    else if (/^###\s+/.test(line)) headings.h3++
  })

  const issues: string[] = []

  if (headings.h1 === 0) {
    issues.push('No H1 heading found - add a main title')
  } else if (headings.h1 > 1) {
    issues.push(`${headings.h1} H1 headings found - should only have one`)
  }

  if (headings.h2 < 2 && content.length > 500) {
    issues.push('Consider adding more H2 headings to structure your content')
  }

  const hasProperStructure = headings.h1 === 1 && headings.h2 >= 2

  return {
    h1Count: headings.h1,
    h2Count: headings.h2,
    h3Count: headings.h3,
    hasProperStructure,
    issues
  }
}

/**
 * Parse markdown file with frontmatter
 */
export function parseMarkdownWithFrontmatter(fileContent: string): ParsedMarkdown {
  const { data, content } = matter(fileContent)
  const frontmatter = data as MarkdownFrontmatter

  // Extract title and subtitle from content if not in frontmatter
  const contentTitle = extractTitleFromContent(content)
  const contentSubtitle = extractSubtitleFromContent(content)

  // Extract images from markdown
  const extractedImages = extractImagesFromMarkdown(content)

  // Build the parsed result with smart fallbacks
  const parsed: ParsedMarkdown = {
    title: frontmatter.title || contentTitle || 'Untitled Post',
    subtitle: frontmatter.subtitle || contentSubtitle || '',
    content: content.trim(),
    date: frontmatter.date || new Date().toISOString(),
    published: frontmatter.published ?? false,
    image: frontmatter.image,
    imageAlt: frontmatter.imageAlt,
    tags: frontmatter.tags || frontmatter.seo?.tags || [],
    seo: {
      metaTitle: frontmatter.seo?.metaTitle || '',
      metaDescription: frontmatter.seo?.metaDescription || generateExcerpt(content),
      focusKeyword: frontmatter.seo?.focusKeyword || '',
      ogTitle: frontmatter.seo?.metaTitle || frontmatter.title || contentTitle,
      ogDescription: frontmatter.seo?.metaDescription || generateExcerpt(content),
      ogImage: frontmatter.image || '',
      category: frontmatter.seo?.category || '',
      keywords: frontmatter.seo?.tags || frontmatter.tags || [],
      schemaType: frontmatter.seo?.schemaType || 'BlogPosting',
      canonicalUrl: ''
    },
    author: frontmatter.author,
    extractedImages
  }

  return parsed
}

/**
 * Generate markdown template with frontmatter
 */
export function generateMarkdownTemplate(): string {
  return `---
# Basic Info
title: "Your Post Title Here"
subtitle: "Optional engaging subtitle"
date: "${new Date().toISOString().split('T')[0]}"
published: false

# SEO Fields
seo:
  metaTitle: "Custom meta title (leave empty to use title)"
  metaDescription: "Compelling 120-160 char description for search results"
  focusKeyword: "main keyword"
  category: "Web Development"
  tags: ["javascript", "nextjs", "tutorial"]
  schemaType: "BlogPosting"  # or Article, NewsArticle, TechArticle

# Media
image: "https://example.com/cover.jpg"  # or local path
imageAlt: "Description of cover image"

# Author (optional - will use your profile if empty)
author:
  name: "Your Name"
  bio: "Short bio about you"
  credentials: "Senior Developer at Company"
---

# Your Post Title

*An engaging subtitle or introduction line*

## Introduction

Start your post content here...

## Main Content

Write your detailed content with:
- Code blocks
- Lists
- Images
- Links

## Conclusion

Wrap up your post...

---

*Happy writing! 🚀*
`
}

/**
 * Convert parsed data back to markdown with frontmatter
 */
export function convertToMarkdown(parsed: Partial<ParsedMarkdown>): string {
  const frontmatter: MarkdownFrontmatter = {
    title: parsed.title,
    subtitle: parsed.subtitle,
    date: parsed.date,
    published: parsed.published,
    image: parsed.image,
    imageAlt: parsed.imageAlt,
    tags: parsed.tags,
    seo: parsed.seo ? {
      metaTitle: parsed.seo.metaTitle,
      metaDescription: parsed.seo.metaDescription,
      focusKeyword: parsed.seo.focusKeyword,
      category: parsed.seo.category,
      tags: parsed.seo.keywords,
      schemaType: parsed.seo.schemaType
    } : undefined,
    author: parsed.author
  }

  const yamlContent = Object.entries(frontmatter)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => {
      if (typeof value === 'object' && !Array.isArray(value)) {
        const nested = Object.entries(value)
          .filter(([_, v]) => v !== undefined && v !== null && v !== '')
          .map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`)
          .join('\n')
        return `${key}:\n${nested}`
      }
      return `${key}: ${JSON.stringify(value)}`
    })
    .join('\n')

  return `---\n${yamlContent}\n---\n\n${parsed.content || ''}`
}
