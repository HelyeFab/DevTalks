/**
 * Bundle analysis utilities and performance budgets
 * Use these to monitor and enforce bundle size constraints
 */

/**
 * Performance budgets for different bundle types
 * These are aggressive targets for excellent performance
 */
export const PERFORMANCE_BUDGETS = {
  // Main bundle size limits (gzipped)
  mainBundle: {
    warning: 200 * 1024, // 200 KB
    error: 300 * 1024, // 300 KB
  },

  // Individual chunk size limits
  chunk: {
    warning: 100 * 1024, // 100 KB
    error: 150 * 1024, // 150 KB
  },

  // Total JavaScript size
  totalJs: {
    warning: 400 * 1024, // 400 KB
    error: 600 * 1024, // 600 KB
  },

  // CSS bundle size
  css: {
    warning: 50 * 1024, // 50 KB
    error: 100 * 1024, // 100 KB
  },

  // Image size (per image)
  image: {
    warning: 100 * 1024, // 100 KB
    error: 200 * 1024, // 200 KB
  },

  // Font size (total)
  fonts: {
    warning: 100 * 1024, // 100 KB
    error: 150 * 1024, // 150 KB
  },
} as const

/**
 * Dynamic import with error boundary
 * Use this wrapper for all dynamic imports to handle failures gracefully
 */
export function safeDynamicImport<T>(
  importFn: () => Promise<T>,
  fallback?: T
): Promise<T> {
  return importFn().catch((error) => {
    console.error('Dynamic import failed:', error)
    if (fallback) {
      return fallback
    }
    throw error
  })
}

/**
 * Check if a module should be dynamically imported based on viewport
 */
export function shouldLoadModule(element: HTMLElement | null): boolean {
  if (!element || typeof window === 'undefined') return false

  // Check if IntersectionObserver is supported
  if (!('IntersectionObserver' in window)) return true

  const rect = element.getBoundingClientRect()
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight

  // Load if within 2 viewports
  return rect.top < viewportHeight * 2
}

/**
 * Analyze bundle composition (client-side)
 */
export function analyzeBundleComposition() {
  if (typeof window === 'undefined' || !window.performance) {
    return null
  }

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]

  const analysis = {
    scripts: [] as Array<{ name: string; size: number; duration: number }>,
    styles: [] as Array<{ name: string; size: number; duration: number }>,
    images: [] as Array<{ name: string; size: number; duration: number }>,
    fonts: [] as Array<{ name: string; size: number; duration: number }>,
    other: [] as Array<{ name: string; size: number; duration: number }>,
    totalSize: 0,
    totalDuration: 0,
  }

  resources.forEach((resource) => {
    const size = resource.transferSize || 0
    const duration = resource.duration || 0
    const name = resource.name.split('/').pop() || resource.name

    const item = { name, size, duration }

    if (resource.initiatorType === 'script' || name.endsWith('.js')) {
      analysis.scripts.push(item)
    } else if (resource.initiatorType === 'css' || name.endsWith('.css')) {
      analysis.styles.push(item)
    } else if (resource.initiatorType === 'img' || /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(name)) {
      analysis.images.push(item)
    } else if (/\.(woff|woff2|ttf|otf|eot)$/i.test(name)) {
      analysis.fonts.push(item)
    } else {
      analysis.other.push(item)
    }

    analysis.totalSize += size
    analysis.totalDuration += duration
  })

  // Sort by size descending
  const sortBySize = (a: { size: number }, b: { size: number }) => b.size - a.size
  analysis.scripts.sort(sortBySize)
  analysis.styles.sort(sortBySize)
  analysis.images.sort(sortBySize)
  analysis.fonts.sort(sortBySize)

  return analysis
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Log bundle analysis to console (development only)
 */
export function logBundleAnalysis() {
  if (process.env.NODE_ENV !== 'development') return

  const analysis = analyzeBundleComposition()
  if (!analysis) return

  console.group('📦 Bundle Analysis')
  console.log('Total Size:', formatBytes(analysis.totalSize))
  console.log('Total Duration:', `${analysis.totalDuration.toFixed(2)}ms`)

  console.groupCollapsed(`📜 Scripts (${analysis.scripts.length})`)
  analysis.scripts.slice(0, 10).forEach(({ name, size, duration }) => {
    console.log(`${name}: ${formatBytes(size)} (${duration.toFixed(2)}ms)`)
  })
  console.groupEnd()

  console.groupCollapsed(`🎨 Styles (${analysis.styles.length})`)
  analysis.styles.forEach(({ name, size, duration }) => {
    console.log(`${name}: ${formatBytes(size)} (${duration.toFixed(2)}ms)`)
  })
  console.groupEnd()

  console.groupCollapsed(`🖼️  Images (${analysis.images.length})`)
  analysis.images.slice(0, 10).forEach(({ name, size, duration }) => {
    console.log(`${name}: ${formatBytes(size)} (${duration.toFixed(2)}ms)`)
  })
  console.groupEnd()

  console.groupCollapsed(`🔤 Fonts (${analysis.fonts.length})`)
  analysis.fonts.forEach(({ name, size, duration }) => {
    console.log(`${name}: ${formatBytes(size)} (${duration.toFixed(2)}ms)`)
  })
  console.groupEnd()

  console.groupEnd()
}
