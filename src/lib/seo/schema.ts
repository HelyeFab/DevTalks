/**
 * Schema.org Structured Data Helpers
 * Functions to generate JSON-LD structured data for SEO
 */

import { SITE_CONFIG, formatSEODate, getCanonicalUrl } from './utils'
import type { BlogPost, Author } from '@/types/blog'
import type { Project } from '@/types/project'

/**
 * Base Schema.org types
 */
interface BaseSchema {
  '@context': string
  '@type': string
}

/**
 * Organization Schema
 */
export interface OrganizationSchema extends BaseSchema {
  '@type': 'Organization'
  name: string
  url: string
  logo?: {
    '@type': 'ImageObject'
    url: string
  }
  sameAs?: string[]
  description?: string
}

/**
 * Generate Organization schema
 */
export function generateOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_CONFIG.url}/images/logo.png`,
    },
    description: SITE_CONFIG.description,
    sameAs: [
      // Add social media URLs here when available
      // 'https://twitter.com/italkdevs',
      // 'https://github.com/italkdevs',
      // 'https://linkedin.com/company/italkdevs'
    ].filter(Boolean),
  }
}

/**
 * Person Schema
 */
export interface PersonSchema extends BaseSchema {
  '@type': 'Person'
  name: string
  url?: string
  image?: string
  description?: string
  sameAs?: string[]
}

/**
 * Generate Person schema for author
 */
export function generatePersonSchema(author: Author): PersonSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    image: author.image,
    // Add more author details if available
  }
}

/**
 * BlogPosting Schema
 */
export interface BlogPostingSchema extends BaseSchema {
  '@type': 'BlogPosting'
  headline: string
  description: string
  image?: string | string[]
  datePublished: string
  dateModified?: string
  author: PersonSchema | PersonSchema[]
  publisher: OrganizationSchema
  mainEntityOfPage: {
    '@type': 'WebPage'
    '@id': string
  }
  keywords?: string
  articleSection?: string
  wordCount?: number
  timeRequired?: string
}

/**
 * Generate BlogPosting schema
 */
export function generateBlogPostSchema(post: BlogPost): BlogPostingSchema {
  const url = getCanonicalUrl(`blog/${post.slug}`)
  const readTimeInMinutes = post.readTime || 5

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || post.subtitle,
    image: post.image ? [post.image] : undefined,
    datePublished: formatSEODate(post.publishedAt || post.date),
    dateModified: formatSEODate(post.publishedAt || post.date),
    author: generatePersonSchema(post.author),
    publisher: generateOrganizationSchema(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    keywords: post.tags.join(', '),
    articleSection: post.tags[0] || 'Technology',
    timeRequired: `PT${readTimeInMinutes}M`,
  }
}

/**
 * BreadcrumbList Schema
 */
export interface BreadcrumbListSchema extends BaseSchema {
  '@type': 'BreadcrumbList'
  itemListElement: BreadcrumbItemSchema[]
}

export interface BreadcrumbItemSchema {
  '@type': 'ListItem'
  position: number
  name: string
  item: string
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>): BreadcrumbListSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: getCanonicalUrl(item.url),
    })),
  }
}

/**
 * WebSite Schema with SearchAction
 */
export interface WebSiteSchema extends BaseSchema {
  '@type': 'WebSite'
  name: string
  url: string
  description: string
  potentialAction?: {
    '@type': 'SearchAction'
    target: {
      '@type': 'EntryPoint'
      urlTemplate: string
    }
    'query-input': string
  }
}

/**
 * Generate WebSite schema with search functionality
 */
export function generateWebSiteSchema(): WebSiteSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

/**
 * CollectionPage Schema for blog listing
 */
export interface CollectionPageSchema extends BaseSchema {
  '@type': 'CollectionPage'
  name: string
  description: string
  url: string
}

/**
 * Generate CollectionPage schema
 */
export function generateCollectionPageSchema(
  name: string,
  description: string,
  path: string
): CollectionPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: getCanonicalUrl(path),
  }
}

/**
 * SoftwareSourceCode Schema for projects
 */
export interface SoftwareSourceCodeSchema extends BaseSchema {
  '@type': 'SoftwareSourceCode'
  name: string
  description: string
  url?: string
  codeRepository?: string
  programmingLanguage?: string | string[]
  author?: PersonSchema | OrganizationSchema
  dateCreated?: string
  dateModified?: string
  image?: string
}

/**
 * Generate SoftwareSourceCode schema for projects
 */
export function generateProjectSchema(project: Project): SoftwareSourceCodeSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: project.title,
    description: project.description,
    url: project.liveUrl,
    codeRepository: project.githubUrl,
    programmingLanguage: project.technologies,
    author: generateOrganizationSchema(),
    dateCreated: project.createdAt ? formatSEODate(project.createdAt) : undefined,
    dateModified: project.updatedAt ? formatSEODate(project.updatedAt) : undefined,
    image: project.image,
  }
}

/**
 * ItemList Schema for lists
 */
export interface ItemListSchema extends BaseSchema {
  '@type': 'ItemList'
  itemListElement: Array<{
    '@type': 'ListItem'
    position: number
    url: string
    name?: string
  }>
  numberOfItems: number
}

/**
 * Generate ItemList schema for blog posts or projects
 */
export function generateItemListSchema(
  items: Array<{ url: string; name?: string }>
): ItemListSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: getCanonicalUrl(item.url),
      name: item.name,
    })),
  }
}

/**
 * FAQ Schema
 */
export interface FAQSchema extends BaseSchema {
  '@type': 'FAQPage'
  mainEntity: Array<{
    '@type': 'Question'
    name: string
    acceptedAnswer: {
      '@type': 'Answer'
      text: string
    }
  }>
}

/**
 * Generate FAQ schema
 */
export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>
): FAQSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

/**
 * AboutPage Schema
 */
export interface AboutPageSchema extends BaseSchema {
  '@type': 'AboutPage'
  name: string
  description: string
  url: string
  mainEntity?: OrganizationSchema | PersonSchema
}

/**
 * Generate AboutPage schema
 */
export function generateAboutPageSchema(): AboutPageSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: `About ${SITE_CONFIG.name}`,
    description: SITE_CONFIG.description,
    url: getCanonicalUrl('about'),
    mainEntity: generateOrganizationSchema(),
  }
}

/**
 * Helper to combine multiple schemas
 */
export function combineSchemas(...schemas: BaseSchema[]): { '@context': string; '@graph': BaseSchema[] } {
  return {
    '@context': 'https://schema.org',
    '@graph': schemas,
  }
}

/**
 * Helper to generate JSON-LD script content
 */
export function toJsonLd(schema: BaseSchema | BaseSchema[] | { '@context': string; '@graph': BaseSchema[] }): string {
  return JSON.stringify(schema, null, 2)
}
