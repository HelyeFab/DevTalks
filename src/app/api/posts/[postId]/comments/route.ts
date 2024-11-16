import { NextRequest, NextResponse } from 'next/server'
import { getCommentsByPostId, createComment } from '@/lib/comments'
import { CreateCommentData } from '@/types/comment'
import { getAuth } from '@/lib/firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'

export const dynamic = 'force-dynamic'

const DEFAULT_AVATAR = '/images/default-avatar.svg'

type RouteContext = {
  params: { postId: string }
}

export async function GET(request: NextRequest, context: RouteContext) {
  console.log('\n--- Starting comments fetch ---')
  try {
    const { params } = context
    const postId = params.postId
    console.log('Fetching comments for post:', { postId })

    // Verify Firestore connection
    try {
      const db = getFirestore()
      console.log('Got Firestore instance')

      const comments = await getCommentsByPostId(postId)
      console.log('Found comments:', { count: comments.length })
      return NextResponse.json(comments)
    } catch (error) {
      console.error('Error fetching comments:', error)
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        })
      }
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error processing request:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    console.log('--- Comments fetch completed ---\n')
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { params } = context
    const postId = params.postId
    console.log('\n--- Starting comment creation ---')
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

      console.log('Creating comment with token:', {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture
      })

      // Get request body
      const { content, parentId } = await request.json()
      console.log('Request body:', { 
        content: content?.substring(0, 20),
        parentId,
        contentLength: content?.length
      })
      
      if (!content?.trim()) {
        console.error('Empty comment content')
        return NextResponse.json(
          { error: 'Comment content is required' },
          { status: 400 }
        )
      }

      // Prepare comment data
      const commentData = {
        postId: params.postId,
        content: content.trim(),
        userId: decodedToken.uid,
        author: {
          name: decodedToken.name || 'Anonymous',
          image: decodedToken.picture || DEFAULT_AVATAR,
          email: decodedToken.email || ''
        }
      }

      console.log('Creating comment with data:', commentData)

      // Create the comment
      const comment = await createComment(
        commentData,
        decodedToken.uid,
        {
          name: decodedToken.name || 'Anonymous',
          image: decodedToken.picture || null,
          email: decodedToken.email || ''
        }
      )

      console.log('Comment created:', {
        id: comment.id,
        userId: comment.userId,
        author: comment.author,
        content: comment.content.substring(0, 20) + '...'
      })
      return NextResponse.json(comment)
    } catch (error) {
      console.error('Error in POST /api/posts/[postId]/comments:', error)
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        })
      }

      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: error instanceof Error ? 400 : 500 }
      )
    }
  } catch (error) {
    console.error('Error processing request:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    console.log('--- Comment creation request completed ---\n')
  }
}
