/**
 * Server-only project operations
 *
 * This module contains all server-side project operations that interact
 * directly with Firestore using Firebase Admin SDK.
 * It should NEVER be imported in client components.
 */

import 'server-only'

import { getAdminDb } from './server/firebase-admin'
import { Project } from '@/types/project'
import { PaginationParams, PaginationResult, DEFAULT_PAGINATION, paginateArray } from './pagination'

// Use environment variable for admin email
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || ''

// Export the imported type for convenience
export type { Project }

class ProjectError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message)
    this.name = 'ProjectError'
  }
}

const COLLECTION_NAME = 'projects'

// Helper function to convert Firestore Admin SDK data to Project
function convertProject(id: string, data: FirebaseFirestore.DocumentData): Project {
  // Ensure all date fields are converted to ISO strings
  const createdAt = data.createdAt?._seconds
    ? new Date(data.createdAt._seconds * 1000).toISOString()
    : typeof data.createdAt === 'string'
      ? data.createdAt
      : new Date().toISOString()

  const updatedAt = data.updatedAt?._seconds
    ? new Date(data.updatedAt._seconds * 1000).toISOString()
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

// Server-side functions using Firebase Admin SDK
export async function createProject(project: Omit<Project, 'id'>, userUid?: string, userEmail?: string): Promise<Project> {
  try {
    const db = getAdminDb()

    if (!userUid) {
      throw new ProjectError('User must be authenticated to create projects')
    }

    // Check if user has a profile and is admin
    const profileDoc = await db.collection('profiles').doc(userUid).get()

    // Create profile if it doesn't exist and user is admin email
    const userData = profileDoc.data()
    if (!profileDoc.exists && userEmail === ADMIN_EMAIL) {
      await db.collection('profiles').doc(userUid).set({
        isAdmin: true,
        email: userEmail,
        name: '',
        photoURL: '',
        createdAt: new Date().toISOString()
      })
    } else if (!profileDoc.exists || !userData?.isAdmin) {
      throw new ProjectError('User must be an admin to create projects')
    }

    const now = new Date().toISOString()

    const projectData = {
      ...project,
      createdAt: now,
      updatedAt: now
    }

    const docRef = await db.collection(COLLECTION_NAME).add(projectData)

    return {
      id: docRef.id,
      ...projectData
    }
  } catch (error) {
    console.error('Error creating project:', error)
    throw new ProjectError(
      'Failed to create project',
      error
    )
  }
}

export async function updateProject(projectId: string, updates: Partial<Project>): Promise<Project> {
  try {
    const db = getAdminDb()

    const docRef = db.collection(COLLECTION_NAME).doc(projectId)
    const docSnap = await docRef.get()

    if (!docSnap.exists) {
      throw new Error('Project not found')
    }

    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString()
    }

    await docRef.update(updatedData)

    const updatedProject = {
      ...convertProject(docSnap.id, docSnap.data()!),
      ...updatedData
    }

    return updatedProject
  } catch (error) {
    console.error('Error updating project:', error)
    throw new ProjectError(
      'Failed to update project',
      error
    )
  }
}

export async function deleteProject(id: string): Promise<void> {
  try {
    const db = getAdminDb()

    await db.collection(COLLECTION_NAME).doc(id).delete()
  } catch (error) {
    console.error('Error deleting project:', error)
    throw new ProjectError(
      'Failed to delete project',
      error
    )
  }
}

export async function getProject(id: string): Promise<Project | null> {
  try {
    const db = getAdminDb()

    const docSnap = await db.collection(COLLECTION_NAME).doc(id).get()

    if (!docSnap.exists) {
      return null
    }

    return convertProject(docSnap.id, docSnap.data()!)
  } catch (error) {
    console.error('Error getting project:', error)
    throw new ProjectError(
      'Failed to get project',
      error
    )
  }
}

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
    const db = getAdminDb()

    const { featuredOnly = false, pagination = DEFAULT_PAGINATION } = options;

    // Get reference to projects collection
    const projectsRef = db.collection(COLLECTION_NAME);

    // Build query - Admin SDK uses different API than client SDK
    let query = projectsRef.orderBy('createdAt', pagination.orderDirection || 'desc');

    // Execute the query
    const querySnapshot = await query.get();
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
      error
    )
  }
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  try {
    const db = getAdminDb()

    // Query by slug using Admin SDK
    const querySnapshot = await db.collection(COLLECTION_NAME)
      .where('slug', '==', slug)
      .get();

    if (querySnapshot.empty) {
      return null
    }

    const doc = querySnapshot.docs[0]
    return convertProject(doc.id, doc.data())
  } catch (error) {
    console.error('Error getting project by slug:', error)
    throw new ProjectError(
      'Failed to get project by slug',
      error
    )
  }
}

export async function getProjectsByTechnology(technology: string): Promise<Project[]> {
  try {
    const db = getAdminDb()

    // Query by technology using Admin SDK
    const querySnapshot = await db.collection(COLLECTION_NAME)
      .where('technologies', 'array-contains', technology)
      .orderBy('createdAt', 'desc')
      .get();

    return querySnapshot.docs.map(doc => convertProject(doc.id, doc.data()))
  } catch (error) {
    console.error('Error getting projects by technology:', error)
    throw new ProjectError(
      'Failed to get projects by technology',
      error
    )
  }
}
