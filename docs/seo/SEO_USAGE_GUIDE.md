# SEO Implementation Usage Guide

## Quick Start

This guide shows how to use the SEO utilities in your Next.js pages and components.

## For New Pages

### 1. Basic Page with Metadata

```typescript
import { Metadata } from 'next'
import { getCanonicalUrl } from '@/lib/seo/utils'

export const metadata: Metadata = {
  title: 'Your Page Title',
  description: 'A compelling description under 155 characters',
  alternates: {
    canonical: getCanonicalUrl('your-page-path'),
  },
}

export default function YourPage() {
  return <div>Your content</div>
}
```

### 2. Page with Breadcrumbs

```typescript
import { Breadcrumbs } from '@/components/breadcrumbs'

export default function YourPage() {
  const breadcrumbs = [
    { name: 'Section', url: '/section' },
    { name: 'Current Page', url: '/section/current' },
  ]

  return (
    <>
      <Breadcrumbs items={breadcrumbs} />
      <div>Your content</div>
    </>
  )
}
```

### 3. Page with Structured Data

```typescript
import { generateCollectionPageSchema, toJsonLd } from '@/lib/seo/schema'

export default function YourPage() {
  const schema = generateCollectionPageSchema(
    'Page Title',
    'Page description',
    'your-page-path'
  )

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(schema) }}
      />
      <div>Your content</div>
    </>
  )
}
```

## For Blog Posts

### Complete Blog Post SEO

```typescript
import { Metadata } from 'next'
import {
  getCanonicalUrl,
  getOpenGraphImage,
  generateMetaDescription
} from '@/lib/seo/utils'
import { generateBlogPostSchema, toJsonLd } from '@/lib/seo/schema'
import { Breadcrumbs } from '@/components/breadcrumbs'

export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getPost(params.slug)

  const description = generateMetaDescription(post.excerpt || post.content)
  const canonicalUrl = getCanonicalUrl(`blog/${post.slug}`)
  const ogImage = getOpenGraphImage(post.image)

  return {
    title: post.title,
    description,
    keywords: post.tags,
    authors: [{ name: post.author.name }],
    openGraph: {
      title: post.title,
      description,
      url: canonicalUrl,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author.name],
      tags: post.tags,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  }
}

export default async function BlogPost({ params }) {
  const post = await getPost(params.slug)
  const schema = generateBlogPostSchema(post)

  const breadcrumbs = [
    { name: 'Blog', url: '/blog' },
    { name: post.title, url: `/blog/${post.slug}` },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(schema) }}
      />

      <Breadcrumbs items={breadcrumbs} />

      <article>
        {/* Your blog post content */}
      </article>
    </>
  )
}
```

## Utility Functions Reference

### Text Utilities

```typescript
import {
  truncateText,
  generatePageTitle,
  generateMetaDescription
} from '@/lib/seo/utils'

// Truncate text with word boundaries
const short = truncateText('Long text here...', 100)

// Generate SEO-friendly title
const title = generatePageTitle('My Page', true) // "My Page | iTalkDevs"

// Generate meta description
const desc = generateMetaDescription('Your content here...') // Max 155 chars
```

### URL Utilities

```typescript
import { getCanonicalUrl, getOpenGraphImage, formatUrl } from '@/lib/seo/utils'

// Generate canonical URL
const canonical = getCanonicalUrl('blog/my-post')
// Returns: https://italkdevs.com/blog/my-post

// Get OG image URL
const ogImage = getOpenGraphImage('/images/post.jpg')
// Returns: https://italkdevs.com/images/post.jpg

// Format and validate URL
const url = formatUrl('/relative/path') // Makes absolute
```

### Content Utilities

```typescript
import {
  extractPlainText,
  generateExcerpt,
  calculateReadingTime
} from '@/lib/seo/utils'

// Extract plain text from markdown
const text = extractPlainText('# Heading\n\nSome **bold** text')
// Returns: "Heading Some bold text"

// Generate excerpt
const excerpt = generateExcerpt(content, 160)
// Returns first 160 chars as plain text

// Calculate reading time
const minutes = calculateReadingTime(content) // Returns number
```

### Breadcrumb Utilities

```typescript
import { generateBreadcrumbs } from '@/lib/seo/utils'

// Auto-generate breadcrumbs from path
const breadcrumbs = generateBreadcrumbs('/blog/category/post-title')
// Returns: [
//   { name: 'Blog', url: '/blog' },
//   { name: 'Category', url: '/blog/category' },
//   { name: 'Post Title', url: '/blog/category/post-title' }
// ]
```

## Schema.org Structured Data

### Available Schemas

