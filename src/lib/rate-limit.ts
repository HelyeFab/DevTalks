import { NextRequest, NextResponse } from 'next/server';
import logger from './logger';

// Simple in-memory cache for rate limiting
// This would be replaced with Redis or similar in production
const rateLimitCache: Record<string, { count: number; timestamp: number }> = {};

/**
 * Calculate a rate limit key from request information
 */
function getRateLimitKey(request: NextRequest, userId?: string): string {
  const ip = request.headers.get('x-forwarded-for') || 'unknown-ip';
  const path = new URL(request.url).pathname;

  // If we have a user ID, use that for more targeted rate limiting
  // Otherwise use the IP to avoid anonymous abuse
  return userId
    ? `${userId}:${path}`
    : `${ip}:${path}`;
}

/**
 * Clean up expired rate limit entries
 * @param windowMs Timeframe in milliseconds for rate limiting window
 */
function cleanUpOldEntries(windowMs: number): void {
  const now = Date.now();
  Object.keys(rateLimitCache).forEach(key => {
    if (now - rateLimitCache[key].timestamp > windowMs) {
      delete rateLimitCache[key];
    }
  });
}

/**
 * Rate limiting middleware function
 *
 * @param request The Next.js request
 * @param options Configuration options
 * @returns NextResponse or undefined to allow the request to proceed
 */
export function rateLimit(
  request: NextRequest,
  {
    userId,
    limit = 60,
    windowMs = 60 * 1000, // 1 minute by default
    message = 'Too many requests, please try again later.'
  }: {
    userId?: string;
    limit?: number;
    windowMs?: number;
    message?: string;
  } = {}
): NextResponse | undefined {
  // Only apply rate limiting to production to facilitate local development
  if (process.env.NODE_ENV !== 'production') {
    return undefined;
  }

  // Clean up old entries periodically
  if (Math.random() < 0.01) { // 1% chance of cleanup per request
    cleanUpOldEntries(windowMs);
  }

  const key = getRateLimitKey(request, userId);
  const now = Date.now();

  // Initialize if this is the first request for this key
  if (!rateLimitCache[key]) {
    rateLimitCache[key] = { count: 0, timestamp: now };
  }

  // Reset count if outside window
  if (now - rateLimitCache[key].timestamp > windowMs) {
    rateLimitCache[key] = { count: 0, timestamp: now };
  }

  // Increment counter
  rateLimitCache[key].count++;

  // If over limit, return a 429 response
  if (rateLimitCache[key].count > limit) {
    logger.warn(`Rate limit exceeded for key: ${key}`, {
      key, count: rateLimitCache[key].count, limit
    });

    return NextResponse.json(
      { error: message },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil(windowMs / 1000).toString()
        }
      }
    );
  }

  // If under limit, return undefined to allow the request to proceed
  return undefined;
}

/**
 * Higher-order function to apply rate limiting to API routes
 */
export function withRateLimit(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  options: {
    limit?: number;
    windowMs?: number;
    message?: string;
    getUserId?: (request: NextRequest) => Promise<string | undefined>;
  } = {}
) {
  return async function rateLimitedHandler(
    request: NextRequest,
    ...args: any[]
  ): Promise<NextResponse> {
    try {
      // Try to get userId if a function was provided
      let userId: string | undefined;
      if (options.getUserId) {
        userId = await options.getUserId(request);
      }

      // Apply rate limiting
      const rateLimitResponse = rateLimit(request, {
        ...options,
        userId
      });

      // If rate limiting was applied, return that response
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      // Otherwise, proceed with the original handler
      return await handler(request, ...args);
    } catch (error) {
      logger.error('Error in rate limit middleware', { error });
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}
