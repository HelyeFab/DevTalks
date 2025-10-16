/**
 * Caching utilities and strategies
 * Implements various caching patterns for optimal performance
 */

/**
 * Cache durations in seconds
 */
export const CACHE_DURATIONS = {
  // Static content - cache for 1 year
  STATIC: 31536000,
  // Images - cache for 1 year
  IMAGE: 31536000,
  // API responses - cache for 5 minutes
  API: 300,
  // Page content - cache for 1 hour
  PAGE: 3600,
  // Dynamic content - cache for 5 minutes
  DYNAMIC: 300,
  // Revalidate after 1 minute
  REVALIDATE_SHORT: 60,
  // Revalidate after 1 hour
  REVALIDATE_MEDIUM: 3600,
  // Revalidate after 1 day
  REVALIDATE_LONG: 86400,
} as const

/**
 * Generate cache control header
 */
export function getCacheControl(
  maxAge: number,
  options: {
    public?: boolean
    immutable?: boolean
    staleWhileRevalidate?: number
    mustRevalidate?: boolean
  } = {}
): string {
  const {
    public: isPublic = true,
    immutable = false,
    staleWhileRevalidate,
    mustRevalidate = false,
  } = options

  const parts = [
    isPublic ? 'public' : 'private',
    `max-age=${maxAge}`,
  ]

  if (immutable) {
    parts.push('immutable')
  }

  if (mustRevalidate) {
    parts.push('must-revalidate')
  }

  if (staleWhileRevalidate !== undefined) {
    parts.push(`stale-while-revalidate=${staleWhileRevalidate}`)
  }

  return parts.join(', ')
}

/**
 * ISR (Incremental Static Regeneration) configuration presets
 */
export const ISR_CONFIG = {
  // Blog posts - revalidate every hour
  BLOG_POST: {
    revalidate: CACHE_DURATIONS.REVALIDATE_MEDIUM,
  },
  // Blog list - revalidate every 5 minutes
  BLOG_LIST: {
    revalidate: CACHE_DURATIONS.REVALIDATE_SHORT * 5,
  },
  // Projects - revalidate every day
  PROJECT: {
    revalidate: CACHE_DURATIONS.REVALIDATE_LONG,
  },
  // User profiles - revalidate every 5 minutes
  PROFILE: {
    revalidate: CACHE_DURATIONS.REVALIDATE_SHORT * 5,
  },
  // Static pages - revalidate every day
  STATIC_PAGE: {
    revalidate: CACHE_DURATIONS.REVALIDATE_LONG,
  },
  // Dynamic content - revalidate every minute
  DYNAMIC: {
    revalidate: CACHE_DURATIONS.REVALIDATE_SHORT,
  },
} as const

/**
 * Client-side cache with TTL
 */
export class ClientCache<T> {
  private cache = new Map<string, { data: T; expiry: number }>()

  constructor(private defaultTTL: number = 60000) {} // Default 1 minute

  set(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
    })
  }

  get(key: string): T | null {
    const item = this.cache.get(key)

    if (!item) {
      return null
    }

    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    // Clean expired items
    const now = Date.now()
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiry) {
        this.cache.delete(key)
      }
    }
    return this.cache.size
  }
}

/**
 * Create a cache instance for API responses
 */
export const apiCache = new ClientCache(300000) // 5 minutes

/**
 * Memoization decorator for expensive functions
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: {
    maxAge?: number
    maxSize?: number
    keyGenerator?: (...args: Parameters<T>) => string
  } = {}
): T {
  const { maxAge = 60000, maxSize = 100, keyGenerator = (...args) => JSON.stringify(args) } = options

  const cache = new Map<string, { value: ReturnType<T>; expiry: number }>()

  return ((...args: Parameters<T>) => {
    const key = keyGenerator(...args)
    const cached = cache.get(key)

    if (cached && Date.now() < cached.expiry) {
      return cached.value
    }

    const value = fn(...args)

    // Limit cache size
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value
      cache.delete(firstKey)
    }

    cache.set(key, {
      value,
      expiry: Date.now() + maxAge,
    })

    return value
  }) as T
}

/**
 * Cache API response with stale-while-revalidate pattern
 */
export async function fetchWithSWR<T>(
  url: string,
  options: RequestInit = {},
  cacheTime = 300000 // 5 minutes
): Promise<T> {
  const cacheKey = `${url}-${JSON.stringify(options)}`

  // Check cache first
  const cached = apiCache.get(cacheKey)
  if (cached) {
    return cached as T
  }

  // Fetch fresh data
  const response = await fetch(url, options)
  const data = await response.json()

  // Store in cache
  apiCache.set(cacheKey, data, cacheTime)

  return data
}

/**
 * Prefetch and cache data
 */
export function prefetchData(url: string, options: RequestInit = {}): void {
  if (typeof window === 'undefined') return

  // Use requestIdleCallback if available
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      fetch(url, options).catch(() => {
        // Silently fail - prefetch is optional
      })
    })
  } else {
    setTimeout(() => {
      fetch(url, options).catch(() => {
        // Silently fail - prefetch is optional
      })
    }, 1)
  }
}
