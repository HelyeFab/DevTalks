/**
 * Atom Feed Generation
 * Generates Atom 1.0 feed for blog posts
 * https://validator.w3.org/feed/docs/atom.html
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
  // Remove HTML tags for plain text summary
  return html.replace(/<[^>]*>/g, '').substring(0, 200)
}

function generateAtomEntry(post: BlogPost): string {
  const url = `${SITE_CONFIG.url}/blog/${post.slug}`
  const published = new Date(post.publishedAt || post.date).toISOString()
  const updated = new Date(post.publishedAt || post.date).toISOString()
  const summary = post.excerpt || post.subtitle || stripHtml(post.content)

  return `
    <entry>
      <title>${escapeXml(post.title)}</title>
      <link href="${url}" rel="alternate" type="text/html"/>
      <id>${url}</id>
      <published>${published}</published>
      <updated>${updated}</updated>
      <summary type="text">${escapeXml(summary)}</summary>
      <content type="html"><![CDATA[${post.content}]]></content>
      <author>
        <name>${escapeXml(post.author.name)}</name>
        ${post.author.email ? `<email>${escapeXml(post.author.email)}</email>` : ''}
      </author>
      ${post.tags.map((tag: string) => `<category term="${escapeXml(tag)}" label="${escapeXml(tag)}"/>`).join('\n      ')}
    </entry>`
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

    // Get the most recent post date for updated field
    const lastUpdated = sortedPosts.length > 0
      ? new Date(sortedPosts[0].publishedAt || sortedPosts[0].date).toISOString()
      : new Date().toISOString()

    const atomEntries = sortedPosts.map(generateAtomEntry).join('\n')

    const atomFeed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(SITE_CONFIG.name)}</title>
  <link href="${SITE_CONFIG.url}" rel="alternate" type="text/html"/>
  <link href="${SITE_CONFIG.url}/atom.xml" rel="self" type="application/atom+xml"/>
  <id>${SITE_CONFIG.url}</id>
  <updated>${lastUpdated}</updated>
  <subtitle>${escapeXml(SITE_CONFIG.description)}</subtitle>
  <generator>Next.js Atom Feed Generator</generator>
  <rights>Copyright ${new Date().getFullYear()} ${escapeXml(SITE_CONFIG.name)}</rights>
  <author>
    <name>${escapeXml(SITE_CONFIG.author)}</name>
  </author>
  <logo>${SITE_CONFIG.url}/images/logo.png</logo>
  <icon>${SITE_CONFIG.url}/favicon.ico</icon>${atomEntries}
</feed>`

    return new Response(atomFeed, {
      headers: {
        'Content-Type': 'application/atom+xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('Error generating Atom feed:', error)
    return new Response('Error generating Atom feed', { status: 500 })
  }
}
