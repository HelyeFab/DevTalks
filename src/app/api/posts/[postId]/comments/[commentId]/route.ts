import { NextRequest, NextResponse } from 'next/server'
import { deleteComment, updateComment } from '@/lib/comments'
import { UpdateCommentData } from '@/types/comment'
import { withAuth, createErrorResponse } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: { postId: string; commentId: string }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  console.log('\n--- Starting comment deletion ---')
  const resolvedParams = await context.params;
  const { postId, commentId } = resolvedParams;

  return withAuth(request, async (authContext) => {
    try {
      console.log('Deleting comment:', { postId, commentId })
      console.log('Authenticated user:', {
        uid: authContext.userId,
        email: authContext.email,
        name: authContext.name,
        isAdmin: authContext.isAdmin
      })

      // Delete the comment
      console.log('Deleting comment...')
      const success = await deleteComment(commentId, authContext.userId, authContext.isAdmin, postId)

      if (!success) {
        return NextResponse.json(
          { error: 'Not authorized to delete this comment' },
          { status: 403 }
        )
      }

      console.log('Comment deleted successfully')
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Error in DELETE /api/posts/[postId]/comments/[commentId]:', error instanceof Error ? error.message : 'Unknown error')
      return createErrorResponse(error instanceof Error ? error.message : 'Failed to delete comment')
    }
  })
}

export async function PUT(request: NextRequest, context: RouteContext) {
  console.log('\n--- Starting comment update ---')
  const resolvedParams = await context.params;
  const { postId, commentId } = resolvedParams;

  return withAuth(request, async (authContext) => {
    try {
      console.log('Updating comment:', { postId, commentId })
      console.log('Authenticated user:', {
        uid: authContext.userId,
        email: authContext.email,
        name: authContext.name
      })

      // Get request body
      const data = await request.json() as UpdateCommentData
      console.log('Request body:', {
        content: data.content?.substring(0, 50),
        postId
      })

      // Update the comment
      console.log('Updating comment...')
      await updateComment(commentId, authContext.userId, {
        ...data,
        postId
      })
      console.log('Comment updated successfully')

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Error in PUT /api/posts/[postId]/comments/[commentId]:', error instanceof Error ? error.message : 'Unknown error')
      return createErrorResponse(error instanceof Error ? error.message : 'Failed to update comment')
    }
  })
}
