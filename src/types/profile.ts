export interface UserProfile {
  bio?: string
  socialLinks?: {
    twitter?: string
    github?: string
    linkedin?: string
  }
  createdAt: string
  updatedAt: string
}
