export type Project = {
  id?: string
  title: string
  slug: string
  description: string
  image: string
  technologies: string[]
  githubUrl?: string
  liveUrl?: string
  featured: boolean
  content: string
  subtitle?: string
  createdAt?: string
  updatedAt?: string
}
