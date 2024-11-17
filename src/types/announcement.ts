export interface Announcement {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string | null
  isSticky: boolean
  status: 'active' | 'inactive'
  author: {
    name: string
    image?: string
    email: string
  }
}

export interface CreateAnnouncementData {
  title: string
  content: string
  isSticky: boolean
  status: 'active' | 'inactive'
  author: {
    name: string
    image?: string
    email: string
  }
}

export interface UpdateAnnouncementData {
  title?: string
  content?: string
  isSticky?: boolean
  status?: 'active' | 'inactive'
}
