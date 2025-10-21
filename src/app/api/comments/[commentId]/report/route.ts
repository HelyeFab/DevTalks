import { NextRequest, NextResponse } from 'next/server'
import { reportComment } from '@/lib/comments'
import { getAuth } from '@/lib/firebase-admin'
import { reportCommentSchema } from '@/lib/validation/comment-schemas'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ commentId: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  console.log('\n--- Starting comment report ---')
  try {
    const params = await context.params
    const commentId = params.commentId
    console.log('Report comment:', { commentId })

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

      // Get request body
      const body = await request.json()
      const { reason } = body

      // Validate input
      const validation = reportCommentSchema.safeParse({
        commentId,
        reason,
        reportedBy: decodedToken.uid,
        reportedByEmail: decodedToken.email || ''
      })

      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: validation.error.errors },
          { status: 400 }
        )
      }

      // Create the report
      console.log('Creating report...')
      const result = await reportComment({
        commentId,
        reason,
        reportedBy: decodedToken.uid,
        reportedByEmail: decodedToken.email || ''
      })
      console.log('Report created:', result)

      return NextResponse.json(result)
    } catch (error) {
      console.error('Error verifying token:', error)
      return NextResponse.json(
        { error: 'Invalid authorization token' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Error in POST /api/comments/[commentId]/report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
