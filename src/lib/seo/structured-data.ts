/**
 * Structured Data (Schema.org) Generator
 * Creates JSON-LD structured data for various content types
 * Follows Schema.org standards for optimal search engine understanding
 */

import { SITE_CONFIG, formatSEODate } from './utils'
import type { BlogPost } from '@/types/blog'
import type { Project } from '@/types/project'
import type { Announcement } from '@/lib/announcements'

export interface Person {
  '@type': 'Person'
  name: string
  email?: string
  image?: string
  url?: string
}

export interface Organization {
  '@type': 'Organization'
  name: string
  url: string
  logo?: string
  sameAs?: string[]
  description?: string
}

export interface BreadcrumbListItem {
  '@type': 'ListItem'
  position: number
  name: string
  item: string
}

export interface BreadcrumbList {
  '@context': 'https://schema.org'
  '@type': 'BreadcrumbList'
  itemListElement: BreadcrumbListItem[]
}

/**
 * Generate WebSite schema with search action
 */
export function generateWebSiteSchema(): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    url: SITE_CONFIG.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.url}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    },
    publisher: generateOrganizationSchema()
  }
}

/**
 * Generate Organization schema
 */
export function generateOrganizationSchema(): Organization {
  return {
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}/images/logo.png`,
    sameAs: [
      // Add social media profiles here
      // 'https://twitter.com/italkdevs',
      // 'https://github.com/italkdevs',
      // 'https://linkedin.com/company/italkdevs'
    ],
    description: SITE_CONFIG.description
  }
}

/**
 * Generate Person schema for authors
 */
export function generatePersonSchema(author: {
  name: string
  email?: string
  image?: string
}): Person {
  return {
    '@type': 'Person',
    name: author.name,
    email: author.email,
    image: author.image,
    url: `${SITE_CONFIG.url}/about`
  }
}

/**
 * Generate BlogPosting schema for blog posts
 */
export function generateBlogPostingSchema(post: BlogPost): Record<string, any> {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.subtitle || post.excerpt,
    image: post.image ? `${SITE_CONFIG.url}${post.image}` : undefined,
    datePublished: formatSEODate(post.publishedAt || post.date),
    dateModified: formatSEODate(post.publishedAt || post.date),
    author: generatePersonSchema(post.author),
    publisher: generateOrganizationSchema(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_CONFIG.url}/blog/${post.slug}`
    },
    url: `${SITE_CONFIG.url}/blog/${post.slug}`,
    keywords: post.tags.join(', '),
    articleSection: post.tags[0] || 'Technology',
    wordCount: post.content.split(/\s+/).length,
    timeRequired: `PT${post.readTime || 5}M`,
    inLanguage: 'en-US'
  }

  // Remove undefined values
  return Object.fromEntries(
    Object.entries(schema).filter(([_, value]) => value !== undefined)
  )
}

/**
 * Generate Article schema (alternative to BlogPosting)
 */
export function generateArticleSchema(post: BlogPost): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.subtitle || post.excerpt,
    image: post.image ? `${SITE_CONFIG.url}${post.image}` : undefined,
    datePublished: formatSEODate(post.publishedAt || post.date),
    dateModified: formatSEODate(post.publishedAt || post.date),
    author: generatePersonSchema(post.author),
    publisher: generateOrganizationSchema(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_CONFIG.url}/blog/${post.slug}`
    }
  }
}

/**
 * Generate SoftwareApplication schema for projects
 */
export function generateSoftwareApplicationSchema(project: Project): Record<string, any> {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: project.title,
    description: project.description,
    applicationCategory: 'WebApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    operatingSystem: 'Web Browser',
    image: project.image ? `${SITE_CONFIG.url}${project.image}` : undefined,
    url: `${SITE_CONFIG.url}/projects/${project.slug}`,
    author: generateOrganizationSchema(),
    dateCreated: project.createdAt ? formatSEODate(project.createdAt) : undefined,
    dateModified: project.updatedAt ? formatSEODate(project.updatedAt) : undefined,
    keywords: project.technologies.join(', '),
    programmingLanguage: project.technologies,
    codeRepository: project.githubUrl,
    softwareVersion: '1.0.0'
  }

  // Remove undefined values
  return Object.fromEntries(
    Object.entries(schema).filter(([_, value]) => value !== undefined)
  )
}

/**
 * Generate CreativeWork schema for projects (alternative approach)
 */
export function generateCreativeWorkSchema(project: Project): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    description: project.description,
    image: project.image ? `${SITE_CONFIG.url}${project.image}` : undefined,
    url: `${SITE_CONFIG.url}/projects/${project.slug}`,
    creator: generateOrganizationSchema(),
    dateCreated: project.createdAt ? formatSEODate(project.createdAt) : undefined,
    keywords: project.technologies.join(', ')
  }
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>): BreadcrumbList {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${SITE_CONFIG.url}${crumb.url}`
    }))
  }
}

/**
 * Generate CollectionPage schema for blog listing
 */
export function generateCollectionPageSchema(
  posts: BlogPost[],
  page = 1,
  totalPages = 1
): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${SITE_CONFIG.name} - Blog`,
    description: 'Latest articles and blog posts about software development',
    url: `${SITE_CONFIG.url}/blog`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: posts.map((post, index) => ({
        '@type': 'ListItem',
        position: (page - 1) * 10 + index + 1,
        url: `${SITE_CONFIG.url}/blog/${post.slug}`,
        name: post.title
      }))
    },
    numberOfItems: posts.length,
    pageStart: page,
    pageEnd: totalPages
  }
}

/**
 * Generate FAQ schema (for pages with Q&A format)
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }
}

/**
 * Generate Event schema for announcements
 */
export function generateEventSchema(announcement: Announcement): Record<string, any> | null {
  if (!announcement.startDate) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: announcement.title,
    description: announcement.content,
    startDate: formatSEODate(announcement.startDate),
    endDate: announcement.endDate ? formatSEODate(announcement.endDate) : undefined,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    location: {
      '@type': 'VirtualLocation',
      url: SITE_CONFIG.url
    },
    organizer: generateOrganizationSchema()
  }
}

/**
 * Generate ItemList schema for project listing
 */
export function generateItemListSchema(
  projects: Project[],
  listName = 'Projects'
): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    numberOfItems: projects.length,
    itemListElement: projects.map((project, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'SoftwareApplication',
        name: project.title,
        description: project.description,
        url: `${SITE_CONFIG.url}/projects/${project.slug}`,
        image: project.image ? `${SITE_CONFIG.url}${project.image}` : undefined
      }
    }))
  }
}

/**
 * Generate ProfilePage schema
 */
export function generateProfilePageSchema(profile: {
  name: string
  bio: string
  image?: string
  url: string
}): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: profile.name,
      description: profile.bio,
      image: profile.image,
      url: profile.url
    }
  }
}

/**
 * Helper function to convert schema to JSON-LD script tag
 */
export function schemaToJsonLd(schema: Record<string, any>): string {
  return JSON.stringify(schema, null, 2)
}

/**
 * Generate multiple schemas combined
 */
export function generateCombinedSchema(...schemas: Record<string, any>[]): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@graph': schemas
  }
}
