/**
 * Server-only announcement operations
 *
 * This module contains all server-side announcement operations that interact
 * directly with Firestore using Firebase Admin SDK.
 * It should NEVER be imported in client components.
 */

import 'server-only'

import { getAdminDb } from './server/firebase-admin'
import { calculateReadTime } from '@/utils/read-time'
import type { Author, SEOMetadata } from '@/types/blog'
import { PaginationParams, PaginationResult, DEFAULT_PAGINATION, paginateArray } from './pagination'

// Use environment variable for admin email
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

export interface Announcement {
  id?: string
  title: string
  subtitle: string
  content: string // MDX/Markdown content
  excerpt?: string
  image?: string
  imageAlt?: string
  tags: string[]
  author: Author
  date: string
  slug: string
  pinned: boolean
  priority: 'low' | 'normal' | 'high' | 'urgent'
  startDate?: string | null
  endDate?: string | null
  published: boolean
  publishedAt?: string | null
  readTime?: number
  seo?: SEOMetadata
  createdAt?: string
  updatedAt?: string
}

class AnnouncementError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message)
    this.name = 'AnnouncementError'
  }
}

const COLLECTION_NAME = 'announcements'

// Helper function to convert Firestore Admin SDK data to Announcement
function convertAnnouncement(id: string, data: FirebaseFirestore.DocumentData): Announcement {
  // Ensure all date fields are converted to ISO strings
  const date = data.date?._seconds
    ? new Date(data.date._seconds * 1000).toISOString()
    : typeof data.date === 'string'
      ? data.date
      : new Date().toISOString()

  const publishedAt = data.publishedAt?._seconds
    ? new Date(data.publishedAt._seconds * 1000).toISOString()
    : typeof data.publishedAt === 'string'
      ? data.publishedAt
      : undefined

  // Ensure author object is properly structured
  const author: Author = {
    name: data.author?.name || '',
    email: data.author?.email || '',
    image: data.author?.image || undefined,
    uid: data.author?.uid || undefined,
  }

  return {
    id,
    title: String(data.title || ''),
    subtitle: String(data.subtitle || ''),
    content: String(data.content || ''),
    excerpt: data.excerpt ? String(data.excerpt) : undefined,
    image: data.image !== undefined && data.image !== null ? String(data.image) : undefined,
    imageAlt: data.imageAlt !== undefined && data.imageAlt !== null ? String(data.imageAlt) : undefined,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    author,
    date,
    slug: String(data.slug || ''),
    pinned: Boolean(data.pinned),
    priority: data.priority || 'normal',
    startDate: data.startDate || null,
    endDate: data.endDate || null,
    published: Boolean(data.published),
    publishedAt,
    readTime: typeof data.readTime === 'number' ? data.readTime : calculateReadTime(String(data.content || '')),
    seo: data.seo || undefined,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

// Server-side functions using Firebase Admin SDK
export async function createAnnouncement(
  announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>,
  userUid?: string,
  userName?: string,
  userEmail?: string,
  userPhoto?: string
): Promise<Announcement> {
  try {
    const db = getAdminDb()

    if (!userUid) {
      throw new AnnouncementError('User must be authenticated to create announcements')
    }

    // Check if user has a profile and is admin
    const profileDoc = await db.collection('profiles').doc(userUid).get()

    // Create profile if it doesn't exist and user is admin email
    const userData = profileDoc.data()
    if (!profileDoc.exists && userEmail === ADMIN_EMAIL) {
      await db.collection('profiles').doc(userUid).set({
        isAdmin: true,
        email: userEmail,
        name: userName || '',
        photoURL: userPhoto || '',
        createdAt: new Date().toISOString()
      })
    } else if (!profileDoc.exists || !userData?.isAdmin) {
      throw new AnnouncementError('User must be an admin to create announcements')
    }

    const now = new Date().toISOString()
    const announcementData = {
      ...announcement,
      date: announcement.date || now,
      readTime: calculateReadTime(announcement.content),
      author: {
        uid: userUid,
        name: userName || '',
        email: userEmail || '',
        image: userPhoto || ''
      },
      startDate: announcement.startDate || null,
      endDate: announcement.endDate || null,
      publishedAt: announcement.published ? now : null,
      createdAt: now,
      updatedAt: now,
    }

    const docRef = await db.collection(COLLECTION_NAME).add(announcementData)

    return {
      id: docRef.id,
      ...announcementData,
    }
  } catch (error) {
    console.error('Error creating announcement:', error)
    throw new AnnouncementError('Failed to create announcement', error)
  }
}

export async function updateAnnouncement(announcement: Announcement): Promise<Announcement> {
  try {
    const db = getAdminDb()

    if (!announcement.id) {
      throw new Error('Announcement ID is required')
    }

    // Create update data without the id field
    const { id, ...updateData } = announcement

    await db.collection(COLLECTION_NAME).doc(announcement.id).update({
      ...updateData,
      updatedAt: new Date().toISOString(),
    })

    return announcement
  } catch (error) {
    console.error('Error updating announcement:', error)
    throw new AnnouncementError(
      'Failed to update announcement',
      error
    )
  }
}

export async function deleteAnnouncement(id: string): Promise<void> {
  try {
    const db = getAdminDb()

    await db.collection(COLLECTION_NAME).doc(id).delete()
  } catch (error) {
    console.error('Error deleting announcement:', error)
    throw new AnnouncementError('Failed to delete announcement', error)
  }
}

export async function getAnnouncement(id: string): Promise<Announcement | null> {
  try {
    const db = getAdminDb()

    const docSnap = await db.collection(COLLECTION_NAME).doc(id).get()

    if (!docSnap.exists) {
      return null
    }

    return convertAnnouncement(docSnap.id, docSnap.data()!)
  } catch (error) {
    console.error('Error getting announcement:', error)
    throw new AnnouncementError('Failed to get announcement', error)
  }
}

/**
 * Get all announcements with pagination support
 */
export async function getAllAnnouncements(
  options: {
    publishedOnly?: boolean,
    pagination?: PaginationParams
  } = {}
): Promise<PaginationResult<Announcement>> {
  try {
    const db = getAdminDb()

    const { publishedOnly = true, pagination = DEFAULT_PAGINATION } = options;

    // Get reference to announcements collection
    const announcementsRef = db.collection(COLLECTION_NAME);

    // Build query - Admin SDK uses different API than client SDK
    let query = announcementsRef.orderBy('date', pagination.orderDirection || 'desc');

    // Execute the query
    const querySnapshot = await query.get();
    let allAnnouncements = querySnapshot.docs.map(doc => convertAnnouncement(doc.id, doc.data()));

    // If we need to filter for published announcements, do it in memory
    if (publishedOnly) {
      allAnnouncements = allAnnouncements.filter(announcement => announcement.published);
    }

    // Apply pagination
    return paginateArray(allAnnouncements, pagination);
  } catch (error) {
    console.error('Error getting announcements:', error)
    throw new AnnouncementError('Failed to get announcements', error)
  }
}

export async function getAnnouncementBySlug(slug: string, includeDrafts = false): Promise<Announcement | null> {
  try {
    const db = getAdminDb()

    // Query by slug using Admin SDK
    const querySnapshot = await db.collection(COLLECTION_NAME)
      .where('slug', '==', slug)
      .get();

    // Process results in memory
    if (querySnapshot.empty) {
      return null;
    }

    // Filter for published status in memory if needed
    const docs = querySnapshot.docs;
    for (const doc of docs) {
      const announcement = convertAnnouncement(doc.id, doc.data());
      if (includeDrafts || announcement.published) {
        return announcement;
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting announcement by slug:', error)
    throw new AnnouncementError(
      'Failed to get announcement by slug',
      error
    )
  }
}

/**
 * Get active announcements (current date falls between startDate and endDate)
 */
export async function getActiveAnnouncements(): Promise<Announcement[]> {
  try {
    const db = getAdminDb()
    const now = new Date().toISOString()

    // Use a simpler query approach to avoid index issues
    const querySnapshot = await db.collection(COLLECTION_NAME).get()

    const announcements = querySnapshot.docs.map(doc => convertAnnouncement(doc.id, doc.data()))

    // Filter for published announcements in memory first
    const publishedAnnouncements = announcements.filter(announcement => announcement.published)

    // Filter active announcements in memory
    const activeAnnouncements = publishedAnnouncements.filter(announcement => {
      const startDate = announcement.startDate ? new Date(announcement.startDate) : null
      const endDate = announcement.endDate ? new Date(announcement.endDate) : null
      const currentDate = new Date(now)

      const isActive = (!startDate || startDate <= currentDate) && (!endDate || endDate >= currentDate)

      return isActive
    })

    return activeAnnouncements
  } catch (error) {
    console.error('Error getting active announcements:', error)
    throw new AnnouncementError('Failed to get active announcements', error)
  }
}
