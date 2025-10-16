import { NextRequest, NextResponse } from 'next/server'
import {
  verifyAuthToken,
  extractBearerToken,
  hasRole,
  type AuthUser,
  type UserRole
} from './auth-utils'
import logger from '@/lib/logger'

/**
 * Authentication context passed to route handlers
 */
export interface AuthContext {
  user: AuthUser
  token: string
}

/**
 * Configuration options for API authentication
 */
export interface ApiAuthOptions {
  /**
   * Require authentication for this route
   * @default false
   */
  requireAuth?: boolean

  /**
   * Require admin role for this route
   * @default false
   */
  requireAdmin?: boolean

  /**
   * Require a specific role or higher for this route
   */
  requireRole?: UserRole

  /**
   * Custom unauthorized message
   */
  unauthorizedMessage?: string

  /**
   * Custom forbidden message
   */
  forbiddenMessage?: string

  /**
   * Allow requests with expired tokens (for specific use cases)
   * @default false
   */
  allowExpiredToken?: boolean
}

/**
 * CORS headers for API routes
 */
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

/**
 * Creates a standardized API error response
 *
 * @param message - Error message
 * @param status - HTTP status code
 * @param details - Optional additional error details
 * @returns NextResponse with error
 */
export function createApiError(
  message: string,
  status: number = 500,
  details?: Record<string, unknown>
): NextResponse {
  logger.warn('API error response', { message, status, details })

  return NextResponse.json(
    {
      error: message,
      status,
      ...(details && { details })
    },
    { status }
  )
}

/**
 * Creates a standardized API success response
 *
 * @param data - Response data
 * @param status - HTTP status code
 * @param headers - Additional headers
 * @returns NextResponse with data
 */
export function createApiSuccess<T>(
  data: T,
  status: number = 200,
  headers?: Record<string, string>
): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: headers ? { ...headers } : undefined
  })
}

/**
 * Handles OPTIONS requests for CORS preflight
 *
 * @returns NextResponse with CORS headers
 */
export function handleCorsPreFlight(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS
  })
}

/**
 * Authenticates a request and extracts user context
 *
 * @param request - The Next.js request object
 * @param options - Authentication options
 * @returns Authentication context or null if not authenticated
 *
 * @example
 * ```typescript
 * const authContext = await authenticateRequest(request, { requireAuth: true })
 * if (!authContext) {
 *   return createApiError('Unauthorized', 401)
 * }
 * ```
 */
export async function authenticateRequest(
  request: NextRequest,
  options: ApiAuthOptions = {}
): Promise<AuthContext | null> {
  const authHeader = request.headers.get('Authorization')
  const token = extractBearerToken(authHeader)

  if (!token) {
    if (options.requireAuth) {
      logger.debug('No authentication token provided')
    }
    return null
  }

  const verificationResult = await verifyAuthToken(token)

  if (!verificationResult.success || !verificationResult.user) {
    logger.debug('Token verification failed', {
      error: verificationResult.error,
      errorCode: verificationResult.errorCode
    })
    return null
  }

  return {
    user: verificationResult.user,
    token
  }
}

/**
 * Middleware wrapper for API routes that require authentication
 *
 * @param handler - The route handler function
 * @param options - Authentication options
 * @returns Wrapped handler with authentication
 *
 * @example
 * ```typescript
 * export const POST = withApiAuth(
 *   async (request, context, authContext) => {
 *     // authContext.user is guaranteed to exist here
 *     return NextResponse.json({ userId: authContext.user.uid })
 *   },
 *   { requireAuth: true }
 * )
 * ```
 */
