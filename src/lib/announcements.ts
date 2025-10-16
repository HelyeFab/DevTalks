import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  FirestoreError,
  addDoc,
  updateDoc,
  deleteDoc,
  DocumentData,
  setDoc
} from 'firebase/firestore'
import { db } from './firebase'
import { getAuth } from 'firebase/auth'
import { calculateReadTime } from '@/utils/read-time'
import type { Author, SEOMetadata } from '@/types/blog'
import type { Announcement as AnnouncementType } from '@/types/content'
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
  constructor(message: string, public originalError?: FirestoreError) {
    super(message)
    this.name = 'AnnouncementError'
  }
}

// Helper function to convert Firestore data to Announcement
const convertAnnouncement = (id: string, data: DocumentData): Announcement => {
  // Ensure all date fields are converted to ISO strings
  const date = data.date instanceof Timestamp
    ? data.date.toDate().toISOString()
    : typeof data.date === 'string'
      ? data.date
      : new Date().toISOString()

  const publishedAt = data.publishedAt instanceof Timestamp
    ? data.publishedAt.toDate().toISOString()
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

// Create a new announcement
export const createAnnouncement = async (announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>): Promise<Announcement> => {
  try {
    if (!db) {
      throw new Error('Firestore is not initialized')
    }

    const auth = getAuth()
    const user = auth.currentUser

    if (!user) {
      throw new AnnouncementError('User must be authenticated to create announcements')
    }

    // Check if user has a profile and is admin
    const profileRef = doc(db, 'profiles', user.uid)
    const profileSnap = await getDoc(profileRef)

    // Create profile if it doesn't exist and user is admin email
    if (!profileSnap.exists() && user.email === ADMIN_EMAIL) {
      await setDoc(profileRef, {
        isAdmin: true,
        email: user.email,
        name: user.displayName || '',
        photoURL: user.photoURL || '',
        createdAt: new Date().toISOString()
      })
    } else if (!profileSnap.exists() || !profileSnap.data()?.isAdmin) {
      throw new AnnouncementError('User must be an admin to create announcements')
    }

    const now = new Date().toISOString()
    const announcementData = {
      ...announcement,
      date: announcement.date || now,
      readTime: calculateReadTime(announcement.content),
      author: {
        uid: user.uid,
        name: user.displayName || '',
        email: user.email || '',
        image: user.photoURL || ''
      },
      startDate: announcement.startDate || null,
      endDate: announcement.endDate || null,
      publishedAt: announcement.published ? now : null,
      createdAt: now,
      updatedAt: now,
    }

    const docRef = await addDoc(collection(db, 'announcements'), announcementData)
    return {
      id: docRef.id,
      ...announcementData,
    }
  } catch (error) {
    console.error('Error creating announcement:', error)
    throw new AnnouncementError('Failed to create announcement', error as FirestoreError)
  }
}

// Update an existing announcement
export const updateAnnouncement = async (announcement: Announcement): Promise<Announcement> => {
  try {
    if (!db) {
      throw new Error('Firestore is not initialized')
    }

    if (!announcement.id) {
      throw new Error('Announcement ID is required')
    }

    // Create update data without the id field
    const { id, ...updateData } = announcement

    const docRef = doc(db, 'announcements', announcement.id)
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: new Date().toISOString(),
    })
    return announcement
  } catch (error) {
    console.error('Error updating announcement:', error)
    throw new AnnouncementError(
      'Failed to update announcement',
      error as FirestoreError
    )
  }
}

// Delete an announcement
export const deleteAnnouncement = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'announcements', id))
  } catch (error) {
    console.error('Error deleting announcement:', error)
    throw new AnnouncementError('Failed to delete announcement', error as FirestoreError)
  }
}

// Get a single announcement by ID
export const getAnnouncement = async (id: string): Promise<Announcement | null> => {
  try {
    const docRef = doc(db, 'announcements', id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return null
    }

    return convertAnnouncement(docSnap.id, docSnap.data())
  } catch (error) {
    console.error('Error getting announcement:', error)
    throw new AnnouncementError('Failed to get announcement', error as FirestoreError)
  }
}

// Get all announcements with pagination support
export const getAllAnnouncements = async (
  options: {
    publishedOnly?: boolean,
    pagination?: PaginationParams
  } = {}
): Promise<PaginationResult<Announcement>> => {
  try {
    if (!db) {
      throw new Error('Firestore is not initialized')
    }

    const { publishedOnly = true, pagination = DEFAULT_PAGINATION } = options;

    const announcementsRef = collection(db, 'announcements');
    let q = query(announcementsRef);

    // Sort by date
    q = query(announcementsRef, orderBy('date', pagination.orderDirection || 'desc'));

    // Execute the query
    const querySnapshot = await getDocs(q);
    let allAnnouncements = querySnapshot.docs.map(doc => convertAnnouncement(doc.id, doc.data()));

    // If we need to filter for published announcements, do it in memory
    if (publishedOnly) {
      allAnnouncements = allAnnouncements.filter(announcement => announcement.published);
    }

    // Apply pagination
    return paginateArray(allAnnouncements, pagination);
  } catch (error) {
    console.error('Error getting announcements:', error)
    throw new AnnouncementError('Failed to get announcements', error as FirestoreError)
  }
}

// Get single announcement by slug
export const getAnnouncementBySlug = async (slug: string, includeDrafts = false): Promise<Announcement | null> => {
  try {
    if (!db) {
      throw new Error('Firestore is not initialized')
    }

    // Use a simple query without composite indexes
    const q = query(
      collection(db, 'announcements'),
      where('slug', '==', slug)
    );

    const querySnapshot = await getDocs(q);

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
      error as FirestoreError
    )
  }
}

// Get active announcements (current date falls between startDate and endDate)
export const getActiveAnnouncements = async (): Promise<Announcement[]> => {
  try {
    const now = new Date().toISOString()

    // Use a simpler query approach to avoid index issues
    const q = query(collection(db, 'announcements'))

    const querySnapshot = await getDocs(q)
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
    throw new AnnouncementError('Failed to get active announcements', error as FirestoreError)
  }
}
