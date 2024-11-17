import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  QueryConstraint,
  where,
  limit as limitQuery,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { getAuth } from 'firebase/auth'

export type AnnouncementType = 'info' | 'update' | 'maintenance'

export interface Announcement {
  id?: string
  title: string
  content: string
  type: AnnouncementType
  date: string
  active: boolean
  authorId: string
  authorName: string
}

const COLLECTION_NAME = 'announcements'

async function checkAdminAccess() {
  const auth = getAuth()
  const user = auth.currentUser

  if (!user) {
    throw new Error('Authentication required')
  }

  const profileRef = doc(db, 'profiles', user.uid)
  const profileSnap = await getDoc(profileRef)

  if (!profileSnap.exists()) {
    throw new Error('Profile not found')
  }

  const profile = profileSnap.data()
  if (!profile?.isAdmin) {
    throw new Error('Admin access required')
  }

  return user
}

export async function createAnnouncement(announcement: Omit<Announcement, 'id' | 'date'>): Promise<Announcement> {
  try {
    const user = await checkAdminAccess()
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...announcement,
      date: new Date().toISOString(),
      authorId: user.uid,
      authorName: user.displayName || 'Admin'
    })

    return {
      id: docRef.id,
      ...announcement,
      date: new Date().toISOString(),
      authorId: user.uid,
      authorName: user.displayName || 'Admin'
    }
  } catch (error) {
    console.error('Error creating announcement:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to create announcement')
  }
}

export async function updateAnnouncement(id: string, data: Partial<Announcement>): Promise<void> {
  try {
    await checkAdminAccess()
    const docRef = doc(db, COLLECTION_NAME, id)
    await updateDoc(docRef, data)
  } catch (error) {
    console.error('Error updating announcement:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to update announcement')
  }
}

export async function deleteAnnouncement(id: string): Promise<void> {
  try {
    await checkAdminAccess()
    const docRef = doc(db, COLLECTION_NAME, id)
    await deleteDoc(docRef)
  } catch (error) {
    console.error('Error deleting announcement:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to delete announcement')
  }
}

export async function getAnnouncement(id: string): Promise<Announcement | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return null
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Announcement
  } catch (error) {
    console.error('Error getting announcement:', error)
    throw new Error('Failed to get announcement')
  }
}

export async function getActiveAnnouncements(maxLimit = 3): Promise<Announcement[]> {
  try {
    const constraints: QueryConstraint[] = [
      where('active', '==', true),
      orderBy('date', 'desc'),
      limitQuery(maxLimit)
    ]

    const q = query(collection(db, COLLECTION_NAME), ...constraints)
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Announcement[]
  } catch (error) {
    console.error('Error getting announcements:', error)
    throw new Error('Failed to get announcements')
  }
}

export async function getAllAnnouncements(): Promise<Announcement[]> {
  try {
    await checkAdminAccess()
    const constraints: QueryConstraint[] = [
      orderBy('date', 'desc')
    ]

    const q = query(collection(db, COLLECTION_NAME), ...constraints)
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Announcement[]
  } catch (error) {
    console.error('Error getting all announcements:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to get all announcements')
  }
}
