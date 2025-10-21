import type { Project } from '@/types/project'
import type { PaginationResult } from './pagination'

export type { Project }

/**
 * Client-side functions for project operations
 * These call the API routes instead of directly using Firebase Admin
 */

export async function getAllProjects(options?: {
  featuredOnly?: boolean
  token?: string
}): Promise<PaginationResult<Project>> {
  const params = new URLSearchParams()
  if (options?.featuredOnly) {
    params.append('featured', 'true')
  }

  const headers: HeadersInit = {}
  if (options?.token) {
    headers['Authorization'] = `Bearer ${options.token}`
  }

  const response = await fetch(`/api/projects?${params.toString()}`, { headers })

  if (!response.ok) {
    throw new Error('Failed to fetch projects')
  }

  return response.json()
}

export async function getProject(id: string, token?: string): Promise<Project> {
  const headers: HeadersInit = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`/api/projects/${id}`, { headers })

  if (!response.ok) {
    throw new Error('Failed to fetch project')
  }

  return response.json()
}

export async function updateProject(
  id: string,
  updates: Partial<Project>,
  token: string
): Promise<Project> {
  const response = await fetch(`/api/projects/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  })

  if (!response.ok) {
    throw new Error('Failed to update project')
  }

  return response.json()
}

export async function deleteProject(id: string, token: string): Promise<void> {
  const response = await fetch(`/api/projects/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  if (!response.ok) {
    throw new Error('Failed to delete project')
  }
}

export async function createProject(
  project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>,
  token: string
): Promise<Project> {
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(project)
  })

  if (!response.ok) {
    throw new Error('Failed to create project')
  }

  return response.json()
}
