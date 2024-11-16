import { NextRequest, NextResponse } from 'next/server'
import { updateComment, deleteComment } from '@/lib/comments'
import { getAuth } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: { commentId: string }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  console.log('\n--- Starting comment update ---')
  try {
    const { params } = context
    const commentId = params.commentId
    console.log('Updating comment:', { commentId })

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
      const { content } = await request.json()
      console.log('Request body:', { 
        content: content?.substring(0, 20),
        contentLength: content?.length
      })
      
      if (!content?.trim()) {
        console.error('Empty comment content')
        return NextResponse.json(
          { error: 'Comment content is required' },
          { status: 400 }
        )
      }

      // Update the comment
      await updateComment(commentId, decodedToken.uid, { content: content.trim() })

      console.log('Comment updated successfully:', { 
        commentId,
        userId: decodedToken.uid
      })
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Error updating comment:', error)
      
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        })

        if (error.message === 'Comment not found') {
          return NextResponse.json(
            { error: 'Comment not found' },
            { status: 404 }
          )
        }

        if (error.message === 'Not authorized to update this comment') {
          return NextResponse.json(
            { error: 'Not authorized to update this comment' },
            { status: 403 }
          )
        }
      }

      return NextResponse.json(
        { error: 'Failed to update comment' },
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
    console.log('--- Comment update completed ---\n')
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  console.log('\n--- Starting comment deletion ---')
  try {
    const { params } = context
    const commentId = params.commentId
    console.log('Deleting comment:', { commentId })

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

      // Delete the comment
      await deleteComment(commentId, decodedToken.uid)

      console.log('Comment deleted successfully:', { 
        commentId,
        userId: decodedToken.uid
      })
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Error deleting comment:', error)
      
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        })

        if (error.message === 'Comment not found') {
          return NextResponse.json(
            { error: 'Comment not found' },
            { status: 404 }
          )
        }

        if (error.message === 'Not authorized to delete this comment') {
          return NextResponse.json(
            { error: 'Not authorized to delete this comment' },
            { status: 403 }
          )
        }
      }

      return NextResponse.json(
        { error: 'Failed to delete comment' },
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
    console.log('--- Comment deletion completed ---\n')
  }
}
