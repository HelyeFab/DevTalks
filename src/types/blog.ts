export interface Author {
  name: string
  email: string
  image?: string
  uid?: string
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
}
