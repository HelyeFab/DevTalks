import { NextRequest, NextResponse } from 'next/server'
import { createComment } from '@/lib/comments'
import { CreateCommentData } from '@/types/comment'
import { withAuth, createErrorResponse } from '@/lib/auth-middleware'
import { validateRequestBody, commentSchema } from '@/lib/validation'

export const dynamic = 'force-dynamic'

const DEFAULT_AVATAR = '/images/default-avatar.svg'

type RouteContext = {
  params: Promise<{ postId: string; commentId: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  console.log('\n--- Starting reply creation ---')
  const resolvedParams = await context.params;
  const { postId, commentId } = resolvedParams;

  return withAuth(request, async (authContext) => {
    try {
      console.log('Creating reply for comment:', { postId, commentId })
      console.log('Authenticated user:', {
        uid: authContext.userId,
        email: authContext.email,
        name: authContext.name
      })

      // Validate request body against schema
      const validationResult = await validateRequestBody(request, commentSchema);
      if (!validationResult.success) {
        return 'error' in validationResult ? validationResult.error : NextResponse.json({ error: 'Validation failed' }, { status: 400 });
      }

      const data = validationResult.data;
      console.log('Request body:', {
        content: data.content?.substring(0, 50),
        postId,
        parentId: commentId
      })

      // Create the reply
      console.log('Creating reply...')
      const newReply = await createComment(
        authContext.userId,
        {
          name: data.author.name || '',
          email: data.author.email || '',
          image: data.author.image || DEFAULT_AVATAR
        },
        {
          content: data.content || '',
          postId,
          parentId: commentId,
          author: {
            name: data.author.name || '',
            email: data.author.email || '',
            image: data.author.image || DEFAULT_AVATAR
          }
        }
      )
      console.log('Reply created successfully')

      return NextResponse.json(newReply)
    } catch (error) {
      console.error('Error in POST /api/posts/[postId]/comments/[commentId]/replies:', error instanceof Error ? error.message : 'Unknown error')
      return createErrorResponse(error instanceof Error ? error.message : 'Failed to create reply')
    }
  })
}
