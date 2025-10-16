'use server'

import { getAdminAuth } from '@/lib/server/firebase-admin'
import { isUserAdmin } from '@/lib/server/admin-check'
import { DecodedIdToken } from 'firebase-admin/auth'
import logger from '@/lib/logger'

/**
 * User role types
 */
export type UserRole = 'admin' | 'moderator' | 'user'

/**
 * Authenticated user context
 */
export interface AuthUser {
  uid: string
  email: string | undefined
  name: string | undefined
  displayName: string | undefined
  photoURL: string | undefined
  role: UserRole
  isAdmin: boolean
  isModerator: boolean
  customClaims: Record<string, unknown>
}

/**
 * Token verification result
 */
export interface TokenVerificationResult {
  success: boolean
  user?: AuthUser
  error?: string
  errorCode?: 'TOKEN_EXPIRED' | 'TOKEN_INVALID' | 'TOKEN_REVOKED' | 'USER_DISABLED' | 'UNKNOWN'
}

/**
 * Verifies a Firebase ID token and returns user information
 *
 * @param idToken - The Firebase ID token to verify
 * @returns Token verification result with user data or error
 *
 * @example
 * ```typescript
 * const result = await verifyAuthToken(token)
 * if (result.success && result.user) {
 *   console.log('User:', result.user.email)
 * }
 * ```
 */
export async function verifyAuthToken(idToken: string): Promise<TokenVerificationResult> {
  try {
    if (!idToken || idToken.trim() === '') {
      return {
        success: false,
        error: 'Token is required',
        errorCode: 'TOKEN_INVALID'
      }
    }

    const auth = getAdminAuth()
    const decodedToken: DecodedIdToken = await auth.verifyIdToken(idToken, true)

    // Check if user is disabled
    const userRecord = await auth.getUser(decodedToken.uid)
    if (userRecord.disabled) {
      logger.warn('Attempt to authenticate with disabled user account', {
        uid: decodedToken.uid,
        email: decodedToken.email
      })
      return {
        success: false,
        error: 'User account is disabled',
        errorCode: 'USER_DISABLED'
      }
    }

    // Get admin status
    const isAdmin = await isUserAdmin(decodedToken.uid)

    // Check for moderator status in custom claims
    const isModerator = decodedToken.moderator === true || false

    // Determine user role
    let role: UserRole = 'user'
    if (isAdmin) {
      role = 'admin'
    } else if (isModerator) {
      role = 'moderator'
    }

    const authUser: AuthUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name ?? decodedToken.email?.split('@')[0],
      displayName: userRecord.displayName ?? undefined,
      photoURL: userRecord.photoURL ?? undefined,
      role,
      isAdmin,
      isModerator,
      customClaims: decodedToken
    }

    logger.debug('Token verified successfully', {
      uid: authUser.uid,
      email: authUser.email,
      role: authUser.role
    })

    return {
      success: true,
      user: authUser
    }
  } catch (error: unknown) {
    // Handle specific Firebase Auth errors
    if (error && typeof error === 'object' && 'code' in error) {
      const firebaseError = error as { code: string; message: string }

      switch (firebaseError.code) {
        case 'auth/id-token-expired':
          logger.info('Expired token verification attempt')
          return {
            success: false,
            error: 'Token has expired',
            errorCode: 'TOKEN_EXPIRED'
          }

        case 'auth/id-token-revoked':
          logger.warn('Revoked token verification attempt')
          return {
            success: false,
            error: 'Token has been revoked',
            errorCode: 'TOKEN_REVOKED'
          }

        case 'auth/invalid-id-token':
        case 'auth/argument-error':
          logger.info('Invalid token verification attempt')
          return {
            success: false,
            error: 'Invalid token',
            errorCode: 'TOKEN_INVALID'
          }

        default:
          logger.error('Token verification error', { error: firebaseError })
          return {
            success: false,
            error: 'Token verification failed',
            errorCode: 'UNKNOWN'
          }
      }
    }

    logger.error('Unexpected error during token verification', { error })
    return {
      success: false,
      error: 'An unexpected error occurred',
      errorCode: 'UNKNOWN'
    }
  }
}

/**
 * Checks if a user has a specific role
 *
 * @param user - The authenticated user
 * @param requiredRole - The role to check for
 * @returns True if user has the required role or higher privilege
 *
 * @example
 * ```typescript
 * if (hasRole(user, 'moderator')) {
 *   // User is moderator or admin
 * }
 * ```
 */
export function hasRole(user: AuthUser, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    user: 1,
    moderator: 2,
    admin: 3
  }

  return roleHierarchy[user.role] >= roleHierarchy[requiredRole]
}

