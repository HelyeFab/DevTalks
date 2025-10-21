/**
 * RSS Feed Generation
 * Generates RSS 2.0 compliant XML feed for blog posts
 * https://www.rssboard.org/rss-specification
 */

import { getAllPosts } from '@/lib/blog-server'
import { SITE_CONFIG } from '@/lib/seo/utils'
import type { BlogPost } from '@/types/blog'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function stripHtml(html: string): string {
  // Remove HTML tags for plain text description
  return html.replace(/<[^>]*>/g, '').substring(0, 200)
}

function generateRssItem(post: BlogPost): string {
  const url = `${SITE_CONFIG.url}/blog/${post.slug}`
  const pubDate = new Date(post.publishedAt || post.date).toUTCString()
  const description = post.excerpt || post.subtitle || stripHtml(post.content)

  return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(description)}</description>
      <content:encoded><![CDATA[${post.content}]]></content:encoded>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>${escapeXml(post.author.name)}</dc:creator>
      ${post.tags.map((tag: string) => `<category>${escapeXml(tag)}</category>`).join('\n      ')}
      ${post.image ? `<enclosure url="${SITE_CONFIG.url}${post.image}" type="image/jpeg" />` : ''}
    </item>`
}

export async function GET() {
  try {
    // Get all published blog posts
    const postsResult = await getAllPosts({ publishedOnly: true })
    const posts = postsResult.items

    // Sort by date, most recent first
    const sortedPosts = [...posts].sort((a, b) => {
      const dateA = new Date(a.publishedAt || a.date).getTime()
      const dateB = new Date(b.publishedAt || b.date).getTime()
      return dateB - dateA
    })

    // Get the most recent post date for lastBuildDate
    const lastBuildDate = sortedPosts.length > 0
      ? new Date(sortedPosts[0].publishedAt || sortedPosts[0].date).toUTCString()
      : new Date().toUTCString()

    const rssItems = sortedPosts.map(generateRssItem).join('\n')

    const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(SITE_CONFIG.name)}</title>
    <link>${SITE_CONFIG.url}</link>
    <description>${escapeXml(SITE_CONFIG.description)}</description>
    <language>en-US</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE_CONFIG.url}/feed.xml" rel="self" type="application/rss+xml"/>
    <copyright>Copyright ${new Date().getFullYear()} ${escapeXml(SITE_CONFIG.name)}</copyright>
    <generator>Next.js RSS Feed Generator</generator>
    <webMaster>${escapeXml(SITE_CONFIG.author)}</webMaster>
    <managingEditor>${escapeXml(SITE_CONFIG.author)}</managingEditor>
    <ttl>60</ttl>
    <image>
      <url>${SITE_CONFIG.url}/images/logo.png</url>
      <title>${escapeXml(SITE_CONFIG.name)}</title>
      <link>${SITE_CONFIG.url}</link>
    </image>${rssItems}
  </channel>
</rss>`

    return new Response(rssFeed, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('Error generating RSS feed:', error)
    return new Response('Error generating RSS feed', { status: 500 })
  }
}
