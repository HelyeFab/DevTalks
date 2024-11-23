export interface UserProfile {
  id?: string
  email: string
  name: string
  photoURL?: string
  bio?: string
  isAdmin?: boolean
  socialLinks?: {
    twitter?: string
    github?: string
    linkedin?: string
  }
  createdAt?: string
  updatedAt?: string
}