```typescript
import {
  generateOrganizationSchema,
  generatePersonSchema,
  generateBlogPostSchema,
  generateProjectSchema,
  generateBreadcrumbSchema,
  generateWebSiteSchema,
  generateCollectionPageSchema,
  generateItemListSchema,
  generateFAQSchema,
  generateAboutPageSchema,
  combineSchemas,
  toJsonLd,
} from '@/lib/seo/schema'
```

### Organization Schema

```typescript
const orgSchema = generateOrganizationSchema()
// Returns organization info for site
```

### Person/Author Schema

```typescript
const personSchema = generatePersonSchema({
  name: 'Author Name',
  email: 'author@example.com',
  image: '/images/author.jpg',
})
```

### Blog Post Schema

```typescript
const blogSchema = generateBlogPostSchema(post)
// Includes: title, description, author, dates, keywords, etc.
```

### Project Schema

```typescript
const projectSchema = generateProjectSchema(project)
// SoftwareSourceCode schema with repo and live URLs
```

### Breadcrumb Schema

```typescript
const breadcrumbSchema = generateBreadcrumbSchema([
  { name: 'Home', url: '/' },
  { name: 'Blog', url: '/blog' },
])
```

### Collection Page Schema

```typescript
const collectionSchema = generateCollectionPageSchema(
  'Blog Posts',
  'Latest articles on software development',
  'blog'
)
```

### Combining Multiple Schemas

```typescript
const websiteSchema = generateWebSiteSchema()
const orgSchema = generateOrganizationSchema()

const combined = combineSchemas(websiteSchema, orgSchema)
// Creates a @graph with multiple schemas

// Convert to JSON-LD string
const jsonLd = toJsonLd(combined)

// Use in component
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: jsonLd }}
/>
```

## Common Patterns

### Dynamic Metadata for Dynamic Routes

```typescript
interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await getData(slug)

  return {
    title: data.title,
    description: generateMetaDescription(data.description),
    alternates: {
      canonical: getCanonicalUrl(`path/${slug}`),
    },
  }
}
```

### Complete Page Template

```typescript
import { Metadata } from 'next'
import { getCanonicalUrl } from '@/lib/seo/utils'
import { generateCollectionPageSchema, toJsonLd } from '@/lib/seo/schema'
import { Breadcrumbs } from '@/components/breadcrumbs'

export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description under 155 characters',
  openGraph: {
    title: 'Page Title',
    description: 'Page description',
    url: getCanonicalUrl('page-path'),
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Page Title',
    description: 'Page description',
  },
  alternates: {
    canonical: getCanonicalUrl('page-path'),
  },
}

export default function Page() {
  const schema = generateCollectionPageSchema(
    'Page Title',
    'Page description',
    'page-path'
  )

  const breadcrumbs = [
    { name: 'Page', url: '/page-path' }
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(schema) }}
      />

      <div className="container">
        <Breadcrumbs items={breadcrumbs} className="mb-8" />

        {/* Your page content */}
      </div>
    </>
  )
}
```

## Site Configuration

Update site config in `/src/lib/seo/utils.ts`:

```typescript
export const SITE_CONFIG = {
  name: 'iTalkDevs',
  title: 'iTalkDevs - Software Development Blog & Community',
  description: 'Your site description here',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://italkdevs.com',
  author: 'iTalkDevs Team',
  twitterHandle: '@italkdevs',
  locale: 'en_US',
  type: 'website',
}
```

## Best Practices

1. **Always use canonical URLs** for every page
2. **Keep titles under 60 characters** for optimal display
3. **Keep descriptions under 155 characters** to avoid truncation
4. **Use unique metadata** for each page (no duplicates)
5. **Include structured data** on all major content pages
6. **Add breadcrumbs** to improve navigation and SEO
7. **Use OpenGraph images** that are 1200x630px
8. **Set proper keywords** that match your content
9. **Update metadata** when content changes significantly
10. **Test with Google Rich Results Test** after updates

## Validation Tools

- **Rich Results Test**: https://search.google.com/test/rich-results
- **Schema Validator**: https://validator.schema.org/
- **OpenGraph Debugger**: https://www.opengraph.xyz/
- **Twitter Card Validator**: https://cards-dev.twitter.com/validator

## Troubleshooting

### Metadata not showing
- Check that metadata is exported from page/layout
- Verify metadataBase is set in root layout
- Clear browser cache and test

### Structured data errors
- Validate with Schema.org validator
- Check that required fields are present
- Ensure dates are in ISO format

### Sitemap not updating
- Rebuild the application
- Check that posts/projects are being fetched correctly
- Verify NEXT_PUBLIC_SITE_URL is set

### RSS feed issues
- Check XML formatting with RSS validator
- Ensure dates are properly formatted
- Verify content escaping is working

## Support

For issues or questions about SEO implementation:
1. Check the main SEO_IMPLEMENTATION.md documentation
2. Review Next.js metadata documentation
3. Test with validation tools listed above
4. Check Google Search Console for specific errors
