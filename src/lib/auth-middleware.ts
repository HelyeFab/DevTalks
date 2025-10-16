import { type NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from './server/firebase-admin'
import { isUserAdmin } from './server/admin-check'

export interface AuthContext {
  userId: string
  email: string | undefined
  name: string | undefined
  isAdmin: boolean
}

/**
 * Verifies the Firebase auth token from the request headers
 * Returns the decoded token data or throws an error if unauthorized
 */
export async function verifyAuthToken(request: NextRequest): Promise<AuthContext> {
  // Get authorization header
  const authHeader = request.headers.get('Authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Authorization header required')
  }

  // Verify the token
  const token = authHeader.split('Bearer ')[1]
  try {
    const decodedToken = await verifyIdToken(token)

    // Check admin status using custom claims
    const isAdmin = await isUserAdmin(decodedToken.uid)

    return {
      userId: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name ?? decodedToken.email?.split('@')[0],
      isAdmin
    }
  } catch (error) {
    console.error('Token verification failed:', error)
    throw new Error('Invalid authorization token')
  }
}

/**
 * Middleware function to handle authentication for API routes
 * @param request - The NextRequest object
 * @param handler - The function to execute if authentication is successful
 * @param requireAdmin - Whether the route requires admin privileges
 */
export async function withAuth<T>(
  request: NextRequest,
  handler: (authContext: AuthContext) => Promise<T>,
  requireAdmin = false
): Promise<T | NextResponse> {
  try {
    const authContext = await verifyAuthToken(request)

    // Check admin privileges if required
    if (requireAdmin && !authContext.isAdmin) {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      )
    }

    return await handler(authContext)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Authorization header required' ||
          error.message === 'Invalid authorization token') {
        return NextResponse.json(
          { error: error.message },
          { status: 401 }
        )
      }
    }

    console.error('Authentication error:', error)
    return NextResponse.json(
      { error: 'Internal server error during authentication' },
      { status: 500 }
    )
  }
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(message: string, status = 500) {
  return NextResponse.json(
    { error: message },
    { status }
  )
}
