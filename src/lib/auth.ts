import { User } from 'firebase/auth'
import { auth } from './firebase'
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword
} from 'firebase/auth'
import { NextRequest, NextResponse } from 'next/server'

export const DEFAULT_AVATAR = '/images/default-avatar.svg'

// ============================================================================
// Types
// ============================================================================

export interface AuthContext {
  user: User & {
    uid: string
    email: string | null
    displayName: string | null
  }
}

export interface RateLimitConfig {
  limit: number
  windowMs: number
  message?: string
}

// ============================================================================
// API Error Utility
// ============================================================================

/**
 * Creates a consistent API error response
 */
export function createApiError(message: string, status: number = 500): NextResponse {
  return NextResponse.json(
    { error: message },
    { status }
  )
}

// ============================================================================
// Rate Limiting
// ============================================================================

/**
 * Rate limit presets for common use cases
 */
export const RateLimitPresets = {
  strict: {
    limit: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many requests. Please try again later.'
  },
  moderate: {
    limit: 20,
    windowMs: 60 * 1000, // 1 minute
    message: 'Rate limit exceeded. Please slow down.'
  },
  generous: {
    limit: 100,
    windowMs: 60 * 1000, // 1 minute
    message: 'Rate limit exceeded. Please try again shortly.'
  }
} as const

// In-memory rate limit store
// Note: In production, use Redis or similar for distributed rate limiting
interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Rate limiting middleware for API routes
 */
export function withRateLimit<T = any>(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  config: RateLimitConfig | typeof RateLimitPresets[keyof typeof RateLimitPresets] = RateLimitPresets.moderate
): (request: NextRequest, ...args: any[]) => Promise<NextResponse> {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      // Get client identifier (IP address)
      const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                      request.headers.get('x-real-ip') ||
                      'unknown'

      const key = `${clientIp}:${request.nextUrl.pathname}`
      const now = Date.now()

      // Get or create rate limit entry
      let entry = rateLimitStore.get(key)

      // Clean up expired entries
      if (entry && now > entry.resetTime) {
        rateLimitStore.delete(key)
        entry = undefined
      }

      // Initialize or update entry
      if (!entry) {
        entry = {
          count: 1,
          resetTime: now + config.windowMs
        }
        rateLimitStore.set(key, entry)
      } else {
        entry.count++
      }

      // Check if rate limit exceeded
      if (entry.count > config.limit) {
        return createApiError(
          config.message || 'Rate limit exceeded',
          429
        )
      }

      // Call the handler
      return await handler(request, ...args)
    } catch (error) {
      console.error('Rate limit error:', error)
      // On error, allow the request through
      return await handler(request, ...args)
    }
  }
}

// ============================================================================
// Authentication Middleware
// ============================================================================

/**
 * Middleware to require authentication for API routes
 */
export function withApiAuth<T = any>(
  handler: (request: NextRequest, context: T, authContext: AuthContext) => Promise<NextResponse>,
  options: { requireAuth?: boolean } = { requireAuth: true }
): (request: NextRequest, context: T) => Promise<NextResponse> {
  return async (request: NextRequest, context: T): Promise<NextResponse> => {
    try {
      // Get the ID token from Authorization header
      const authHeader = request.headers.get('authorization')

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        if (options.requireAuth) {
          return createApiError('Authentication required', 401)
        }
        // If auth not required, continue without auth context
        return await handler(request, context, null as any)
      }

      const idToken = authHeader.split('Bearer ')[1]

      if (!idToken) {
        return createApiError('Invalid authentication token', 401)
      }

      // Verify the token using Firebase Admin SDK
      const { initAdmin } = await import('./firebase-admin')
      const { adminAuth } = initAdmin()

      const decodedToken = await adminAuth.verifyIdToken(idToken)

      // Create auth context
      const authContext: AuthContext = {
        user: {
          uid: decodedToken.uid,
          email: decodedToken.email || null,
          displayName: decodedToken.name || null,
        } as any
      }

      // Call the handler with auth context
      return await handler(request, context, authContext)
    } catch (error) {
      console.error('Authentication error:', error)
      return createApiError('Authentication failed', 401)
    }
  }
}

/**
 * Middleware to require admin authentication for API routes
 */
export function withAdminAuth<T = any>(
  handler: (request: NextRequest, context: T, authContext: AuthContext) => Promise<NextResponse>
): (request: NextRequest, context: T) => Promise<NextResponse> {
  return withApiAuth(async (request: NextRequest, context: T, authContext: AuthContext): Promise<NextResponse> => {
    try {
      // Verify admin status using Firebase Admin SDK
      const { initAdmin } = await import('./firebase-admin')
      const { adminAuth } = initAdmin()

      const user = await adminAuth.getUser(authContext.user.uid)
      const isAdmin = user.customClaims?.admin === true

      if (!isAdmin) {
        return createApiError('Admin access required', 403)
      }

      // User is admin, proceed with handler
      return await handler(request, context, authContext)
    } catch (error) {
      console.error('Admin authorization error:', error)
      return createApiError('Authorization failed', 403)
    }
  }, { requireAuth: true })
}

/**
 * Checks if user is admin by checking custom claims
 * This will be set server-side using Firebase Admin SDK
 */
async function checkAdminClaims(user: User): Promise<boolean> {
  try {
    const idTokenResult = await user.getIdTokenResult()
    return idTokenResult.claims.admin === true
  } catch (error) {
    console.error('Error checking admin claims:', error)
    return false
  }
}

export async function getCurrentAuth() {
  return new Promise((resolve) => {
    // Wait for auth state to be ready
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe() // Unsubscribe immediately

      if (!user) {
        resolve(null)
        return
      }

      resolve({
        user: {
          id: user.uid,
          email: user.email,
          name: user.displayName || user.email?.split('@')[0] || 'Anonymous',
          image: user.photoURL || DEFAULT_AVATAR,
        }
      })
    })
  })
}

export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    return result.user
  } catch (error) {
    console.error('Error signing in with Google:', error)
    throw error
  }
}

export async function signIn(email: string, password: string) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password)
    return result.user
  } catch (error) {
    console.error('Error signing in:', error)
    throw error
  }
}

export async function signUp(email: string, password: string, name: string) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(result.user, {
      displayName: name,
    })
    return result.user
  } catch (error) {
    console.error('Error signing up:', error)
    throw error
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth)
  } catch (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

export async function isAdmin(user: User | null): Promise<boolean> {
  if (!user) return false
  return checkAdminClaims(user)
}

export async function getRedirectPath(user: User | null): Promise<string> {
  const adminStatus = await isAdmin(user)
  return adminStatus ? '/admin/dashboard' : '/user/profile'
}
