/**
 * Authentication and Authorization Module
 *
 * This module provides comprehensive authentication and authorization utilities
 * for the DevTalks Next.js application.
 *
 * @module auth
 */

// Export all auth utilities
export {
  verifyAuthToken,
  extractBearerToken,
  hasRole,
  isTokenValid,
  setUserClaims,
  promoteToModerator,
  promoteToAdmin,
  revokeUserTokens,
  disableUser,
  enableUser,
  getUserByUid,
  getUserByEmail,
  type AuthUser,
  type UserRole,
  type TokenVerificationResult
} from './auth-utils'

// Export all API auth utilities
export {
  withApiAuth,
  withAdminAuth,
  withModeratorAuth,
  getOptionalAuth,
  authenticateRequest,
  validateRequestBody,
  createApiError,
  createApiSuccess,
  handleCorsPreFlight,
  CORS_HEADERS,
  type AuthContext,
  type ApiAuthOptions
} from './api-auth'

// Export all rate limiting utilities
export {
  withRateLimit,
  applyRateLimit,
  createRateLimitResponse,
  resetRateLimit,
  getRateLimitStats,
  RateLimitPresets,
  rateLimitStore,
  type RateLimitOptions,
  type RateLimitResult
} from './rate-limit'

// Export all server-side auth utilities
export {
  authenticateServer,
  requireAuth,
  requireAdmin,
  requireModerator,
  getOptionalServerAuth,
  isAuthenticated,
  isAdmin,
  isModerator,
  getAuthToken,
  type ServerAuthResult
} from './server-auth'
