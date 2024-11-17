import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'
import { UpdateAnnouncementData } from '@/types/announcement'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: { id: string }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  console.log('\n--- Updating announcement ---')
  const { id } = context.params

  try {
    console.log('Updating announcement:', { id })

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

      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Not authorized to update announcements' },
          { status: 403 }
        )
      }

      // Get request body
      const data = await request.json() as UpdateAnnouncementData
      console.log('Request body:', data)

      // Update the announcement
      console.log('Updating announcement...')
      await db.collection('announcements').doc(id).update({
        ...data,
        updatedAt: new Date()
      })
      console.log('Announcement updated successfully')

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Error verifying token:', error instanceof Error ? error.message : 'Unknown error')
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid authorization token' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Error in PUT /api/announcements/[id]:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  console.log('\n--- Deleting announcement ---')
  const { id } = context.params

  try {
    console.log('Deleting announcement:', { id })

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

      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Not authorized to delete announcements' },
          { status: 403 }
        )
      }

      // Delete the announcement
      console.log('Deleting announcement...')
      await db.collection('announcements').doc(id).delete()
      console.log('Announcement deleted successfully')

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Error verifying token:', error instanceof Error ? error.message : 'Unknown error')
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid authorization token' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Error in DELETE /api/announcements/[id]:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
