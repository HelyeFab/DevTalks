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
