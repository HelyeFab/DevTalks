import { NextRequest, NextResponse } from 'next/server'
import { getAllProjects, createProject } from '@/lib/projects'
import { withApiAuth, createApiError, type AuthContext } from '@/lib/auth'

// GET /api/projects - Get all projects
export const GET = withApiAuth(
  async (request: NextRequest, authContext: AuthContext) => {
    try {
      const { searchParams } = new URL(request.url)
      const featuredOnly = searchParams.get('featured') === 'true'

      const result = await getAllProjects({
        featuredOnly,
        pagination: { page: 1, limit: 100 }
      })

      return NextResponse.json(result)
    } catch (error) {
      console.error('Error getting projects:', error)
      return createApiError(
        error instanceof Error ? error.message : 'Failed to get projects',
        500
      )
    }
  },
  { requireAuth: false } // Public endpoint
)

// POST /api/projects - Create new project (admin only)
export const POST = withApiAuth(
  async (request: NextRequest, authContext: AuthContext) => {
    try {
      const projectData = await request.json()
      const newProject = await createProject(projectData)

      return NextResponse.json(newProject, { status: 201 })
    } catch (error) {
      console.error('Error creating project:', error)
      return createApiError(
        error instanceof Error ? error.message : 'Failed to create project',
        500
      )
    }
  },
  { requireAuth: true, requireAdmin: true }
)
