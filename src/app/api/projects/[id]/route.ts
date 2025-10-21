import { NextRequest, NextResponse } from 'next/server'
import { getProject, updateProject, deleteProject } from '@/lib/projects'
import { withApiAuth, createApiError, type AuthContext } from '@/lib/auth'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET /api/projects/[id] - Get single project
export const GET = withApiAuth(
  async (request: NextRequest, context: RouteContext) => {
    try {
      const resolvedParams = await context.params
      const project = await getProject(resolvedParams.id)

      if (!project) {
        return createApiError('Project not found', 404)
      }

      return NextResponse.json(project)
    } catch (error) {
      console.error('Error getting project:', error)
      return createApiError(
        error instanceof Error ? error.message : 'Failed to get project',
        500
      )
    }
  },
  { requireAuth: false } // Public endpoint
)

// PUT /api/projects/[id] - Update project (admin only)
export const PUT = withApiAuth(
  async (request: NextRequest, context: RouteContext, authContext: AuthContext) => {
    try {
      const resolvedParams = await context.params
      const updates = await request.json()

      const updatedProject = await updateProject(resolvedParams.id, updates)

      return NextResponse.json(updatedProject)
    } catch (error) {
      console.error('Error updating project:', error)
      return createApiError(
        error instanceof Error ? error.message : 'Failed to update project',
        500
      )
    }
  },
  { requireAuth: true, requireAdmin: true }
)

// DELETE /api/projects/[id] - Delete project (admin only)
export const DELETE = withApiAuth(
  async (request: NextRequest, context: RouteContext, authContext: AuthContext) => {
    try {
      const resolvedParams = await context.params
      await deleteProject(resolvedParams.id)

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Error deleting project:', error)
      return createApiError(
        error instanceof Error ? error.message : 'Failed to delete project',
        500
      )
    }
  },
  { requireAuth: true, requireAdmin: true }
)
