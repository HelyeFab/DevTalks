export interface Comment {
  id: string
  content: string
  postId: string
  userId: string
  parentId?: string
  author: {
    name: string
    image: string
  }
  createdAt: string
  updatedAt: string
  replies?: Comment[]
}

export interface CreateCommentData {
  content: string
  postId: string
  parentId?: string
}

export interface UpdateCommentData {
  content: string
}

export interface CommentWithReplies extends Comment {
  replies: Comment[]
}