/**
 * Extracts the Bearer token from an Authorization header
 *
 * @param authHeader - The Authorization header value
 * @returns The extracted token or null if invalid format
 *
 * @example
 * ```typescript
 * const token = extractBearerToken(request.headers.get('Authorization'))
 * if (token) {
 *   const result = await verifyAuthToken(token)
 * }
 * ```
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7).trim() // Remove 'Bearer ' prefix
  return token || null
}

/**
 * Validates that a token is not expired based on expiration time
 *
 * @param expirationTime - Token expiration time in seconds since epoch
 * @returns True if token is still valid (not expired)
 *
 * @example
 * ```typescript
 * const decodedToken = await auth.verifyIdToken(token, false)
 * if (!isTokenValid(decodedToken.exp)) {
 *   // Token is expired
 * }
 * ```
 */
export function isTokenValid(expirationTime: number): boolean {
  const currentTime = Math.floor(Date.now() / 1000)
  return currentTime < expirationTime
}

/**
 * Sets custom claims for a user (admin only)
 *
 * @param uid - User ID
 * @param claims - Custom claims to set
 * @throws Error if setting claims fails
 *
 * @example
 * ```typescript
 * await setUserClaims(userId, { moderator: true })
 * ```
 */
export async function setUserClaims(
  uid: string,
  claims: Record<string, unknown>
): Promise<void> {
  try {
    const auth = getAdminAuth()
    await auth.setCustomUserClaims(uid, claims)

    logger.info('Custom claims set successfully', {
      uid,
      claims: Object.keys(claims)
    })
  } catch (error) {
    logger.error('Failed to set custom claims', { uid, error })
    throw new Error('Failed to set user claims')
  }
}

/**
 * Promotes a user to moderator role
 *
 * @param uid - User ID to promote
 * @throws Error if promotion fails
 */
export async function promoteToModerator(uid: string): Promise<void> {
  await setUserClaims(uid, { moderator: true })
}

/**
 * Promotes a user to admin role
 *
 * @param uid - User ID to promote
 * @throws Error if promotion fails
 */
export async function promoteToAdmin(uid: string): Promise<void> {
  await setUserClaims(uid, { admin: true })
}

/**
 * Revokes all refresh tokens for a user, forcing them to re-authenticate
 *
 * @param uid - User ID
 * @throws Error if revocation fails
 *
 * @example
 * ```typescript
 * await revokeUserTokens(suspiciousUserId)
 * ```
 */
export async function revokeUserTokens(uid: string): Promise<void> {
  try {
    const auth = getAdminAuth()
    await auth.revokeRefreshTokens(uid)

    logger.warn('User tokens revoked', { uid })
  } catch (error) {
    logger.error('Failed to revoke user tokens', { uid, error })
    throw new Error('Failed to revoke tokens')
  }
}

/**
 * Disables a user account
 *
 * @param uid - User ID to disable
 * @throws Error if disabling fails
 *
 * @example
 * ```typescript
 * await disableUser(bannedUserId)
 * ```
 */
export async function disableUser(uid: string): Promise<void> {
  try {
    const auth = getAdminAuth()
    await auth.updateUser(uid, { disabled: true })

    logger.warn('User account disabled', { uid })
  } catch (error) {
    logger.error('Failed to disable user', { uid, error })
    throw new Error('Failed to disable user account')
  }
}

/**
 * Enables a previously disabled user account
 *
 * @param uid - User ID to enable
 * @throws Error if enabling fails
 */
export async function enableUser(uid: string): Promise<void> {
  try {
    const auth = getAdminAuth()
    await auth.updateUser(uid, { disabled: false })

    logger.info('User account enabled', { uid })
  } catch (error) {
    logger.error('Failed to enable user', { uid, error })
    throw new Error('Failed to enable user account')
  }
}

/**
 * Gets user information by UID
 *
 * @param uid - User ID
 * @returns User information or null if not found
 */
export async function getUserByUid(uid: string): Promise<AuthUser | null> {
  try {
    const auth = getAdminAuth()
    const userRecord = await auth.getUser(uid)

    const isAdmin = await isUserAdmin(uid)
    const isModerator = userRecord.customClaims?.moderator === true

    let role: UserRole = 'user'
    if (isAdmin) {
      role = 'admin'
    } else if (isModerator) {
      role = 'moderator'
    }

    return {
      uid: userRecord.uid,
      email: userRecord.email,
      name: userRecord.displayName ?? userRecord.email?.split('@')[0],
      displayName: userRecord.displayName ?? undefined,
      photoURL: userRecord.photoURL ?? undefined,
      role,
      isAdmin,
      isModerator,
      customClaims: userRecord.customClaims || {}
    }
  } catch (error) {
    logger.error('Failed to get user by UID', { uid, error })
    return null
  }
}

/**
 * Gets user information by email
 *
 * @param email - User email
 * @returns User information or null if not found
 */
export async function getUserByEmail(email: string): Promise<AuthUser | null> {
  try {
    const auth = getAdminAuth()
    const userRecord = await auth.getUserByEmail(email)

    return getUserByUid(userRecord.uid)
  } catch (error) {
    logger.error('Failed to get user by email', { email, error })
    return null
  }
}
