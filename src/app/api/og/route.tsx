/**
 * Dynamic Open Graph Image Generator
 * Uses @vercel/og to generate custom OG images for posts, projects, and pages
 */

import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'
import { SITE_CONFIG } from '@/lib/seo/utils'

export const runtime = 'edge'

// Type definitions for data we'll receive via URL params
interface PostData {
  title: string
  subtitle?: string
  excerpt?: string
  author?: {
    name: string
    image?: string
  }
  publishedAt?: string
  date?: string
}

interface ProjectData {
  title: string
  description: string
  technologies?: string[]
}

// Load fonts
const fontBold = fetch(
  new URL('./fonts/Inter-Bold.ttf', import.meta.url)
).then((res) => res.arrayBuffer()).catch(() => null)

const fontRegular = fetch(
  new URL('./fonts/Inter-Regular.ttf', import.meta.url)
).then((res) => res.arrayBuffer()).catch(() => null)

/**
 * GET handler for generating OG images
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'default'
    const title = searchParams.get('title')
    const subtitle = searchParams.get('subtitle')
    const author = searchParams.get('author')
    const date = searchParams.get('date')
    const tech1 = searchParams.get('tech1')
    const tech2 = searchParams.get('tech2')
    const tech3 = searchParams.get('tech3')
    const tech4 = searchParams.get('tech4')

    // Generate image based on type
    switch (type) {
      case 'post':
        return await generatePostImage(title, subtitle, author, date)
      case 'project':
        const technologies = [tech1, tech2, tech3, tech4].filter(Boolean) as string[]
        return await generateProjectImage(title, subtitle, technologies)
      case 'blog':
      case 'projects':
        return await generateListingImage(title || type)
      default:
        return await generateDefaultImage(title)
    }
  } catch (error) {
    console.error('Error generating OG image:', error)
    // Return a fallback error image
    return new Response('Error generating image', { status: 500 })
  }
}

/**
 * Generate OG image for blog posts
 */
async function generatePostImage(
  title: string | null,
  subtitle: string | null,
  author: string | null,
  date: string | null
) {
  if (!title) {
    return generateDefaultImage('Blog Post')
  }

  try {
    const [fontBoldData, fontRegularData] = await Promise.all([fontBold, fontRegular])

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            backgroundColor: '#0f172a',
            backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            padding: '80px',
          }}
        >
          {/* Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'center',
              flex: 1,
            }}
          >
            {/* Title */}
            <div
              style={{
                fontSize: 72,
                fontWeight: 'bold',
                color: '#ffffff',
                lineHeight: 1.2,
                marginBottom: 24,
                maxWidth: '100%',
                display: 'flex',
                flexWrap: 'wrap',
              }}
            >
              {title}
            </div>

            {/* Subtitle/Excerpt */}
            {subtitle && (
              <div
                style={{
                  fontSize: 32,
                  color: '#94a3b8',
                  lineHeight: 1.4,
                  maxWidth: '100%',
                  display: 'flex',
                }}
              >
                {subtitle.substring(0, 120)}
                {subtitle.length > 120 ? '...' : ''}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              borderTop: '2px solid #334155',
              paddingTop: 32,
            }}
          >
            {/* Author info */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    fontSize: 24,
                    color: '#ffffff',
                    fontWeight: 'bold',
                  }}
                >
                  {author || 'iTalkDevs'}
                </div>
                {date && (
                  <div
                    style={{
                      fontSize: 20,
                      color: '#64748b',
                    }}
                  >
                    {new Date(date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Site branding */}
            <div
              style={{
                fontSize: 32,
                fontWeight: 'bold',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {SITE_CONFIG.name}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          ...(fontBoldData ? [{
            name: 'Inter',
            data: fontBoldData,
            weight: 700 as const,
            style: 'normal' as const,
          }] : []),
          ...(fontRegularData ? [{
            name: 'Inter',
            data: fontRegularData,
            weight: 400 as const,
            style: 'normal' as const,
          }] : []),
        ],
      }
    )
  } catch (error) {
    console.error('Error generating post image:', error)
    return generateDefaultImage('Blog Post')
  }
}

/**
 * Generate OG image for projects
 */
