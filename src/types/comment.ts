export interface Comment {
  id: string
  content: string
  postId: string
  userId: string
  parentId?: string
  author: {
    name: string
    image?: string
    email: string
  }
  createdAt: string
  updatedAt: string | null
  replies?: Comment[]

  // Enhanced fields
  reactions?: {
    likes: string[] // Array of user IDs who liked the comment
  }
  reports?: CommentReport[]
  isReported?: boolean
  status?: 'active' | 'flagged' | 'hidden' | 'deleted'
  editHistory?: CommentEdit[]
}

export interface CommentReport {
  id?: string
  reportedBy: string
  reportedByEmail: string
  reason: string
  createdAt: string
  status: 'pending' | 'reviewed' | 'dismissed'
  reviewedBy?: string
  reviewedAt?: string
}

export interface CommentEdit {
  content: string
  editedAt: string
  editedBy: string
}

export interface CreateCommentData {
  content: string
  postId: string
  parentId?: string
  author: {
    name: string
    image?: string
    email: string
  }
}

export interface UpdateCommentData {
  content: string
  postId: string
}

export interface CommentWithReplies extends Comment {
  replies: Comment[]
}

export type CommentSortOption = 'newest' | 'oldest' | 'most-liked'

export interface CommentReaction {
  commentId: string
  userId: string
  type: 'like'
  createdAt: string
}

export interface ReportCommentData {
  commentId: string
  reason: string
  reportedBy: string
  reportedByEmail: string
}
