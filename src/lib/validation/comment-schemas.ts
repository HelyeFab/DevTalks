import { z } from 'zod'

// Comment content validation
export const commentContentSchema = z
  .string()
  .min(1, 'Comment cannot be empty')
  .max(5000, 'Comment cannot exceed 5000 characters')
  .trim()

// Create comment schema
export const createCommentSchema = z.object({
  content: commentContentSchema,
  postId: z.string().min(1, 'Post ID is required'),
  parentId: z.string().optional(),
  author: z.object({
    name: z.string().min(1, 'Author name is required'),
    email: z.string().email('Valid email is required'),
    image: z.string().url().optional().or(z.literal(''))
  })
})

// Update comment schema
export const updateCommentSchema = z.object({
  content: commentContentSchema,
  postId: z.string().min(1, 'Post ID is required')
})

// Report comment schema
export const reportCommentSchema = z.object({
  commentId: z.string().min(1, 'Comment ID is required'),
  reason: z
    .string()
    .min(10, 'Please provide a detailed reason (at least 10 characters)')
    .max(500, 'Reason cannot exceed 500 characters'),
  reportedBy: z.string().min(1, 'Reporter ID is required'),
  reportedByEmail: z.string().email('Valid email is required')
})

// React to comment schema
export const reactToCommentSchema = z.object({
  commentId: z.string().min(1, 'Comment ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  type: z.literal('like')
})

// Comment sort option schema
export const commentSortSchema = z.enum(['newest', 'oldest', 'most-liked'])

// Helper type exports
export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>
export type ReportCommentInput = z.infer<typeof reportCommentSchema>
export type ReactToCommentInput = z.infer<typeof reactToCommentSchema>
export type CommentSortInput = z.infer<typeof commentSortSchema>
