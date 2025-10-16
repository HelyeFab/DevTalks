/**
 * Meta Tags Generator
 * Comprehensive utility for generating optimized meta tags across the application
 */

import { Metadata } from 'next'
import { SITE_CONFIG, truncateText, extractPlainText, formatSEODate, getCanonicalUrl, getOpenGraphImage } from './utils'
import type { BlogPost } from '@/types/blog'
import type { Project } from '@/types/project'

/**
 * Character limits for optimal SEO
 */
export const META_LIMITS = {
  title: 60,
  titleWithSiteName: 60,
  description: 155,
  descriptionSocial: 200,
  ogTitle: 70,
  twitterTitle: 70,
  keywords: 10, // Max number of keywords
} as const

/**
 * Social image specifications
 */
export const IMAGE_SPECS = {
  og: { width: 1200, height: 630, aspectRatio: '1.91:1' },
  twitter: { width: 1200, height: 600, aspectRatio: '2:1' },
  twitterSummary: { width: 1200, height: 1200, aspectRatio: '1:1' },
} as const

/**
 * Generate optimized title with automatic truncation
 */
export function generateTitle(title: string, options: {
  includeSiteName?: boolean
  maxLength?: number
  format?: 'default' | 'article' | 'category'
} = {}): string {
  const {
    includeSiteName = true,
    maxLength = META_LIMITS.title,
    format = 'default'
  } = options

  let formattedTitle = title

  // Format based on type
  if (format === 'article') {
    formattedTitle = title
  } else if (format === 'category') {
    formattedTitle = `${title} Articles`
  }

  // Add site name if requested
  if (includeSiteName && formattedTitle !== SITE_CONFIG.name) {
    const combined = `${formattedTitle} | ${SITE_CONFIG.name}`
    if (combined.length <= maxLength) {
      return combined
    }
    // If too long, truncate the main title to fit
    const separator = ' | '
    const availableLength = maxLength - SITE_CONFIG.name.length - separator.length
    if (availableLength > 20) { // Ensure we have reasonable space
      return `${truncateText(formattedTitle, availableLength)}${separator}${SITE_CONFIG.name}`
    }
  }

  return truncateText(formattedTitle, maxLength)
}

/**
 * Generate optimized description
 */
export function generateDescription(content: string, options: {
  maxLength?: number
  forSocial?: boolean
  excerpt?: string
} = {}): string {
  const {
    maxLength = options.forSocial ? META_LIMITS.descriptionSocial : META_LIMITS.description,
    excerpt
  } = options

  // Use excerpt if provided, otherwise extract from content
  const text = excerpt || extractPlainText(content)
  return truncateText(text, maxLength)
}

/**
 * Extract and optimize keywords from content
 */
export function extractKeywords(content: string, tags: string[] = []): string[] {
  const keywords = new Set<string>()

  // Add tags first (they're most relevant)
  tags.forEach(tag => keywords.add(tag.toLowerCase()))

  // Add common technical keywords if present in content
  const commonKeywords = [
    'javascript', 'typescript', 'react', 'nextjs', 'node',
    'python', 'web development', 'programming', 'software',
    'frontend', 'backend', 'fullstack', 'api', 'database'
  ]

  const lowerContent = content.toLowerCase()
  commonKeywords.forEach(keyword => {
    if (lowerContent.includes(keyword) && keywords.size < META_LIMITS.keywords) {
      keywords.add(keyword)
    }
  })

  return Array.from(keywords).slice(0, META_LIMITS.keywords)
}

/**
 * Generate complete metadata for blog posts
 */
