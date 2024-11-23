import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { CreateAnnouncementData } from '@/types/announcement'
import { initAdmin } from '@/lib/firebase-admin'

const ADMIN_EMAIL = 'emmanuelfabiani23@gmail.com'

// Initialize Firebase Admin
const { db } = initAdmin()

// Helper function to check if user is admin
async function isAdmin(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('No Bearer token found')
      return false
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await getAuth().verifyIdToken(token)
    console.log('Decoded token email:', decodedToken.email)
    return decodedToken.email === ADMIN_EMAIL
  } catch (error) {
    console.error('Error verifying admin status:', error)
    return false
  }
}

export const dynamic = 'force-dynamic'

export async function GET() {
  console.log('Fetching announcements')
  try {
    const snapshot = await db.collection('announcements')
      .orderBy('createdAt', 'desc')
      .get()
    
    const announcements = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt || new Date().toISOString(),
      updatedAt: doc.data().updatedAt || null
    }))

    return NextResponse.json(announcements)
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check admin status
    if (!await isAdmin(req)) {
      console.log('Unauthorized attempt to create announcement')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const data = await req.json() as CreateAnnouncementData
    
    // Create announcement
    const now = new Date().toISOString()
    const announcementData = {
      ...data,
      createdAt: now,
      updatedAt: null,
    }

    const docRef = await db.collection('announcements').add(announcementData)

    return NextResponse.json({
      id: docRef.id,
      ...announcementData
    })
  } catch (error) {
    console.error('Error creating announcement:', error)
    return NextResponse.json(
      { error: 'Failed to create announcement' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Check admin status
    if (!await isAdmin(req)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id, ...data } = await req.json()
    if (!id) {
      return NextResponse.json(
        { error: 'Announcement ID is required' },
        { status: 400 }
      )
    }

    const docRef = db.collection('announcements').doc(id)
    await docRef.update({
      ...data,
      updatedAt: new Date().toISOString()
    })

    return NextResponse.json({
      id,
      ...data,
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error updating announcement:', error)
    return NextResponse.json(
      { error: 'Failed to update announcement' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Check admin status
    if (!await isAdmin(req)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Announcement ID is required' },
        { status: 400 }
      )
    }

    const docRef = db.collection('announcements').doc(id)
    await docRef.delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting announcement:', error)
    return NextResponse.json(
      { error: 'Failed to delete announcement' },
      { status: 500 }
    )
  }
}