export function withApiAuth<T = unknown>(
  handler: (
    request: NextRequest,
    context: T,
    authContext: AuthContext
  ) => Promise<NextResponse>,
  options: ApiAuthOptions = {}
): (request: NextRequest, context: T) => Promise<NextResponse> {
  return async (request: NextRequest, context: T): Promise<NextResponse> => {
    try {
      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return handleCorsPreFlight()
      }

      // Authenticate the request
      const authContext = await authenticateRequest(request, options)

      // Check if authentication is required
      if (options.requireAuth && !authContext) {
        return createApiError(
          options.unauthorizedMessage || 'Authentication required',
          401
        )
      }

      // If not authenticated but auth is not required, pass through
      if (!authContext && !options.requireAuth) {
        // Call handler with empty auth context (handler should handle this case)
        return handler(request, context, null as unknown as AuthContext)
      }

      // At this point, authContext exists
      if (!authContext) {
        return createApiError('Authentication required', 401)
      }

      const { user } = authContext

      // Check admin requirement
      if (options.requireAdmin && !user.isAdmin) {
        logger.warn('Non-admin user attempted to access admin route', {
          uid: user.uid,
          email: user.email,
          path: request.nextUrl.pathname
        })

        return createApiError(
          options.forbiddenMessage || 'Admin privileges required',
          403
        )
      }

      // Check role requirement
      if (options.requireRole && !hasRole(user, options.requireRole)) {
        logger.warn('User with insufficient role attempted to access route', {
          uid: user.uid,
          email: user.email,
          userRole: user.role,
          requiredRole: options.requireRole,
          path: request.nextUrl.pathname
        })

        return createApiError(
          options.forbiddenMessage ||
            `${options.requireRole} role or higher required`,
          403
        )
      }

      // Log successful authentication
      logger.debug('Request authenticated successfully', {
        uid: user.uid,
        email: user.email,
        role: user.role,
        method: request.method,
        path: request.nextUrl.pathname
      })

      // Call the handler with auth context
      const response = await handler(request, context, authContext)

      // Add CORS headers to the response
      const headers = new Headers(response.headers)
      Object.entries(CORS_HEADERS).forEach(([key, value]) => {
        headers.set(key, value)
      })

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      })
    } catch (error) {
      logger.error('Error in API authentication middleware', {
        error,
        method: request.method,
        path: request.nextUrl.pathname
      })

      return createApiError(
        'An error occurred while processing your request',
        500
      )
    }
  }
}

/**
 * Convenience wrapper for routes that require admin access
 *
 * @param handler - The route handler function
 * @param options - Additional authentication options
 * @returns Wrapped handler requiring admin authentication
 *
 * @example
 * ```typescript
 * export const DELETE = withAdminAuth(
 *   async (request, context, authContext) => {
 *     // User is guaranteed to be admin here
 *     return NextResponse.json({ success: true })
 *   }
 * )
 * ```
 */
export function withAdminAuth<T = unknown>(
  handler: (
    request: NextRequest,
    context: T,
    authContext: AuthContext
  ) => Promise<NextResponse>,
  options: Omit<ApiAuthOptions, 'requireAuth' | 'requireAdmin'> = {}
): (request: NextRequest, context: T) => Promise<NextResponse> {
  return withApiAuth(handler, {
    ...options,
    requireAuth: true,
    requireAdmin: true
  })
}

/**
 * Convenience wrapper for routes that require moderator access or higher
 *
 * @param handler - The route handler function
 * @param options - Additional authentication options
 * @returns Wrapped handler requiring moderator authentication
 *
 * @example
 * ```typescript
 * export const POST = withModeratorAuth(
 *   async (request, context, authContext) => {
 *     // User is guaranteed to be moderator or admin here
 *     return NextResponse.json({ success: true })
 *   }
 * )
 * ```
 */
export function withModeratorAuth<T = unknown>(
  handler: (
    request: NextRequest,
    context: T,
    authContext: AuthContext
  ) => Promise<NextResponse>,
  options: Omit<ApiAuthOptions, 'requireAuth' | 'requireRole'> = {}
): (request: NextRequest, context: T) => Promise<NextResponse> {
  return withApiAuth(handler, {
    ...options,
    requireAuth: true,
    requireRole: 'moderator'
  })
}

/**
 * Extracts user context from request without enforcing authentication
 * Useful for routes that have optional authentication
 *
 * @param request - The Next.js request object
 * @returns Authentication context or null if not authenticated
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const authContext = await getOptionalAuth(request)
 *   const isLiked = authContext
 *     ? await checkIfUserLiked(authContext.user.uid, postId)
 *     : false
 *   return NextResponse.json({ isLiked })
 * }
 * ```
 */
export async function getOptionalAuth(
  request: NextRequest
): Promise<AuthContext | null> {
  return authenticateRequest(request, { requireAuth: false })
}

/**
 * Validates request body against a schema
 *
 * @param request - The Next.js request object
 * @param schema - Zod schema for validation
 * @returns Validated data or error response
 *
 * @example
 * ```typescript
 * import { z } from 'zod'
 *
 * const schema = z.object({
 *   title: z.string(),
 *   content: z.string()
 * })
 *
 * export const POST = withApiAuth(async (request, context, authContext) => {
 *   const result = await validateRequestBody(request, schema)
 *   if (result.error) return result.error
 *   // result.data is now properly typed
 *   return NextResponse.json({ success: true })
 * })
 * ```
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: { parse: (data: unknown) => T }
): Promise<{ data: T; error?: never } | { data?: never; error: NextResponse }> {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    return { data }
  } catch (error) {
    logger.warn('Request body validation failed', { error })

    if (error && typeof error === 'object' && 'issues' in error) {
      const zodError = error as { issues: Array<{ path: string[]; message: string }> }
      return {
        error: createApiError('Validation failed', 400, {
          issues: zodError.issues
        })
      }
    }

    return {
      error: createApiError('Invalid request body', 400)
    }
  }
}
