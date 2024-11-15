export interface Author {
  name: string
  image: string
}

export type BlogPost = {
  id: string
  title: string
  slug: string
  date: string
  content: string
  excerpt: string
  published: boolean
  image?: string
  author: Author
  tags: string[]
  upvotes: number
}
