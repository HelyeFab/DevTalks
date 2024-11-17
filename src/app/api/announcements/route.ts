import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'
import { CreateAnnouncementData } from '@/types/announcement'

export const dynamic = 'force-dynamic'

export async function GET() {
  console.log('\n--- Fetching announcements ---')

  try {
    // Get Firestore instance
    console.log('Getting Firestore instance...')
    const db = getFirestore()
    console.log('Got Firestore instance')

    // Get announcements
    console.log('Fetching announcements from Firestore...')
    const announcementsRef = db.collection('announcements')
    const snapshot = await announcementsRef.orderBy('createdAt', 'desc').get()
    console.log('Found', snapshot.size, 'announcements')

    // Convert to array
    const announcements = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null
    }))

    return NextResponse.json(announcements)
  } catch (error) {
    console.error('Error in GET /api/announcements:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  console.log('\n--- Creating announcement ---')

  try {
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
          { error: 'Not authorized to create announcements' },
          { status: 403 }
        )
      }

      // Get request body
      const data = await request.json() as CreateAnnouncementData
      console.log('Request body:', { 
        title: data.title,
        content: data.content?.substring(0, 50),
        isSticky: data.isSticky
      })

      // Create the announcement
      console.log('Creating announcement...')
      const announcementRef = await db.collection('announcements').add({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      console.log('Announcement created successfully')

      // Get the created announcement
      const announcementDoc = await announcementRef.get()
      const announcement = {
        id: announcementDoc.id,
        ...announcementDoc.data(),
        createdAt: announcementDoc.data()?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: announcementDoc.data()?.updatedAt?.toDate?.()?.toISOString() || null
      }

      return NextResponse.json(announcement)
    } catch (error) {
      console.error('Error verifying token:', error instanceof Error ? error.message : 'Unknown error')
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid authorization token' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Error in POST /api/announcements:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
