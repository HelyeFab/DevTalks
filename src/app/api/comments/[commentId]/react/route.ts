import { NextRequest, NextResponse } from 'next/server'
import { toggleCommentReaction } from '@/lib/comments'
import { getAuth } from '@/lib/firebase-admin'
import { reactToCommentSchema } from '@/lib/validation/comment-schemas'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ commentId: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  console.log('\n--- Starting comment reaction toggle ---')
  try {
    const params = await context.params
    const commentId = params.commentId
    console.log('Toggle reaction for comment:', { commentId })

    // Get authorization header
    const authHeader = request.headers.get('Authorization')
    console.log('Auth header present:', !!authHeader)

    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Invalid auth header format')
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    // Verify the token
    const token = authHeader.split('Bearer ')[1]

    try {
      // Get Firebase Admin auth instance
      console.log('Getting Firebase Admin auth instance...')
      const auth = getAuth()

      // Verify the token
      console.log('Verifying token...')
      const decodedToken = await auth.verifyIdToken(token)
      console.log('Token verified successfully for user:', {
        uid: decodedToken.uid,
        email: decodedToken.email
      })

      // Validate input
      const validation = reactToCommentSchema.safeParse({
        commentId,
        userId: decodedToken.uid,
        type: 'like'
      })

      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: validation.error.errors },
          { status: 400 }
        )
      }

      // Toggle the reaction
      console.log('Toggling reaction...')
      const result = await toggleCommentReaction(commentId, decodedToken.uid)
      console.log('Reaction toggled:', result)

      return NextResponse.json(result)
    } catch (error) {
      console.error('Error verifying token:', error)
      return NextResponse.json(
        { error: 'Invalid authorization token' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Error in POST /api/comments/[commentId]/react:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