export function generateBlogPostMetadata(post: BlogPost, options: {
  generateOGImage?: boolean
} = {}): Metadata {
  const { generateOGImage = true } = options

  const title = generateTitle(post.title, { includeSiteName: true })
  const description = generateDescription(
    post.content,
    { excerpt: post.excerpt || post.subtitle, maxLength: META_LIMITS.description }
  )
  const socialDescription = generateDescription(
    post.content,
    { excerpt: post.excerpt || post.subtitle, forSocial: true }
  )
  const canonicalUrl = getCanonicalUrl(`blog/${post.slug}`)
  const keywords = extractKeywords(post.content, post.tags)

  // Determine image URL - use dynamic OG image if requested
  let ogImage: string
  if (generateOGImage && post.title) {
    // Pass data via URL params instead of querying in edge runtime
    const params = new URLSearchParams({
      type: 'post',
      title: post.title,
      ...(post.subtitle || post.excerpt ? { subtitle: post.subtitle || post.excerpt || '' } : {}),
      ...(post.author?.name ? { author: post.author.name } : {}),
      ...(post.publishedAt || post.date ? { date: post.publishedAt || post.date } : {}),
    })
    ogImage = `${SITE_CONFIG.url}/api/og?${params.toString()}`
  } else {
    ogImage = getOpenGraphImage(post.image)
  }

  const publishedTime = post.publishedAt || post.date
  const modifiedTime = post.updatedAt || publishedTime

  return {
    title,
    description,
    keywords: keywords.join(', '),
    authors: [{
      name: post.author.name,
      url: post.author.url
    }],
    creator: post.author.name,
    publisher: SITE_CONFIG.name,
    openGraph: {
      type: 'article',
      title: truncateText(post.title, META_LIMITS.ogTitle),
      description: socialDescription,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      locale: SITE_CONFIG.locale,
      publishedTime: formatSEODate(publishedTime),
      modifiedTime: formatSEODate(modifiedTime),
      authors: [post.author.name],
      tags: post.tags,
      section: post.tags[0] || 'Technology',
      images: [
        {
          url: ogImage,
          width: IMAGE_SPECS.og.width,
          height: IMAGE_SPECS.og.height,
          alt: post.imageAlt || post.title,
          type: 'image/jpeg',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: SITE_CONFIG.twitterHandle,
      creator: post.author.twitter || SITE_CONFIG.twitterHandle,
      title: truncateText(post.title, META_LIMITS.twitterTitle),
      description: socialDescription,
      images: [
        {
          url: ogImage,
          alt: post.imageAlt || post.title,
        },
      ],
    },
    alternates: {
      canonical: canonicalUrl,
    },
    other: {
      'article:published_time': formatSEODate(publishedTime),
      'article:modified_time': formatSEODate(modifiedTime),
      'article:author': post.author.name,
      'article:section': post.tags[0] || 'Technology',
      'article:tag': post.tags.join(','),
    },
  }
}

/**
 * Generate complete metadata for projects
 */
export function generateProjectMetadata(project: Project, options: {
  generateOGImage?: boolean
} = {}): Metadata {
  const { generateOGImage = true } = options

  const title = generateTitle(project.title, { includeSiteName: true })
  const description = generateDescription(
    project.content || project.description,
    { excerpt: project.description, maxLength: META_LIMITS.description }
  )
  const socialDescription = generateDescription(
    project.content || project.description,
    { excerpt: project.description, forSocial: true }
  )
  const canonicalUrl = getCanonicalUrl(`projects/${project.slug}`)
  const keywords = extractKeywords(project.description, project.technologies)

  // Determine image URL
  let ogImage: string
  if (generateOGImage && project.title) {
    // Pass data via URL params instead of querying in edge runtime
    const params = new URLSearchParams({
      type: 'project',
      title: project.title,
      ...(project.description ? { subtitle: project.description } : {}),
    })

    // Add technologies (up to 4)
    const techs = project.technologies.slice(0, 4)
    techs.forEach((tech, index) => {
      params.set(`tech${index + 1}`, tech)
    })

    ogImage = `${SITE_CONFIG.url}/api/og?${params.toString()}`
  } else {
    ogImage = getOpenGraphImage(project.image)
  }

  return {
    title,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: SITE_CONFIG.author }],
    creator: SITE_CONFIG.author,
    publisher: SITE_CONFIG.name,
    openGraph: {
      type: 'website',
      title: truncateText(project.title, META_LIMITS.ogTitle),
      description: socialDescription,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      locale: SITE_CONFIG.locale,
      images: [
        {
          url: ogImage,
          width: IMAGE_SPECS.og.width,
          height: IMAGE_SPECS.og.height,
          alt: project.title,
          type: 'image/jpeg',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: SITE_CONFIG.twitterHandle,
      creator: SITE_CONFIG.twitterHandle,
      title: truncateText(project.title, META_LIMITS.twitterTitle),
      description: socialDescription,
      images: [
        {
          url: ogImage,
          alt: project.title,
        },
      ],
    },
    alternates: {
      canonical: canonicalUrl,
    },
    other: {
      'og:type': 'website',
      'og:see_also': [
        project.githubUrl,
        project.liveUrl,
      ].filter(Boolean).join(','),
    },
  }
}

/**
 * Generate metadata for listing pages (blog list, projects list, etc.)
 */
export function generateListingMetadata(options: {
  title: string
  description: string
  path: string
  type: 'blog' | 'projects' | 'category'
  category?: string
  count?: number
}): Metadata {
  const { title, description, path, type, category, count } = options

  const fullTitle = generateTitle(title, {
    includeSiteName: true,
    format: category ? 'category' : 'default'
  })
  const metaDescription = truncateText(description, META_LIMITS.description)
  const socialDescription = truncateText(description, META_LIMITS.descriptionSocial)
  const canonicalUrl = getCanonicalUrl(path)
  const ogImage = `${SITE_CONFIG.url}/api/og?type=${type}&title=${encodeURIComponent(title)}`

  const metadata: Metadata = {
    title: fullTitle,
    description: metaDescription,
    openGraph: {
      type: 'website',
      title: truncateText(title, META_LIMITS.ogTitle),
      description: socialDescription,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      locale: SITE_CONFIG.locale,
      images: [
        {
          url: ogImage,
          width: IMAGE_SPECS.og.width,
          height: IMAGE_SPECS.og.height,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: SITE_CONFIG.twitterHandle,
      creator: SITE_CONFIG.twitterHandle,
      title: truncateText(title, META_LIMITS.twitterTitle),
      description: socialDescription,
      images: [ogImage],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  }

  // Add collection size if provided
  if (count !== undefined) {
    metadata.other = {
      ...metadata.other,
      'og:article:published_section': category || type,
      'og:article:count': count.toString(),
    }
  }

  return metadata
}

/**
 * Generate metadata for profile/about pages
 */
export function generateProfileMetadata(options: {
  name: string
  bio: string
  image?: string
  url?: string
  socials?: {
    twitter?: string
    github?: string
    linkedin?: string
  }
}): Metadata {
  const { name, bio, image, url, socials } = options

  const title = generateTitle(`About ${name}`, { includeSiteName: true })
  const description = truncateText(bio, META_LIMITS.description)
  const socialDescription = truncateText(bio, META_LIMITS.descriptionSocial)
  const canonicalUrl = url ? getCanonicalUrl(url) : getCanonicalUrl('about')
  const profileImage = image ? getOpenGraphImage(image) : `${SITE_CONFIG.url}/images/og-default.jpg`

  return {
    title,
    description,
    authors: [{ name }],
    openGraph: {
      type: 'profile',
      title: name,
      description: socialDescription,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      locale: SITE_CONFIG.locale,
      images: [
        {
          url: profileImage,
          width: IMAGE_SPECS.og.width,
          height: IMAGE_SPECS.og.height,
          alt: name,
        },
      ],
      ...(name && { firstName: name.split(' ')[0] }),
      ...(name && name.split(' ').length > 1 && { lastName: name.split(' ').slice(1).join(' ') }),
    },
    twitter: {
      card: 'summary',
      site: SITE_CONFIG.twitterHandle,
      creator: socials?.twitter || SITE_CONFIG.twitterHandle,
      title: name,
      description: socialDescription,
      images: [profileImage],
    },
    alternates: {
      canonical: canonicalUrl,
    },
    other: {
      ...(socials?.github && { 'profile:github': socials.github }),
      ...(socials?.linkedin && { 'profile:linkedin': socials.linkedin }),
    },
  }
}

/**
 * Generate default fallback metadata
 */
export function generateDefaultMetadata(options: {
  title?: string
  description?: string
  path?: string
  noindex?: boolean
} = {}): Metadata {
  const {
    title = SITE_CONFIG.name,
    description = SITE_CONFIG.description,
    path = '',
    noindex = false,
  } = options

  const fullTitle = title === SITE_CONFIG.name ? title : generateTitle(title, { includeSiteName: true })
  const metaDescription = truncateText(description, META_LIMITS.description)
  const canonicalUrl = getCanonicalUrl(path)
  const ogImage = `${SITE_CONFIG.url}/images/og-default.jpg`

  return {
    title: fullTitle,
    description: metaDescription,
    ...(noindex && {
      robots: {
        index: false,
        follow: false,
      },
    }),
    openGraph: {
      type: 'website',
      title: truncateText(title, META_LIMITS.ogTitle),
      description: truncateText(description, META_LIMITS.descriptionSocial),
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      locale: SITE_CONFIG.locale,
      images: [
        {
          url: ogImage,
          width: IMAGE_SPECS.og.width,
          height: IMAGE_SPECS.og.height,
          alt: SITE_CONFIG.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: SITE_CONFIG.twitterHandle,
      creator: SITE_CONFIG.twitterHandle,
      title: truncateText(title, META_LIMITS.twitterTitle),
      description: truncateText(description, META_LIMITS.descriptionSocial),
      images: [ogImage],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  }
}

/**
 * Merge custom metadata with generated metadata
 */
export function mergeMetadata(base: Metadata, custom: Partial<Metadata>): Metadata {
  return {
    ...base,
    ...custom,
    openGraph: {
      ...base.openGraph,
      ...custom.openGraph,
    },
    twitter: {
      ...base.twitter,
      ...custom.twitter,
    },
    alternates: {
      ...base.alternates,
      ...custom.alternates,
    },
    other: {
      ...base.other,
      ...custom.other,
    },
  }
}
