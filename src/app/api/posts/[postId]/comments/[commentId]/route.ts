import { NextRequest, NextResponse } from 'next/server'
import { deleteComment, updateComment } from '@/lib/comments'
import { UpdateCommentData } from '@/types/comment'
import { getAuth } from '@/lib/firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: { postId: string; commentId: string }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  console.log('\n--- Starting comment deletion ---')
  const { postId, commentId } = context.params

  try {
    console.log('Deleting comment:', { postId, commentId })

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

      // Check if user is admin
      const db = getFirestore()
      const adminDoc = await db.collection('env').doc('admin').get()
      const isAdmin = decodedToken.email === adminDoc.data()?.adminEmail

      // Delete the comment
      console.log('Deleting comment...')
      const success = await deleteComment(commentId, decodedToken.uid, isAdmin, postId)
      
      if (!success) {
        return NextResponse.json(
          { error: 'Not authorized to delete this comment' },
          { status: 403 }
        )
      }

      console.log('Comment deleted successfully')
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Error verifying token:', error instanceof Error ? error.message : 'Unknown error')
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid authorization token' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Error in DELETE /api/posts/[postId]/comments/[commentId]:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  console.log('\n--- Starting comment update ---')
  const { postId, commentId } = context.params

  try {
    console.log('Updating comment:', { postId, commentId })

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
      const data = await request.json() as UpdateCommentData
      console.log('Request body:', { 
        content: data.content?.substring(0, 50),
        postId
      })

      // Update the comment
      console.log('Updating comment...')
      await updateComment(commentId, decodedToken.uid, {
        ...data,
        postId
      })
      console.log('Comment updated successfully')

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Error verifying token:', error instanceof Error ? error.message : 'Unknown error')
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid authorization token' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Error in PUT /api/posts/[postId]/comments/[commentId]:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
