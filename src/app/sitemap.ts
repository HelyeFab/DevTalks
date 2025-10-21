/**
 * Dynamic Sitemap Generation
 * Generates XML sitemap for search engine crawlers
 * Includes blog posts, projects, announcements, and static pages
 */

import { MetadataRoute } from 'next'
import { getAllPosts } from '@/lib/blog-server'
import { getAllProjects } from '@/lib/projects'
import { getAllAnnouncements } from '@/lib/announcements'
import { SITE_CONFIG } from '@/lib/seo/utils'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_CONFIG.url

  // Static pages with appropriate priorities
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ]

  try {
    // Get all published blog posts
    const postsResult = await getAllPosts({ publishedOnly: true })
    const posts = postsResult.items

    const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.publishedAt || post.date),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      // Add images to sitemap for better image SEO
      images: post.image ? [post.image] : undefined,
    }))

    // Get all projects
    const projectsResult = await getAllProjects()
    const projects = projectsResult.items

    const projectPages: MetadataRoute.Sitemap = projects.map((project) => ({
      url: `${baseUrl}/projects/${project.slug}`,
      lastModified: new Date(project.updatedAt || project.createdAt || new Date()),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
      // Add images to sitemap
      images: project.image ? [project.image] : undefined,
    }))

    // Get all published announcements
    const announcements = await getAllAnnouncements(true)

    const announcementPages: MetadataRoute.Sitemap = announcements.map((announcement) => ({
      url: `${baseUrl}/announcements`,
      lastModified: new Date(announcement.updatedAt),
      changeFrequency: 'daily' as const,
      priority: 0.5,
    }))

    // Combine all pages
    // Note: Next.js sitemap supports max 50,000 URLs
    const allPages = [...staticPages, ...blogPages, ...projectPages, ...announcementPages]

    // Ensure we don't exceed sitemap limits
    if (allPages.length > 50000) {
      console.warn('Sitemap exceeds 50,000 URLs. Consider implementing sitemap index.')
      return allPages.slice(0, 50000)
    }

    return allPages
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Return at least static pages if there's an error
    return staticPages
  }
}

/**
 * Enable dynamic sitemap generation
 * This will regenerate the sitemap on every request in development
 * and use ISR (Incremental Static Regeneration) in production
 */
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour
