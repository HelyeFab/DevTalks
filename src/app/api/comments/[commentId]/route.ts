import { NextRequest, NextResponse } from 'next/server'
import { updateComment, deleteComment } from '@/lib/comments'
import { getAuth } from '@/lib/firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: { commentId: string }
}

async function isAdmin(uid: string): Promise<boolean> {
  try {
    const db = getFirestore()
    const profileRef = db.collection('profiles').doc(uid)
    const profile = await profileRef.get()
    return profile.exists && profile.data()?.isAdmin === true
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
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
      console.log('Request body:', { content: content?.substring(0, 50) })

      // Update the comment
      console.log('Updating comment...')
      const updatedComment = await updateComment(commentId, content, decodedToken.uid)
      console.log('Comment updated successfully')

      return NextResponse.json(updatedComment)
    } catch (error) {
      console.error('Error verifying token:', error)
      return NextResponse.json(
        { error: 'Invalid authorization token' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Error in PUT /api/comments/[commentId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
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

      // Check if user is admin
      const userIsAdmin = await isAdmin(decodedToken.uid)
      console.log('User admin status:', { isAdmin: userIsAdmin })

      // Delete the comment
      console.log('Deleting comment...')
      const success = await deleteComment(commentId, decodedToken.uid, userIsAdmin)
      console.log('Comment deletion result:', { success })

      if (!success) {
        return NextResponse.json(
          { error: 'Not authorized to delete this comment' },
          { status: 403 }
        )
      }

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Error verifying token:', error)
      return NextResponse.json(
        { error: 'Invalid authorization token' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Error in DELETE /api/comments/[commentId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
