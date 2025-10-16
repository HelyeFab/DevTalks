import { NextRequest, NextResponse } from 'next/server'
import { getRequestSecurityHeaders, generateNonce } from './lib/security'

// Define protected routes that require authentication
const PROTECTED_ROUTES = {
  // Admin routes require admin privileges
  admin: ['/admin'],
  // User routes require authentication
  user: ['/user/profile'],
}

// Public routes that should be accessible even when authenticated
const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/blog',
  '/projects',
  '/contact',
  '/login',
  '/signup',
  '/api/contact',
  '/api/blog',
]

/**
 * Verifies if the request has a valid authentication token
 * In production, this should validate the Firebase token
 * For development, we check for the presence of an auth header
 */
async function verifyAuth(request: NextRequest): Promise<{
  isAuthenticated: boolean
  isAdmin: boolean
}> {
  try {
    const authHeader = request.headers.get('Authorization')
    const cookieToken = request.cookies.get('auth-token')?.value

    // Check if user has any form of authentication
    const hasAuth = !!(authHeader || cookieToken)

    if (!hasAuth) {
      return { isAuthenticated: false, isAdmin: false }
    }

    // In development mode, we can't validate tokens at the edge
    // This is a placeholder - real validation happens in API routes
    // For now, we just check if the token exists
    return {
      isAuthenticated: true,
      isAdmin: false, // Admin check will be done in API routes
    }
  } catch (error) {
    console.error('Auth verification error:', error)
    return { isAuthenticated: false, isAdmin: false }
  }
}

/**
 * Checks if a path matches a protected route pattern
 */
function isProtectedRoute(pathname: string, routes: string[]): boolean {
  return routes.some((route) => pathname.startsWith(route))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and API routes (handled separately)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Generate a nonce for inline scripts and styles
  const nonce = generateNonce()

  // Get environment-specific security headers
  const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development'

  // Get comprehensive security headers for this request
  const securityHeaders = getRequestSecurityHeaders(pathname, {
    nonce,
    environment: environment as 'development' | 'production',
    reportOnly: false, // Set to true to test CSP without blocking
  })

  // Apply security headers to response
  const response = NextResponse.next()

  // Apply all security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Store nonce in request headers for use in components (if needed)
  // Note: This is available in middleware but not in client components
  response.headers.set('x-nonce', nonce)

  // Check if the route is public
  if (PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route))) {
    return response
  }

  // Check authentication for protected routes
  const isAdminRoute = isProtectedRoute(pathname, PROTECTED_ROUTES.admin)
  const isUserRoute = isProtectedRoute(pathname, PROTECTED_ROUTES.user)

  if (isAdminRoute || isUserRoute) {
    const auth = await verifyAuth(request)

    // Redirect to login if not authenticated
    if (!auth.isAuthenticated) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Note: Admin verification happens in the API routes
    // We can't verify admin status at the edge without accessing Firestore
  }

  return response
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
}
