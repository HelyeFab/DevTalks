import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  FirestoreError,
  addDoc,
  updateDoc,
  deleteDoc,
  DocumentData,
} from 'firebase/firestore'
import { db } from './firebase'

export interface Announcement {
  id?: string
  title: string
  content: string
  pinned: boolean
  startDate?: string
  endDate?: string
  published: boolean
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

class AnnouncementError extends Error {
  constructor(message: string, public originalError?: FirestoreError) {
    super(message)
    this.name = 'AnnouncementError'
  }
}

// Helper function to convert Firestore data to Announcement
const convertAnnouncement = (id: string, data: DocumentData): Announcement => {
  return {
    id,
    title: data.title,
    content: data.content,
    pinned: data.pinned,
    startDate: data.startDate,
    endDate: data.endDate,
    published: data.published,
    publishedAt: data.publishedAt || null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

// Create a new announcement
export const createAnnouncement = async (announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>): Promise<Announcement> => {
  try {
    const now = new Date().toISOString()
    // Remove undefined values and convert them to null for Firestore
    const announcementData = {
      ...announcement,
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
export const updateAnnouncement = async (id: string, updates: Partial<Announcement>): Promise<Announcement> => {
  try {
    const announcementRef = doc(db, 'announcements', id)
    const now = new Date().toISOString()
    
    // Convert undefined values to null for Firestore
    const updatedData = {
      ...updates,
      startDate: updates.startDate || null,
      endDate: updates.endDate || null,
      updatedAt: now,
      // Set publishedAt when publishing for the first time
      ...(updates.published !== undefined && {
        publishedAt: updates.published ? now : null,
      }),
    }

    await updateDoc(announcementRef, updatedData)

    const updatedDoc = await getDoc(announcementRef)
    if (!updatedDoc.exists()) {
      throw new AnnouncementError('Announcement not found')
    }

    return convertAnnouncement(id, updatedDoc.data())
  } catch (error) {
    console.error('Error updating announcement:', error)
    throw new AnnouncementError('Failed to update announcement', error as FirestoreError)
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

// Get all announcements
export const getAllAnnouncements = async (publishedOnly = true): Promise<Announcement[]> => {
  try {
    let q = query(collection(db, 'announcements'))

    if (publishedOnly) {
      q = query(q, where('published', '==', true))
    }

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => convertAnnouncement(doc.id, doc.data()))
  } catch (error) {
    console.error('Error getting announcements:', error)
    throw new AnnouncementError('Failed to get announcements', error as FirestoreError)
  }
}

// Get active announcements (current date falls between startDate and endDate)
export const getActiveAnnouncements = async (): Promise<Announcement[]> => {
  try {
    const now = new Date().toISOString()
    console.log('Current date:', now)
    
    // Query for published announcements
    const q = query(
      collection(db, 'announcements'),
      where('published', '==', true),
      orderBy('pinned', 'desc'),
      orderBy('startDate', 'desc')
    )

    const querySnapshot = await getDocs(q)
    const announcements = querySnapshot.docs.map(doc => convertAnnouncement(doc.id, doc.data()))
    console.log('All announcements from Firestore:', announcements.map(a => ({
      id: a.id,
      title: a.title,
      published: a.published,
      startDate: a.startDate,
      endDate: a.endDate,
      pinned: a.pinned
    })))

    // Filter active announcements in memory
    const activeAnnouncements = announcements.filter(announcement => {
      const startDate = announcement.startDate ? new Date(announcement.startDate) : null
      const endDate = announcement.endDate ? new Date(announcement.endDate) : null
      const currentDate = new Date(now)

      const isActive = (!startDate || startDate <= currentDate) && (!endDate || endDate >= currentDate)

      console.log('Checking announcement:', {
        id: announcement.id,
        title: announcement.title,
        published: announcement.published,
        startDate: startDate?.toISOString() || 'none',
        endDate: endDate?.toISOString() || 'none',
        currentDate: currentDate.toISOString(),
        isActive,
        reason: !isActive ? (
          startDate && startDate > currentDate ? 'Start date is in the future' :
          endDate && endDate < currentDate ? 'End date has passed' :
          'Unknown reason'
        ) : 'Active'
      })

      return isActive
    })

    console.log('Final active announcements:', activeAnnouncements.map(a => ({
      id: a.id,
      title: a.title,
      pinned: a.pinned
    })))
    
    return activeAnnouncements
  } catch (error) {
    console.error('Error getting active announcements:', error)
    throw new AnnouncementError('Failed to get active announcements', error as FirestoreError)
  }
}
