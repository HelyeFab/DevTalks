/**
 * Social Cards Utility
 * Functions for generating and managing social media card metadata
 */

import { SITE_CONFIG } from './utils'

/**
 * Twitter Card Types
 */
export type TwitterCardType =
  | 'summary'
  | 'summary_large_image'
  | 'app'
  | 'player'

/**
 * Open Graph Types
 */
export type OpenGraphType =
  | 'website'
  | 'article'
  | 'profile'
  | 'book'
  | 'video.movie'
  | 'video.episode'
  | 'video.tv_show'
  | 'video.other'
  | 'music.song'
  | 'music.album'
  | 'music.playlist'
  | 'music.radio_station'

/**
 * Social Card Image Configuration
 */
export interface SocialCardImage {
  url: string
  width: number
  height: number
  alt: string
  type?: string
  secureUrl?: string
}

/**
 * Twitter Card Configuration
 */
export interface TwitterCardConfig {
  card: TwitterCardType
  site?: string
  creator?: string
  title: string
  description: string
  image?: string
  imageAlt?: string
  player?: {
    url: string
    width: number
    height: number
    stream?: string
  }
  app?: {
    name: {
      iphone?: string
      ipad?: string
      googleplay?: string
    }
    id: {
      iphone?: string
      ipad?: string
      googleplay?: string
    }
    url: {
      iphone?: string
      ipad?: string
      googleplay?: string
    }
  }
}

/**
 * Open Graph Configuration
 */
export interface OpenGraphConfig {
  type: OpenGraphType
  title: string
  description: string
  url: string
  siteName?: string
  locale?: string
  images: SocialCardImage[]
  // Article-specific
  article?: {
    publishedTime?: string
    modifiedTime?: string
    expirationTime?: string
    authors?: string[]
    section?: string
    tags?: string[]
  }
  // Profile-specific
  profile?: {
    firstName?: string
    lastName?: string
    username?: string
    gender?: string
  }
  // Video-specific
  video?: {
    url: string
    secureUrl?: string
    type?: string
    width?: number
    height?: number
    releaseDate?: string
    tags?: string[]
    duration?: number
  }
  // Music-specific
  music?: {
    duration?: number
    album?: string
    musician?: string
  }
}

/**
 * Generate Twitter Card metadata
 */
export function generateTwitterCard(config: TwitterCardConfig): Record<string, string | undefined> {
  const meta: Record<string, string | undefined> = {
    'twitter:card': config.card,
    'twitter:site': config.site || SITE_CONFIG.twitterHandle,
    'twitter:creator': config.creator || SITE_CONFIG.twitterHandle,
    'twitter:title': config.title,
    'twitter:description': config.description,
  }

  // Add image for summary cards
  if (config.image) {
    meta['twitter:image'] = config.image
    if (config.imageAlt) {
      meta['twitter:image:alt'] = config.imageAlt
    }
  }

  // Add player information if available
  if (config.card === 'player' && config.player) {
    meta['twitter:player'] = config.player.url
    meta['twitter:player:width'] = config.player.width.toString()
    meta['twitter:player:height'] = config.player.height.toString()
    if (config.player.stream) {
      meta['twitter:player:stream'] = config.player.stream
    }
  }

  // Add app information if available
  if (config.card === 'app' && config.app) {
    if (config.app.name.iphone) meta['twitter:app:name:iphone'] = config.app.name.iphone
    if (config.app.name.ipad) meta['twitter:app:name:ipad'] = config.app.name.ipad
    if (config.app.name.googleplay) meta['twitter:app:name:googleplay'] = config.app.name.googleplay

    if (config.app.id.iphone) meta['twitter:app:id:iphone'] = config.app.id.iphone
    if (config.app.id.ipad) meta['twitter:app:id:ipad'] = config.app.id.ipad
    if (config.app.id.googleplay) meta['twitter:app:id:googleplay'] = config.app.id.googleplay

    if (config.app.url.iphone) meta['twitter:app:url:iphone'] = config.app.url.iphone
    if (config.app.url.ipad) meta['twitter:app:url:ipad'] = config.app.url.ipad
    if (config.app.url.googleplay) meta['twitter:app:url:googleplay'] = config.app.url.googleplay
  }

  return meta
}

