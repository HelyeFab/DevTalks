import { NextRequest, NextResponse } from 'next/server'
import logger from '@/lib/logger'

/**
 * Rate limit entry for tracking request counts
 */
interface RateLimitEntry {
  count: number
  resetTime: number
  firstRequestTime: number
}

/**
 * In-memory rate limit store
 * In production, this should be replaced with Redis or a similar distributed cache
 */
class RateLimitStore {
  private store: Map<string, RateLimitEntry>
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    this.store = new Map()
    this.startCleanup()
  }

  /**
   * Starts periodic cleanup of expired entries
   */
  private startCleanup(): void {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  /**
   * Removes expired entries from the store
   */
  private cleanup(): void {
    const now = Date.now()
    let removed = 0

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key)
        removed++
      }
    }

    if (removed > 0) {
      logger.debug('Rate limit store cleanup', {
        removed,
        remaining: this.store.size
      })
    }
  }

  /**
   * Gets or creates a rate limit entry
   */
  get(key: string, windowMs: number): RateLimitEntry {
    const now = Date.now()
    const entry = this.store.get(key)

    // If no entry exists or it's expired, create a new one
    if (!entry || now > entry.resetTime) {
      const newEntry: RateLimitEntry = {
        count: 0,
        resetTime: now + windowMs,
        firstRequestTime: now
      }
      this.store.set(key, newEntry)
      return newEntry
    }

    return entry
  }

  /**
   * Increments the request count for a key
   */
  increment(key: string, windowMs: number): RateLimitEntry {
    const entry = this.get(key, windowMs)
    entry.count++
    this.store.set(key, entry)
    return entry
  }

  /**
   * Resets rate limit for a specific key
   */
  reset(key: string): void {
    this.store.delete(key)
  }

  /**
   * Gets the current size of the store
   */
  getSize(): number {
    return this.store.size
  }

  /**
   * Stops the cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

// Global rate limit store instance
const rateLimitStore = new RateLimitStore()

/**
 * Rate limit configuration options
 */
export interface RateLimitOptions {
  /**
   * Maximum number of requests allowed in the time window
   * @default 60
   */
  limit?: number

  /**
   * Time window in milliseconds
   * @default 60000 (1 minute)
   */
  windowMs?: number

  /**
   * Custom error message when rate limit is exceeded
   */
  message?: string

  /**
   * Custom identifier for the rate limit (overrides default key generation)
   */
  keyPrefix?: string

  /**
   * Whether to use user ID for rate limiting (if available)
   * @default true
   */
  useUserId?: boolean

  /**
   * Whether to use IP address for rate limiting
   * @default true
   */
  useIpAddress?: boolean

  /**
   * Skip rate limiting for specific conditions
   */
  skip?: (request: NextRequest) => boolean

  /**
   * Only enable rate limiting in production
   * @default true
   */
  productionOnly?: boolean
}

/**
 * Generates a rate limit key based on request information
 *
 * @param request - The Next.js request object
 * @param options - Rate limit options
 * @param userId - Optional user ID
 * @returns Rate limit key
 */
function generateRateLimitKey(
  request: NextRequest,
  options: RateLimitOptions,
  userId?: string
): string {
  const parts: string[] = []

  // Add key prefix if provided
  if (options.keyPrefix) {
    parts.push(options.keyPrefix)
  }

  // Add user ID if available and enabled
  if (options.useUserId !== false && userId) {
    parts.push(`user:${userId}`)
  }

  // Add IP address if enabled
  if (options.useIpAddress !== false) {
    const ip = getClientIp(request)
    parts.push(`ip:${ip}`)
  }

  // Add route path
  const path = request.nextUrl.pathname
  parts.push(`path:${path}`)

  return parts.join(':')
}

/**
 * Extracts client IP address from request
 *
 * @param request - The Next.js request object
 * @returns Client IP address
 */
function getClientIp(request: NextRequest): string {
  // Try various headers that might contain the client IP
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }

  // Fallback to a placeholder if no IP is found
  return 'unknown'
}

/**
 * Rate limiting result
 */
export interface RateLimitResult {
  /**
   * Whether the request is allowed
   */
  allowed: boolean

  /**
   * Current request count
   */
  current: number

  /**
   * Maximum allowed requests
   */
  limit: number

  /**
   * Time until rate limit resets (in seconds)
   */
  resetIn: number

  /**
   * Number of remaining requests
   */
  remaining: number
}

/**
 * Applies rate limiting to a request
 *
 * @param request - The Next.js request object
 * @param options - Rate limit configuration
 * @param userId - Optional user ID for user-based rate limiting
 * @returns Rate limit result
 *
 * @example
 * ```typescript
 * const result = applyRateLimit(request, { limit: 10, windowMs: 60000 })
 * if (!result.allowed) {
 *   return NextResponse.json(
 *     { error: 'Too many requests' },
 *     { status: 429 }
 *   )
 * }
 * ```
 */
