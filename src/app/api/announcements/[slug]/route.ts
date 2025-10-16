import { NextRequest, NextResponse } from 'next/server'
import { getAnnouncement, Announcement } from '@/lib/announcements'
import { initAdmin } from '@/lib/firebase-admin'
import {
  withAdminAuth,
  createApiError,
  withRateLimit,
  RateLimitPresets,
  type AuthContext
} from '@/lib/auth'

// Define UpdateAnnouncementData interface
interface UpdateAnnouncementData extends Partial<Announcement> {}

export const dynamic = 'force-dynamic'

const { db } = initAdmin()

// Apply rate limiting to GET requests
export const GET = withRateLimit(
  async (
    _request: Request,
    context: { params: Promise<{ slug: string }> }
  ) => {
    const resolvedParams = await context.params;
    if (!resolvedParams.slug || typeof resolvedParams.slug !== 'string' || resolvedParams.slug === 'undefined') {
      return createApiError('Invalid announcement URL', 400)
    }

    try {
      const announcement = await getAnnouncement(resolvedParams.slug)

      if (!announcement) {
        return createApiError('Announcement not found', 404)
      }

      return NextResponse.json(announcement)
    } catch (error) {
      console.error('Error fetching announcement:', error)
      return createApiError('Failed to fetch announcement', 500)
    }
  },
  RateLimitPresets.generous
)

/**
 * Helper function to get an announcement by slug from params
 */

// Utility function to assert string type

// TypeScript-friendly announcement retriever
async function getAnnouncementById(id: string): Promise<Announcement | null> {
  try {
    return await getAnnouncement(id);
  } catch (error) {
    console.error("Error retrieving announcement:", error);
    return null;
  }
}

// Admin-only PUT with rate limiting
export const PUT = withRateLimit(
  withAdminAuth(
    async (
      request: NextRequest,
      context: { params: Promise<{ slug: string }> },
      authContext: AuthContext
    ) => {
      console.log('\n--- Updating announcement ---')
      const resolvedParams = await context.params;

      // Early validation and conversion to string
      if (!resolvedParams.slug || typeof resolvedParams.slug !== 'string') {
        return createApiError('Invalid announcement ID', 400)
      }

      const slug: string = resolvedParams.slug;

      try {
        console.log('Updating announcement:', { slug, userId: authContext.user.uid })

        // Using our TypeScript-friendly function with the string variable
        const announcement = await getAnnouncementById(slug)

        if (!announcement) {
          return createApiError('Announcement not found', 404)
        }

        // Get the update data from the request body
        const updateData: UpdateAnnouncementData = await request.json()
        console.log('Update data:', updateData)

        // Update the announcement
        if (!announcement.id) {
          return createApiError('Invalid announcement ID', 400)
        }
        const announcementRef = db.collection('announcements').doc(announcement.id)
        await announcementRef.update({
          ...updateData,
          updatedAt: new Date(),
        })

        return NextResponse.json({ success: true })
      } catch (error) {
        console.error('Error updating announcement:', error)
        return createApiError(
          error instanceof Error ? error.message : 'Failed to update announcement',
          500
        )
      }
    }
  ),
  RateLimitPresets.moderate
)

// Admin-only DELETE with rate limiting
export const DELETE = withRateLimit(
  withAdminAuth(
    async (
      request: NextRequest,
      context: { params: Promise<{ slug: string }> },
      authContext: AuthContext
    ) => {
      console.log('\n--- Deleting announcement ---')
      const resolvedParams = await context.params;

      // Early validation and conversion to string
      if (!resolvedParams.slug || typeof resolvedParams.slug !== 'string') {
        return createApiError('Invalid announcement ID', 400)
      }

      const slug: string = resolvedParams.slug;

      try {
        console.log('Deleting announcement:', { slug, userId: authContext.user.uid })

        // Using our TypeScript-friendly function with the string variable
        const announcement = await getAnnouncementById(slug)

        if (!announcement) {
          return createApiError('Announcement not found', 404)
        }

        // Delete the announcement
        if (!announcement.id) {
          return createApiError('Invalid announcement ID', 400)
        }
        const announcementRef = db.collection('announcements').doc(announcement.id)
        await announcementRef.delete()

        return NextResponse.json({ success: true })
      } catch (error) {
        console.error('Error deleting announcement:', error)
        return createApiError(
          error instanceof Error ? error.message : 'Failed to delete announcement',
          500
        )
      }
    }
  ),
  RateLimitPresets.moderate
)

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
