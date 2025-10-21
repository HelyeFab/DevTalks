/**
 * Internal Search API
 * Provides search functionality across blog posts, projects, and announcements
 * Supports SEO-friendly search that can be crawled and indexed
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAllPosts } from '@/lib/blog-server'
import { getAllProjects } from '@/lib/projects-server'
import { getAllAnnouncements } from '@/lib/announcements-server'

interface SearchResult {
  type: 'post' | 'project' | 'announcement'
  id: string
  title: string
  description: string
  url: string
  date?: string
  tags?: string[]
  relevanceScore: number
}

/**
 * Calculate relevance score based on query match
 */
function calculateRelevance(query: string, text: string, multiplier = 1): number {
  const lowerQuery = query.toLowerCase()
  const lowerText = text.toLowerCase()

  // Exact match in title/name
  if (lowerText === lowerQuery) return 100 * multiplier

  // Starts with query
  if (lowerText.startsWith(lowerQuery)) return 80 * multiplier

  // Contains query
  if (lowerText.includes(lowerQuery)) return 50 * multiplier

  // Check for partial word matches
  const queryWords = lowerQuery.split(/\s+/)
  const textWords = lowerText.split(/\s+/)
  let matchCount = 0

  queryWords.forEach(qWord => {
    if (textWords.some(tWord => tWord.includes(qWord) || qWord.includes(tWord))) {
      matchCount++
    }
  })

  return (matchCount / queryWords.length) * 30 * multiplier
}

/**
 * Search across all content
 */
async function searchContent(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = []

  try {
    // Search blog posts
    const postsResult = await getAllPosts({ publishedOnly: true })
    const posts = postsResult.items

    posts.forEach(post => {
      const titleScore = calculateRelevance(query, post.title, 3)
      const subtitleScore = post.subtitle ? calculateRelevance(query, post.subtitle, 2) : 0
      const contentScore = calculateRelevance(query, post.content, 1)
      const tagsScore = post.tags.some(tag =>
        tag.toLowerCase().includes(query.toLowerCase())
      ) ? 40 : 0

      const totalScore = titleScore + subtitleScore + contentScore + tagsScore

      if (totalScore > 0) {
        results.push({
          type: 'post',
          id: post.id || '',
          title: post.title,
          description: post.subtitle || post.excerpt || post.content.substring(0, 150),
          url: `/blog/${post.slug}`,
          date: post.publishedAt || post.date,
          tags: post.tags,
          relevanceScore: totalScore
        })
      }
    })

    // Search projects
    const projectsResult = await getAllProjects()
    const projects = projectsResult.items

    projects.forEach(project => {
      const titleScore = calculateRelevance(query, project.title, 3)
      const descScore = calculateRelevance(query, project.description, 2)
      const contentScore = calculateRelevance(query, project.content || '', 1)
      const techScore = project.technologies.some(tech =>
        tech.toLowerCase().includes(query.toLowerCase())
      ) ? 40 : 0

      const totalScore = titleScore + descScore + contentScore + techScore

      if (totalScore > 0) {
        results.push({
          type: 'project',
          id: project.id || '',
          title: project.title,
          description: project.description,
          url: `/projects/${project.slug}`,
          date: project.createdAt,
          tags: project.technologies,
          relevanceScore: totalScore
        })
      }
    })

    // Search announcements
    const announcements = await getAllAnnouncements(true)

    announcements.forEach(announcement => {
      const titleScore = calculateRelevance(query, announcement.title, 3)
      const contentScore = calculateRelevance(query, announcement.content, 2)

      const totalScore = titleScore + contentScore

      if (totalScore > 0) {
        results.push({
          type: 'announcement',
          id: announcement.id || '',
          title: announcement.title,
          description: announcement.content.substring(0, 150),
          url: `/announcements`,
          date: announcement.publishedAt || announcement.createdAt,
          relevanceScore: totalScore
        })
      }
    })

    // Sort by relevance score
    results.sort((a, b) => b.relevanceScore - a.relevanceScore)

    return results
  } catch (error) {
    console.error('Error searching content:', error)
    return []
  }
}

/**
 * GET /api/search
 * Query params:
 * - q: search query (required)
 * - limit: max results (optional, default 20)
 * - type: filter by type (optional: post, project, announcement)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const type = searchParams.get('type') as 'post' | 'project' | 'announcement' | null

    // Validate query
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    // Minimum query length
    if (query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      )
    }

    // Perform search
    let results = await searchContent(query.trim())

    // Filter by type if specified
    if (type) {
      results = results.filter(r => r.type === type)
    }

    // Limit results
    results = results.slice(0, limit)

    return NextResponse.json({
      query,
      total: results.length,
      results
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      }
    })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Export route segment config
 */
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