export function applyRateLimit(
  request: NextRequest,
  options: RateLimitOptions = {},
  userId?: string
): RateLimitResult {
  const {
    limit = 60,
    windowMs = 60 * 1000,
    productionOnly = true,
    skip
  } = options

  // Skip rate limiting in development if productionOnly is true
  if (productionOnly && process.env.NODE_ENV !== 'production') {
    return {
      allowed: true,
      current: 0,
      limit,
      resetIn: 0,
      remaining: limit
    }
  }

  // Skip if custom skip function returns true
  if (skip && skip(request)) {
    return {
      allowed: true,
      current: 0,
      limit,
      resetIn: 0,
      remaining: limit
    }
  }

  // Generate rate limit key
  const key = generateRateLimitKey(request, options, userId)

  // Increment and get current entry
  const entry = rateLimitStore.increment(key, windowMs)

  // Calculate remaining time until reset
  const now = Date.now()
  const resetIn = Math.ceil((entry.resetTime - now) / 1000)

  // Check if limit is exceeded
  const allowed = entry.count <= limit
  const remaining = Math.max(0, limit - entry.count)

  // Log rate limit check
  if (!allowed) {
    logger.warn('Rate limit exceeded', {
      key,
      count: entry.count,
      limit,
      path: request.nextUrl.pathname,
      method: request.method,
      ip: getClientIp(request),
      userId
    })
  }

  return {
    allowed,
    current: entry.count,
    limit,
    resetIn,
    remaining
  }
}

/**
 * Creates a rate limit response with appropriate headers
 *
 * @param result - Rate limit result
 * @param customMessage - Custom error message
 * @returns NextResponse with rate limit headers
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  customMessage?: string
): NextResponse {
  const message = customMessage || 'Too many requests, please try again later'

  return NextResponse.json(
    {
      error: message,
      retryAfter: result.resetIn
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetIn.toString(),
        'Retry-After': result.resetIn.toString()
      }
    }
  )
}

/**
 * Middleware wrapper that applies rate limiting to API routes
 *
 * @param handler - The route handler function
 * @param options - Rate limit configuration
 * @returns Wrapped handler with rate limiting
 *
 * @example
 * ```typescript
 * export const POST = withRateLimit(
 *   async (request) => {
 *     return NextResponse.json({ success: true })
 *   },
 *   { limit: 10, windowMs: 60000 }
 * )
 * ```
 */
export function withRateLimit<T = unknown>(
  handler: (request: NextRequest, context: T) => Promise<NextResponse>,
  options: RateLimitOptions = {}
): (request: NextRequest, context: T) => Promise<NextResponse> {
  return async (request: NextRequest, context: T): Promise<NextResponse> => {
    try {
      // Extract user ID from auth header if available
      let userId: string | undefined
      const authHeader = request.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        // We won't verify the token here, just extract a basic identifier
        // Full verification is done by auth middleware
        try {
          const token = authHeader.substring(7)
          // Use token as a basic identifier (first 20 chars for uniqueness)
          userId = token.substring(0, 20)
        } catch {
          // Ignore errors, proceed without user ID
        }
      }

      // Apply rate limiting
      const result = applyRateLimit(request, options, userId)

      // If rate limit exceeded, return error response
      if (!result.allowed) {
        return createRateLimitResponse(result, options.message)
      }

      // Call the handler
      const response = await handler(request, context)

      // Add rate limit headers to successful responses
      const headers = new Headers(response.headers)
      headers.set('X-RateLimit-Limit', result.limit.toString())
      headers.set('X-RateLimit-Remaining', result.remaining.toString())
      headers.set('X-RateLimit-Reset', result.resetIn.toString())

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      })
    } catch (error) {
      logger.error('Error in rate limit middleware', {
        error,
        method: request.method,
        path: request.nextUrl.pathname
      })

      // Let the error propagate or return error response
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Preset rate limit configurations for common use cases
 */
export const RateLimitPresets = {
  /**
   * Strict rate limit for sensitive operations (e.g., password reset)
   * 5 requests per 15 minutes
   */
  strict: {
    limit: 5,
    windowMs: 15 * 60 * 1000
  },

  /**
   * Moderate rate limit for write operations (e.g., creating posts)
   * 20 requests per minute
   */
  moderate: {
    limit: 20,
    windowMs: 60 * 1000
  },

  /**
   * Generous rate limit for read operations (e.g., fetching data)
   * 100 requests per minute
   */
  generous: {
    limit: 100,
    windowMs: 60 * 1000
  },

  /**
   * Very strict rate limit for authentication attempts
   * 3 requests per 5 minutes
   */
  auth: {
    limit: 3,
    windowMs: 5 * 60 * 1000
  },

  /**
   * API rate limit for general API usage
   * 60 requests per minute
   */
  api: {
    limit: 60,
    windowMs: 60 * 1000
  }
} as const

/**
 * Resets rate limit for a specific key
 * Useful for testing or manual intervention
 *
 * @param request - The Next.js request object
 * @param options - Rate limit options (to generate the same key)
 * @param userId - Optional user ID
 */
export function resetRateLimit(
  request: NextRequest,
  options: RateLimitOptions = {},
  userId?: string
): void {
  const key = generateRateLimitKey(request, options, userId)
  rateLimitStore.reset(key)
  logger.info('Rate limit reset', { key })
}

/**
 * Gets rate limit store statistics
 * Useful for monitoring
 *
 * @returns Store statistics
 */
export function getRateLimitStats(): { storeSize: number } {
  return {
    storeSize: rateLimitStore.getSize()
  }
}

// Export the store for advanced usage
export { rateLimitStore }
