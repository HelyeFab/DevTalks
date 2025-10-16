'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyAuthToken, type AuthUser } from './auth-utils'
import logger from '@/lib/logger'

/**
 * Server-side authentication result
 */
export interface ServerAuthResult {
  authenticated: boolean
  user?: AuthUser
  error?: string
}

/**
 * Gets the authentication token from cookies
 * This is used for server-side authentication in Server Components
 *
 * @returns The auth token or null if not found
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    return token || null
  } catch (error) {
    logger.error('Error getting auth token from cookies', { error })
    return null
  }
}

/**
 * Authenticates the current user from server-side cookies
 *
 * @returns Authentication result with user data or error
 *
 * @example
 * ```typescript
 * // In a Server Component
 * export default async function ProfilePage() {
 *   const auth = await authenticateServer()
 *   if (!auth.authenticated) {
 *     redirect('/login')
 *   }
 *   return <div>Welcome {auth.user.name}</div>
 * }
 * ```
 */
export async function authenticateServer(): Promise<ServerAuthResult> {
  const token = await getAuthToken()

  if (!token) {
    return {
      authenticated: false,
      error: 'No authentication token found'
    }
  }

  const result = await verifyAuthToken(token)

  if (!result.success || !result.user) {
    return {
      authenticated: false,
      error: result.error || 'Authentication failed'
    }
  }

  return {
    authenticated: true,
    user: result.user
  }
}

/**
 * Requires authentication for a server component or page
 * Redirects to login page if not authenticated
 *
 * @param redirectTo - Optional path to redirect after login (defaults to current path)
 * @returns The authenticated user
 *
 * @example
 * ```typescript
 * export default async function ProtectedPage() {
 *   const user = await requireAuth()
 *   return <div>Hello {user.name}</div>
 * }
 * ```
 */
export async function requireAuth(redirectTo?: string): Promise<AuthUser> {
  const auth = await authenticateServer()

  if (!auth.authenticated || !auth.user) {
    // Redirect to login with return URL
    const loginUrl = redirectTo
      ? `/login?returnUrl=${encodeURIComponent(redirectTo)}`
      : '/login'
    redirect(loginUrl)
  }

  return auth.user
}

/**
 * Requires admin authentication for a server component or page
 * Redirects to login if not authenticated, or shows 403 if authenticated but not admin
 *
 * @param redirectTo - Optional path to redirect after login
 * @returns The authenticated admin user
 *
 * @example
 * ```typescript
 * export default async function AdminPage() {
 *   const adminUser = await requireAdmin()
 *   return <div>Admin: {adminUser.name}</div>
 * }
 * ```
 */
export async function requireAdmin(redirectTo?: string): Promise<AuthUser> {
  const user = await requireAuth(redirectTo)

  if (!user.isAdmin) {
    logger.warn('Non-admin user attempted to access admin page', {
      uid: user.uid,
      email: user.email
    })
    // Redirect to unauthorized page or home
    redirect('/unauthorized')
  }

  return user
}

/**
 * Requires moderator or admin authentication for a server component or page
 *
 * @param redirectTo - Optional path to redirect after login
 * @returns The authenticated moderator or admin user
 */
export async function requireModerator(redirectTo?: string): Promise<AuthUser> {
  const user = await requireAuth(redirectTo)

  if (!user.isModerator && !user.isAdmin) {
    logger.warn('User without moderator privileges attempted to access moderator page', {
      uid: user.uid,
      email: user.email,
      role: user.role
    })
    redirect('/unauthorized')
  }

  return user
}

/**
 * Gets optional authentication for a server component
 * Returns null if not authenticated, otherwise returns the user
 *
 * @returns The authenticated user or null
 *
 * @example
 * ```typescript
 * export default async function OptionalAuthPage() {
 *   const user = await getOptionalServerAuth()
 *   return (
 *     <div>
 *       {user ? `Welcome ${user.name}` : 'Welcome guest'}
 *     </div>
 *   )
 * }
 * ```
 */
export async function getOptionalServerAuth(): Promise<AuthUser | null> {
  const auth = await authenticateServer()
  return auth.authenticated && auth.user ? auth.user : null
}

/**
 * Checks if the current user is authenticated
 *
 * @returns True if authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const auth = await authenticateServer()
  return auth.authenticated
}

/**
 * Checks if the current user is an admin
 *
 * @returns True if user is admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  const auth = await authenticateServer()
  return auth.authenticated && auth.user?.isAdmin === true
}

/**
 * Checks if the current user is a moderator or admin
 *
 * @returns True if user is moderator or admin, false otherwise
 */
export async function isModerator(): Promise<boolean> {
  const auth = await authenticateServer()
  return (
    auth.authenticated &&
    (auth.user?.isModerator === true || auth.user?.isAdmin === true)
  )
}