/**
 * Generate Open Graph metadata
 */
export function generateOpenGraph(config: OpenGraphConfig): Record<string, string | undefined> {
  const meta: Record<string, string | undefined> = {
    'og:type': config.type,
    'og:title': config.title,
    'og:description': config.description,
    'og:url': config.url,
    'og:site_name': config.siteName || SITE_CONFIG.name,
    'og:locale': config.locale || SITE_CONFIG.locale,
  }

  // Add images
  config.images.forEach((image, index) => {
    const prefix = index === 0 ? 'og:image' : `og:image:${index}`
    meta[prefix] = image.url
    if (image.secureUrl) meta[`${prefix}:secure_url`] = image.secureUrl
    if (image.type) meta[`${prefix}:type`] = image.type
    if (image.width) meta[`${prefix}:width`] = image.width.toString()
    if (image.height) meta[`${prefix}:height`] = image.height.toString()
    if (image.alt) meta[`${prefix}:alt`] = image.alt
  })

  // Add article-specific metadata
  if (config.article) {
    if (config.article.publishedTime) {
      meta['article:published_time'] = config.article.publishedTime
    }
    if (config.article.modifiedTime) {
      meta['article:modified_time'] = config.article.modifiedTime
    }
    if (config.article.expirationTime) {
      meta['article:expiration_time'] = config.article.expirationTime
    }
    if (config.article.authors) {
      config.article.authors.forEach((author, index) => {
        meta[`article:author:${index}`] = author
      })
    }
    if (config.article.section) {
      meta['article:section'] = config.article.section
    }
    if (config.article.tags) {
      config.article.tags.forEach((tag, index) => {
        meta[`article:tag:${index}`] = tag
      })
    }
  }

  // Add profile-specific metadata
  if (config.profile) {
    if (config.profile.firstName) meta['profile:first_name'] = config.profile.firstName
    if (config.profile.lastName) meta['profile:last_name'] = config.profile.lastName
    if (config.profile.username) meta['profile:username'] = config.profile.username
    if (config.profile.gender) meta['profile:gender'] = config.profile.gender
  }

  // Add video-specific metadata
  if (config.video) {
    meta['og:video'] = config.video.url
    if (config.video.secureUrl) meta['og:video:secure_url'] = config.video.secureUrl
    if (config.video.type) meta['og:video:type'] = config.video.type
    if (config.video.width) meta['og:video:width'] = config.video.width.toString()
    if (config.video.height) meta['og:video:height'] = config.video.height.toString()
    if (config.video.releaseDate) meta['video:release_date'] = config.video.releaseDate
    if (config.video.duration) meta['video:duration'] = config.video.duration.toString()
    if (config.video.tags) {
      config.video.tags.forEach((tag, index) => {
        meta[`video:tag:${index}`] = tag
      })
    }
  }

  // Add music-specific metadata
  if (config.music) {
    if (config.music.duration) meta['music:duration'] = config.music.duration.toString()
    if (config.music.album) meta['music:album'] = config.music.album
    if (config.music.musician) meta['music:musician'] = config.music.musician
  }

  return meta
}

/**
 * Generate Facebook-specific metadata
 */
export function generateFacebookMeta(options: {
  appId?: string
  admins?: string[]
  pages?: string
}): Record<string, string | undefined> {
  const meta: Record<string, string | undefined> = {}

  if (options.appId) {
    meta['fb:app_id'] = options.appId
  }

  if (options.admins) {
    options.admins.forEach((admin, index) => {
      meta[`fb:admins:${index}`] = admin
    })
  }

  if (options.pages) {
    meta['fb:pages'] = options.pages
  }

  return meta
}

/**
 * Generate LinkedIn-specific metadata
 */
export function generateLinkedInMeta(options: {
  author?: string
  title?: string
  description?: string
  image?: string
}): Record<string, string | undefined> {
  const meta: Record<string, string | undefined> = {}

  if (options.author) meta['linkedin:owner'] = options.author
  if (options.title) meta['linkedin:title'] = options.title
  if (options.description) meta['linkedin:description'] = options.description
  if (options.image) meta['linkedin:image'] = options.image

  return meta
}

