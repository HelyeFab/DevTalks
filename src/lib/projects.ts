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
  setDoc
} from 'firebase/firestore'
import { db } from './firebase'
import { getAuth } from 'firebase/auth'
import { Project } from '@/types/project'
export type { Project }

// Use environment variable for admin email
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

class ProjectError extends Error {
  constructor(message: string, public originalError?: FirestoreError) {
    super(message)
    this.name = 'ProjectError'
  }
}

const COLLECTION_NAME = 'projects'

// Helper function to convert Firestore data to Project
function convertProject(id: string, data: DocumentData): Project {
  // Ensure all date fields are converted to ISO strings
  const createdAt = data.createdAt instanceof Timestamp
    ? data.createdAt.toDate().toISOString()
    : typeof data.createdAt === 'string'
      ? data.createdAt
      : new Date().toISOString()

  const updatedAt = data.updatedAt instanceof Timestamp
    ? data.updatedAt.toDate().toISOString()
    : typeof data.updatedAt === 'string'
      ? data.updatedAt
      : undefined

  // Convert and sanitize the project data
  const project: Project = {
    id,
    title: String(data.title || ''),
    slug: String(data.slug || ''),
    description: String(data.description || ''),
    image: String(data.image || ''),
    technologies: Array.isArray(data.technologies) ? data.technologies.map(String) : [],
    githubUrl: data.githubUrl ? String(data.githubUrl) : undefined,
    liveUrl: data.liveUrl ? String(data.liveUrl) : undefined,
    featured: Boolean(data.featured),
    content: String(data.content || ''),
    subtitle: data.subtitle ? String(data.subtitle) : undefined,
    createdAt: createdAt,
    updatedAt: updatedAt
  }

  return project
}

// Server-side functions
export async function createProject(project: Omit<Project, 'id'>): Promise<Project> {
  try {
    if (!db) {
      throw new Error('Firestore is not initialized')
    }

    const auth = getAuth()
    const user = auth.currentUser

    if (!user) {
      throw new ProjectError('User must be authenticated to create projects')
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
      throw new ProjectError('User must be an admin to create projects')
    }

    const now = new Date().toISOString()

    const projectData = {
      ...project,
      createdAt: now,
      updatedAt: now
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), projectData)

    return {
      id: docRef.id,
      ...projectData
    }
  } catch (error) {
    console.error('Error creating project:', error)
    throw new ProjectError(
      'Failed to create project',
      error as FirestoreError
    )
  }
}

export async function updateProject(projectId: string, updates: Partial<Project>): Promise<Project> {
  try {
    if (!db) {
      throw new Error('Firestore is not initialized')
    }

    const docRef = doc(db, COLLECTION_NAME, projectId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      throw new Error('Project not found')
    }

    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString()
    }

    await updateDoc(docRef, updatedData)

    const updatedProject = {
      ...convertProject(docSnap.id, docSnap.data()),
      ...updatedData
    }

    return updatedProject
  } catch (error) {
    console.error('Error updating project:', error)
    throw new ProjectError(
      'Failed to update project',
      error as FirestoreError
    )
  }
}

export async function deleteProject(id: string): Promise<void> {
  try {
    if (!db) {
      throw new Error('Firestore is not initialized')
    }

    const docRef = doc(db, COLLECTION_NAME, id)
    await deleteDoc(docRef)
  } catch (error) {
    console.error('Error deleting project:', error)
    throw new ProjectError(
      'Failed to delete project',
      error as FirestoreError
    )
  }
}

export async function getProject(id: string): Promise<Project | null> {
  try {
    if (!db) {
      throw new Error('Firestore is not initialized')
    }

    const docRef = doc(db, COLLECTION_NAME, id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return null
    }

    return convertProject(docSnap.id, docSnap.data())
  } catch (error) {
    console.error('Error getting project:', error)
    throw new ProjectError(
      'Failed to get project',
      error as FirestoreError
    )
  }
}

import { PaginationParams, PaginationResult, DEFAULT_PAGINATION, paginateArray } from './pagination';

/**
 * Get all projects with pagination support
 */
export async function getAllProjects(
  options: {
    featuredOnly?: boolean,
    pagination?: PaginationParams
  } = {}
): Promise<PaginationResult<Project>> {
  try {
    if (!db) {
      throw new Error('Firestore is not initialized')
    }

    const { featuredOnly = false, pagination = DEFAULT_PAGINATION } = options;

    const projectsRef = collection(db, COLLECTION_NAME);
    let q = query(projectsRef);

    // Note: Firestore requires composite indexes for complex queries
    // For now, use a simpler approach to avoid index errors

    // Just sort by createdAt
    q = query(projectsRef, orderBy('createdAt', pagination.orderDirection || 'desc'));

    // Execute the query
    const querySnapshot = await getDocs(q);
    let allProjects = querySnapshot.docs.map(doc => convertProject(doc.id, doc.data()));

    // Filter in memory if needed
    if (featuredOnly) {
      allProjects = allProjects.filter(project => project.featured);
    }

    // Apply pagination
    return paginateArray(allProjects, pagination);
  } catch (error) {
    console.error('Error getting projects:', error)
    throw new ProjectError(
      'Failed to get projects',
      error as FirestoreError
    )
  }
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  try {
    if (!db) {
      throw new Error('Firestore is not initialized')
    }

    const q = query(
      collection(db, COLLECTION_NAME),
      where('slug', '==', slug)
    )

    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return null
    }

    const doc = querySnapshot.docs[0]
    return convertProject(doc.id, doc.data())
  } catch (error) {
    console.error('Error getting project by slug:', error)
    throw new ProjectError(
      'Failed to get project by slug',
      error as FirestoreError
    )
  }
}

export async function getProjectsByTechnology(technology: string): Promise<Project[]> {
  try {
    if (!db) {
      throw new Error('Firestore is not initialized')
    }

    const q = query(
      collection(db, COLLECTION_NAME),
      where('technologies', 'array-contains', technology),
      orderBy('createdAt', 'desc')
    )

    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => convertProject(doc.id, doc.data()))
  } catch (error) {
    console.error('Error getting projects by technology:', error)
    throw new ProjectError(
      'Failed to get projects by technology',
      error as FirestoreError
    )
  }
}
