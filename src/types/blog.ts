export interface Author {
  name: string
  email: string
  image?: string
  uid?: string
  bio?: string
  credentials?: string
}

export interface SEOMetadata {
  metaTitle?: string
  metaDescription?: string
  focusKeyword?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  canonicalUrl?: string
  keywords?: string[]
  category?: string
  schemaType?: 'Article' | 'BlogPosting' | 'NewsArticle' | 'TechArticle'
}

export interface BlogPost {
  id: string
  title: string
  subtitle: string
  content: string
  excerpt?: string
  image?: string
  imageAlt?: string
  tags: string[]
  author: Author
  date: string
  slug: string
  published: boolean
  publishedAt?: string
  upvotes?: number
  readTime?: number
  // SEO Metadata
  seo?: SEOMetadata
}
