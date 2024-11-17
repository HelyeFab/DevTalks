import { db } from './firebase'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import type { UserProfile } from '@/types/profile'

const PROFILES_COLLECTION = 'profiles'

export async function getProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) {
    console.error('No userId provided to getProfile')
    return null
  }

  console.log('Fetching profile for userId:', userId)
  
  try {
    const docRef = doc(db, PROFILES_COLLECTION, userId)
    console.log('Attempting to get document from:', PROFILES_COLLECTION, 'with ID:', userId)
    
    const docSnap = await getDoc(docRef)
    console.log('Document exists:', docSnap.exists())

    if (docSnap.exists()) {
      const data = docSnap.data()
      console.log('Profile data:', data)
      return data as UserProfile
    }

    console.log('Profile does not exist, creating default profile')
    const defaultProfile: UserProfile = {
      bio: '',
      socialLinks: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await setDoc(docRef, defaultProfile)
    return defaultProfile

  } catch (error) {
    console.error('Error fetching profile:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
    }
    return null
  }
}

export async function createProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
  if (!userId) {
    throw new Error('No userId provided to createProfile')
  }

  console.log('Creating profile for userId:', userId)

  try {
    const profile: UserProfile = {
      bio: data.bio || '',
      socialLinks: data.socialLinks || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    console.log('Creating profile with data:', profile)
    await setDoc(doc(db, PROFILES_COLLECTION, userId), profile)
    console.log('Profile created successfully')
  } catch (error) {
    console.error('Error creating profile:', error)
    throw error
  }
}

export async function updateProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
  if (!userId) {
    throw new Error('No userId provided to updateProfile')
  }

  console.log('Updating profile for userId:', userId)
  console.log('Update data:', data)

  try {
    const docRef = doc(db, PROFILES_COLLECTION, userId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      console.log('Profile does not exist, creating new profile')
      await createProfile(userId, data)
      return
    }

    console.log('Updating existing profile')
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    })
    console.log('Profile updated successfully')
  } catch (error) {
    console.error('Error updating profile:', error)
    throw error
  }
}
