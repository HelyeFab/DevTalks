import { NextRequest, NextResponse } from 'next/server'
import { getCommentsByPostId, createComment } from '@/lib/comments'
import { CreateCommentData } from '@/types/comment'
import { initAdmin } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

const DEFAULT_AVATAR = '/images/default-avatar.svg'
const { auth } = initAdmin()

type RouteContext = {
  params: { postId: string }
}

export async function GET(request: NextRequest, context: RouteContext) {
  console.log('\n--- Starting comments fetch ---')
  const postId = context.params.postId

  try {
    console.log('Fetching comments for post:', { postId })
    const comments = await getCommentsByPostId(postId)
    console.log('Found comments:', { count: comments.length })
    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error in GET /api/posts/[postId]/comments:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to fetch comments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  console.log('\n--- Starting comment creation ---')
  const postId = context.params.postId

  try {
    console.log('Creating comment for post:', { postId })

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
        postId: data.postId,
        parentId: data.parentId
      })

      // Create the comment
      console.log('Creating comment...')
      const newComment = await createComment(
        decodedToken.uid,
        {
          name: data.author.name,
          email: data.author.email,
          image: data.author.image || DEFAULT_AVATAR
        },
        {
          ...data,
          postId // Use the postId from params
        }
      )
      console.log('Comment created successfully')

      return NextResponse.json(newComment)
    } catch (error) {
      console.error('Error verifying token:', error instanceof Error ? error.message : 'Unknown error')
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid authorization token' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Error in POST /api/posts/[postId]/comments:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