async function generateProjectImage(
  title: string | null,
  description: string | null,
  technologies: string[]
) {
  if (!title) {
    return generateDefaultImage('Project')
  }

  try {
    const [fontBoldData, fontRegularData] = await Promise.all([fontBold, fontRegular])

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            backgroundColor: '#1e293b',
            backgroundImage: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
            padding: '80px',
          }}
        >
          {/* Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'center',
              flex: 1,
            }}
          >
            {/* Badge */}
            <div
              style={{
                fontSize: 24,
                color: '#3b82f6',
                fontWeight: 'bold',
                marginBottom: 24,
                display: 'flex',
                backgroundColor: '#1e3a8a',
                padding: '12px 24px',
                borderRadius: '8px',
              }}
            >
              PROJECT
            </div>

            {/* Title */}
            <div
              style={{
                fontSize: 72,
                fontWeight: 'bold',
                color: '#ffffff',
                lineHeight: 1.2,
                marginBottom: 24,
                maxWidth: '100%',
                display: 'flex',
                flexWrap: 'wrap',
              }}
            >
              {title}
            </div>

            {/* Description */}
            {description && (
              <div
                style={{
                  fontSize: 32,
                  color: '#94a3b8',
                  lineHeight: 1.4,
                  maxWidth: '100%',
                  display: 'flex',
                  marginBottom: 24,
                }}
              >
                {description.substring(0, 120)}
                {description.length > 120 ? '...' : ''}
              </div>
            )}

            {/* Technologies */}
            {technologies && technologies.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                {technologies.slice(0, 4).map((tech: string) => (
                  <div
                    key={tech}
                    style={{
                      fontSize: 20,
                      color: '#3b82f6',
                      backgroundColor: '#1e3a8a',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      display: 'flex',
                    }}
                  >
                    {tech}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              width: '100%',
              borderTop: '2px solid #475569',
              paddingTop: 32,
            }}
          >
            {/* Site branding */}
            <div
              style={{
                fontSize: 32,
                fontWeight: 'bold',
                color: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {SITE_CONFIG.name}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          ...(fontBoldData ? [{
            name: 'Inter',
            data: fontBoldData,
            weight: 700 as const,
            style: 'normal' as const,
          }] : []),
          ...(fontRegularData ? [{
            name: 'Inter',
            data: fontRegularData,
            weight: 400 as const,
            style: 'normal' as const,
          }] : []),
        ],
      }
    )
  } catch (error) {
    console.error('Error generating project image:', error)
    return generateDefaultImage('Project')
  }
}

/**
 * Generate OG image for listing pages
 */
async function generateListingImage(title: string) {
  const [fontBoldData, fontRegularData] = await Promise.all([fontBold, fontRegular])

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          padding: '80px',
        }}
      >
        {/* Title */}
        <div
          style={{
            fontSize: 96,
            fontWeight: 'bold',
            color: '#ffffff',
            lineHeight: 1.2,
            marginBottom: 32,
            textAlign: 'center',
            display: 'flex',
          }}
        >
          {title}
        </div>

        {/* Site name */}
        <div
          style={{
            fontSize: 40,
            color: '#3b82f6',
            fontWeight: 'bold',
            display: 'flex',
          }}
        >
          {SITE_CONFIG.name}
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: 32,
            color: '#94a3b8',
            marginTop: 24,
            textAlign: 'center',
            display: 'flex',
          }}
        >
          {SITE_CONFIG.description}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        ...(fontBoldData ? [{
          name: 'Inter',
          data: fontBoldData,
          weight: 700 as const,
          style: 'normal' as const,
        }] : []),
        ...(fontRegularData ? [{
          name: 'Inter',
          data: fontRegularData,
          weight: 400 as const,
          style: 'normal' as const,
        }] : []),
      ],
    }
  )
}

/**
 * Generate default fallback OG image
 */
async function generateDefaultImage(title?: string | null) {
  const [fontBoldData, fontRegularData] = await Promise.all([fontBold, fontRegular])

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          backgroundImage: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #3b82f6 100%)',
          padding: '80px',
        }}
      >
        {/* Logo/Icon placeholder */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            backgroundColor: '#3b82f6',
            marginBottom: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontSize: 64,
              color: '#ffffff',
              fontWeight: 'bold',
              display: 'flex',
            }}
          >
            {SITE_CONFIG.name.charAt(0)}
          </div>
        </div>

        {/* Site name */}
        <div
          style={{
            fontSize: 80,
            fontWeight: 'bold',
            color: '#ffffff',
            lineHeight: 1.2,
            marginBottom: 24,
            display: 'flex',
          }}
        >
          {SITE_CONFIG.name}
        </div>

        {/* Title or description */}
        <div
          style={{
            fontSize: 36,
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: '80%',
            display: 'flex',
          }}
        >
          {title || SITE_CONFIG.description}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        ...(fontBoldData ? [{
          name: 'Inter',
          data: fontBoldData,
          weight: 700 as const,
          style: 'normal' as const,
        }] : []),
        ...(fontRegularData ? [{
          name: 'Inter',
          data: fontRegularData,
          weight: 400 as const,
          style: 'normal' as const,
        }] : []),
      ],
    }
  )
}
