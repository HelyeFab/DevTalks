import { NextResponse } from 'next/server';

/**
 * Cache control durations in seconds
 */
export const CACHE_DURATIONS = {
  NO_CACHE: 0,
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 1 day
};

/**
 * Cache control header options
 */
export interface CacheControlOptions {
  /**
   * Max-age in seconds for the browser cache
   */
  maxAge?: number;

  /**
   * Whether the response should be considered stale after max-age
   */
  staleWhileRevalidate?: number;

  /**
   * Whether the response is private (user-specific) or public (shared)
   */
  isPrivate?: boolean;

  /**
   * Whether the response must be revalidated when max-age expires
   */
  mustRevalidate?: boolean;
}

/**
 * Add cache control headers to a Next.js response
 *
 * @param response The Next.js response object
 * @param options Cache control options
 * @returns The response with cache control headers
 */
export function addCacheControl(
  response: NextResponse,
  options: CacheControlOptions = {}
): NextResponse {
  const {
    maxAge = CACHE_DURATIONS.NO_CACHE,
    staleWhileRevalidate = 0,
    isPrivate = false,
    mustRevalidate = true,
  } = options;

  // Build the Cache-Control header
  const parts: string[] = [];

  // Private or public
  parts.push(isPrivate ? 'private' : 'public');

  // Max-age directive
  parts.push(`max-age=${maxAge}`);

  // Stale-while-revalidate directive if > 0
  if (staleWhileRevalidate > 0) {
    parts.push(`stale-while-revalidate=${staleWhileRevalidate}`);
  }

  // Must-revalidate directive
  if (mustRevalidate) {
    parts.push('must-revalidate');
  }

  // Set headers
  response.headers.set('Cache-Control', parts.join(', '));

  return response;
}

/**
 * Create a cached response for successful API responses
 *
 * @param data The data to include in the response
 * @param options Cache control options
 * @returns A Next.js response with appropriate cache headers
 */
export function createCachedResponse(
  data: any,
  options: CacheControlOptions = {}
): NextResponse {
  const response = NextResponse.json(data);
  return addCacheControl(response, options);
}

/**
 * Create a standard cache control setting for public API data
 */
export function getCacheSettingsForPublicData(): CacheControlOptions {
  return {
    maxAge: CACHE_DURATIONS.MEDIUM,
    staleWhileRevalidate: CACHE_DURATIONS.LONG,
    isPrivate: false,
    mustRevalidate: false
  };
}

/**
 * Create a standard cache control setting for private user data
 */
export function getCacheSettingsForUserData(): CacheControlOptions {
  return {
    maxAge: CACHE_DURATIONS.SHORT,
    isPrivate: true,
    mustRevalidate: true
  };
}
