export type Project = {
  title: string
  slug: string
  description: string
  image: string
  technologies: string[]
  githubUrl?: string
  liveUrl?: string
  featured: boolean
  details: {
    challenge: string
    solution: string
    impact: string
    features: string[]
  }
}