/**
 * Generate Pinterest-specific metadata
 */
export function generatePinterestMeta(options: {
  description?: string
  noPin?: boolean
  richPin?: boolean
}): Record<string, string | undefined> {
  const meta: Record<string, string | undefined> = {}

  if (options.description) {
    meta['pinterest:description'] = options.description
  }

  if (options.noPin) {
    meta['pinterest'] = 'nopin'
  }

  if (options.richPin) {
    meta['pinterest-rich-pin'] = 'true'
  }

  return meta
}

/**
 * Validate image dimensions for social cards
 */
export function validateImageDimensions(
  width: number,
  height: number,
  cardType: 'og' | 'twitter_summary' | 'twitter_large'
): { valid: boolean; recommendation?: string } {
  const specs = {
    og: { minWidth: 1200, minHeight: 630, ratio: 1.91 },
    twitter_summary: { minWidth: 120, minHeight: 120, ratio: 1 },
    twitter_large: { minWidth: 1200, minHeight: 600, ratio: 2 },
  }

  const spec = specs[cardType]
  const ratio = width / height

  if (width < spec.minWidth || height < spec.minHeight) {
    return {
      valid: false,
      recommendation: `Image should be at least ${spec.minWidth}x${spec.minHeight}px`,
    }
  }

  const ratioTolerance = 0.1
  if (Math.abs(ratio - spec.ratio) > ratioTolerance) {
    return {
      valid: false,
      recommendation: `Image aspect ratio should be approximately ${spec.ratio}:1`,
    }
  }

  return { valid: true }
}

/**
 * Generate social card preview URLs for testing
 */
export function getSocialCardPreviewUrls(url: string): {
  facebook: string
  twitter: string
  linkedin: string
  pinterest: string
} {
  const encodedUrl = encodeURIComponent(url)

  return {
    facebook: `https://developers.facebook.com/tools/debug/?q=${encodedUrl}`,
    twitter: `https://cards-dev.twitter.com/validator?url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/post-inspector/inspect/${encodedUrl}`,
    pinterest: `https://developers.pinterest.com/tools/url-debugger/?link=${encodedUrl}`,
  }
}

/**
 * Generate comprehensive social card metadata for a page
 */
export function generateComprehensiveSocialMeta(options: {
  title: string
  description: string
  url: string
  image: string
  imageAlt: string
  type?: OpenGraphType
  cardType?: TwitterCardType
  author?: string
  publishedTime?: string
  modifiedTime?: string
  tags?: string[]
  section?: string
}): Record<string, string | undefined> {
  const {
    title,
    description,
    url,
    image,
    imageAlt,
    type = 'website',
    cardType = 'summary_large_image',
    author,
    publishedTime,
    modifiedTime,
    tags,
    section,
  } = options

  // Generate Open Graph metadata
  const ogMeta = generateOpenGraph({
    type,
    title,
    description,
    url,
    images: [
      {
        url: image,
        width: 1200,
        height: 630,
        alt: imageAlt,
        type: 'image/jpeg',
      },
    ],
    ...(type === 'article' && {
      article: {
        publishedTime,
        modifiedTime,
        authors: author ? [author] : undefined,
        section,
        tags,
      },
    }),
  })

  // Generate Twitter Card metadata
  const twitterMeta = generateTwitterCard({
    card: cardType,
    title,
    description,
    image,
    imageAlt,
    creator: author,
  })

  return {
    ...ogMeta,
    ...twitterMeta,
  }
}

/**
 * Extract social metadata from HTML meta tags
 */
export function extractSocialMeta(html: string): {
  og: Record<string, string>
  twitter: Record<string, string>
} {
  const og: Record<string, string> = {}
  const twitter: Record<string, string> = {}

  // Extract og: tags
  const ogMatches = html.matchAll(/<meta\s+property="(og:[^"]+)"\s+content="([^"]+)"/g)
  for (const match of ogMatches) {
    og[match[1]] = match[2]
  }

  // Extract twitter: tags
  const twitterMatches = html.matchAll(/<meta\s+name="(twitter:[^"]+)"\s+content="([^"]+)"/g)
  for (const match of twitterMatches) {
    twitter[match[1]] = match[2]
  }

  return { og, twitter }
}
