import { NextRequest, NextResponse } from 'next/server'
import { Announcement } from '@/lib/announcements'
import { initAdmin } from '@/lib/firebase-admin'
import {
  withAdminAuth,
  createApiError,
  withRateLimit,
  RateLimitPresets,
  type AuthContext
} from '@/lib/auth'

type CreateAnnouncementData = Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>

// Initialize Firebase Admin
const { db } = initAdmin()

export const dynamic = 'force-dynamic'

// Apply rate limiting to GET requests
export const GET = withRateLimit(
  async () => {
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
      return createApiError('Failed to fetch announcements', 500)
    }
  },
  RateLimitPresets.generous
)

// Admin-only POST with rate limiting
export const POST = withRateLimit(
  withAdminAuth(async (request: NextRequest, _context: unknown, authContext: AuthContext) => {
    try {
      console.log('Creating announcement', { userId: authContext.user.uid })

      // Parse request body
      const data = await request.json() as CreateAnnouncementData

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
      return createApiError('Failed to create announcement', 500)
    }
  }),
  RateLimitPresets.moderate
)

// Admin-only PUT with rate limiting
export const PUT = withRateLimit(
  withAdminAuth(async (request: NextRequest, _context: unknown, authContext: AuthContext) => {
    try {
      console.log('Updating announcement', { userId: authContext.user.uid })

      const { id, ...data } = await request.json()
      if (!id) {
        return createApiError('Announcement ID is required', 400)
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
      return createApiError('Failed to update announcement', 500)
    }
  }),
  RateLimitPresets.moderate
)

// Admin-only DELETE with rate limiting
export const DELETE = withRateLimit(
  withAdminAuth(async (request: NextRequest, _context: unknown, authContext: AuthContext) => {
    try {
      console.log('Deleting announcement', { userId: authContext.user.uid })

      const { searchParams } = new URL(request.url)
      const id = searchParams.get('id')

      if (!id) {
        return createApiError('Announcement ID is required', 400)
      }

      const docRef = db.collection('announcements').doc(id)
      await docRef.delete()

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Error deleting announcement:', error)
      return createApiError('Failed to delete announcement', 500)
    }
  }),
  RateLimitPresets.moderate
)
