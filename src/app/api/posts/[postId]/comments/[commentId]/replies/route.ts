import { NextRequest, NextResponse } from 'next/server'
import { createComment } from '@/lib/comments'
import { CreateCommentData } from '@/types/comment'
import { getAuth } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

const DEFAULT_AVATAR = '/images/default-avatar.svg'

type RouteContext = {
  params: { postId: string; commentId: string }
}

export async function POST(request: NextRequest, context: RouteContext) {
  console.log('\n--- Starting reply creation ---')
  const { postId, commentId } = context.params

  try {
    console.log('Creating reply for comment:', { postId, commentId })

    // Get authorization header
    const authHeader = request.headers.get('Authorization')
    console.log('Auth header present:', !!authHeader)
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Invalid auth header format:', authHeader?.substring(0, 20))
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    // Verify the token
    const token = authHeader.split('Bearer ')[1]
    console.log('Token to verify:', token.substring(0, 20) + '...')
    
    try {
      // Get Firebase Admin auth instance
      console.log('Getting Firebase Admin auth instance...')
      const auth = getAuth()
      console.log('Got Firebase Admin auth instance')

      // Verify the token
      console.log('Verifying token...')
      const decodedToken = await auth.verifyIdToken(token)
      console.log('Token verified successfully for user:', {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name
      })

      // Get request body
      const data = await request.json() as CreateCommentData
      console.log('Request body:', { 
        content: data.content?.substring(0, 50),
        postId,
        parentId: commentId
      })

      // Create the reply
      console.log('Creating reply...')
      const newReply = await createComment(
        decodedToken.uid,
        {
          name: data.author.name,
          email: data.author.email,
          image: data.author.image || DEFAULT_AVATAR
        },
        {
          ...data,
          postId,
          parentId: commentId
        }
      )
      console.log('Reply created successfully')

      return NextResponse.json(newReply)
    } catch (error) {
      console.error('Error verifying token:', error instanceof Error ? error.message : 'Unknown error')
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid authorization token' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Error in POST /api/posts/[postId]/comments/[commentId]/replies:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
