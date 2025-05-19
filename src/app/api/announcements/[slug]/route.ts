import { NextRequest, NextResponse } from 'next/server'
import { getAnnouncement, Announcement } from '@/lib/announcements'
import { getAuth } from '@/lib/firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'

// Define UpdateAnnouncementData interface
interface UpdateAnnouncementData extends Partial<Announcement> {}

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const resolvedParams = await params;
  if (!resolvedParams.slug || typeof resolvedParams.slug !== 'string' || resolvedParams.slug === 'undefined') {
    return NextResponse.json(
      { error: 'Invalid announcement URL' },
      { status: 400 }
    )
  }

  try {
    const announcement = await getAnnouncement(resolvedParams.slug)

    if (!announcement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(announcement)
  } catch (error) {
    console.error('Error fetching announcement:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { slug: string } }) {
  console.log('\n--- Updating announcement ---')
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  try {
    console.log('Updating announcement:', { slug })

    // Get authorization header
    const authHeader = request.headers.get('Authorization')
    console.log('Auth header present:', !!authHeader)

    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header missing' },
        { status: 401 }
      )
    }

    // Verify the token
    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await getAuth().verifyIdToken(token)
    console.log('Token verified for user:', decodedToken.uid)

    // Get the user's profile to check if they're an admin
    const db = getFirestore()
    const profileRef = db.collection('profiles').doc(decodedToken.uid)
    const profileSnap = await profileRef.get()

    if (!profileSnap.exists) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const isAdmin = profileSnap.data()?.isAdmin
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get announcement by ID
    if (!slug) {
      return NextResponse.json(
        { error: 'Invalid announcement ID' },
        { status: 400 }
      )
    }

    // TypeScript won't detect the early return above, so we need an explicit non-null assertion
    const announcement = await getAnnouncement(slug!)

    if (!announcement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      )
    }

    // Get the update data from the request body
    const updateData: UpdateAnnouncementData = await request.json()
    console.log('Update data:', updateData)

    // Update the announcement
    const announcementRef = db.collection('announcements').doc(announcement.id)
    await announcementRef.update({
      ...updateData,
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating announcement:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { slug: string } }) {
  console.log('\n--- Deleting announcement ---')
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  try {
    // Get authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header missing' },
        { status: 401 }
      )
    }

    // Verify the token
    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await getAuth().verifyIdToken(token)

    // Get the user's profile to check if they're an admin
    const db = getFirestore()
    const profileRef = db.collection('profiles').doc(decodedToken.uid)
    const profileSnap = await profileRef.get()

    if (!profileSnap.exists) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const isAdmin = profileSnap.data()?.isAdmin
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get announcement by ID
    if (!slug) {
      return NextResponse.json(
        { error: 'Invalid announcement ID' },
        { status: 400 }
      )
    }

    // TypeScript won't detect the early return above, so we need an explicit non-null assertion
    const announcement = await getAnnouncement(slug!)

    if (!announcement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      )
    }

    // Delete the announcement
    const announcementRef = db.collection('announcements').doc(announcement.id)
    await announcementRef.delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting announcement:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle other HTTP methods
export async function POST() {
  return methodNotAllowed()
}

export async function PATCH() {
  return methodNotAllowed()
}

export async function HEAD() {
  return methodNotAllowed()
}

export async function OPTIONS() {
  return methodNotAllowed()
}

function methodNotAllowed() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
