import { NextRequest, NextResponse } from 'next/server'
import { getAnnouncement, Announcement } from '@/lib/announcements'
import { withAuth, createErrorResponse } from '@/lib/auth-middleware'
import { initAdmin } from '@/lib/firebase-admin'

// Define UpdateAnnouncementData interface
interface UpdateAnnouncementData extends Partial<Announcement> {}

export const dynamic = 'force-dynamic'

const { db } = initAdmin()

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
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
    return createErrorResponse('Failed to fetch announcement')
  }
}

/**
 * Helper function to get an announcement by slug from params
 */
async function getAnnouncementBySlugParam(slug: string | undefined): Promise<Announcement | null> {
  if (!slug || typeof slug !== 'string') {
    return null;
  }

  // Using non-null assertion (!) since we've already checked that slug is a string
  return await getAnnouncement(slug!);
}

// Utility function to assert string type
function assertString(value: string | undefined): asserts value is string {
  if (typeof value !== 'string' || !value) {
    throw new Error('Value must be a string');
  }
}

// TypeScript-friendly announcement retriever
async function getAnnouncementById(id: string): Promise<Announcement | null> {
  try {
    return await getAnnouncement(id);
  } catch (error) {
    console.error("Error retrieving announcement:", error);
    return null;
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  console.log('\n--- Updating announcement ---')
  const resolvedParams = await params;

  // Early validation and conversion to string
  if (!resolvedParams.slug || typeof resolvedParams.slug !== 'string') {
    return NextResponse.json(
      { error: 'Invalid announcement ID' },
      { status: 400 }
    )
  }

  // Explicitly create a string variable
  const slug: string = resolvedParams.slug;

  // Require admin privileges for this route
  return withAuth(request, async (authContext) => {
    try {
      console.log('Updating announcement:', { slug })
      console.log('Authenticated user:', {
        uid: authContext.userId,
        email: authContext.email,
        isAdmin: authContext.isAdmin
      })

      // Check if user is admin
      if (!authContext.isAdmin) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        )
      }

      // Using our TypeScript-friendly function with the string variable
      const announcement = await getAnnouncementById(slug)

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
      return createErrorResponse(error instanceof Error ? error.message : 'Failed to update announcement')
    }
  }, true) // requireAdmin=true
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  console.log('\n--- Deleting announcement ---')
  const resolvedParams = await params;

  // Early validation and conversion to string
  if (!resolvedParams.slug || typeof resolvedParams.slug !== 'string') {
    return NextResponse.json(
      { error: 'Invalid announcement ID' },
      { status: 400 }
    )
  }

  // Explicitly create a string variable
  const slug: string = resolvedParams.slug;

  // Require admin privileges for this route
  return withAuth(request, async (authContext) => {
    try {
      console.log('Deleting announcement:', { slug })
      console.log('Authenticated user:', {
        uid: authContext.userId,
        email: authContext.email,
        isAdmin: authContext.isAdmin
      })

      // Check if user is admin
      if (!authContext.isAdmin) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        )
      }

      // Using our TypeScript-friendly function with the string variable
      const announcement = await getAnnouncementById(slug)

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
      return createErrorResponse(error instanceof Error ? error.message : 'Failed to delete announcement')
    }
  }, true) // requireAdmin=true
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
