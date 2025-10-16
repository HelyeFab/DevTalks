/**
 * Image optimization utilities
 * Helpers for optimizing images across the application
 */

/**
 * Generate blur placeholder data URL
 * This creates a small, blurred version of the image for loading states
 */
export function generateBlurDataURL(width = 10, height = 10): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <filter id="b" color-interpolation-filters="sRGB">
        <feGaussianBlur stdDeviation="20" />
        <feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 100 -1" result="s" />
        <feFlood x="0" y="0" width="100%" height="100%" />
        <feComposite operator="out" in="s" />
        <feComposite in2="SourceGraphic" />
        <feGaussianBlur stdDeviation="20" />
      </filter>
      <rect width="100%" height="100%" fill="#ddd" />
      <rect width="100%" height="100%" filter="url(#b)" opacity="0.5" />
    </svg>
  `

  const base64 = Buffer.from(svg).toString('base64')
  return `data:image/svg+xml;base64,${base64}`
}

/**
 * Default blur placeholder for light mode
 */
export const DEFAULT_BLUR_DATA_URL = generateBlurDataURL()

/**
 * Generate shimmer placeholder
 * Creates an animated shimmer effect for loading
 */
export function generateShimmerDataURL(width = 700, height = 475): string {
  const shimmer = (w: number, h: number) => `
    <svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <linearGradient id="g">
          <stop stop-color="#f6f7f8" offset="0%" />
          <stop stop-color="#edeef1" offset="20%" />
          <stop stop-color="#f6f7f8" offset="40%" />
          <stop stop-color="#f6f7f8" offset="100%" />
        </linearGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="#f6f7f8" />
      <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
      <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
    </svg>
  `

  const toBase64 = (str: string) =>
    typeof window === 'undefined'
      ? Buffer.from(str).toString('base64')
      : window.btoa(str)

  return `data:image/svg+xml;base64,${toBase64(shimmer(width, height))}`
}

/**
 * Get optimized image props for Next Image component
 */
interface OptimizedImageProps {
  src: string
  alt: string
  priority?: boolean
  sizes?: string
  fill?: boolean
  width?: number
  height?: number
}

export function getOptimizedImageProps({
  src,
  alt,
  priority = false,
  sizes,
  fill = false,
  width,
  height,
}: OptimizedImageProps) {
  const baseProps = {
    src,
    alt,
    quality: 85, // Good balance between quality and size
    placeholder: 'blur' as const,
    blurDataURL: generateShimmerDataURL(),
  }

  if (fill) {
    return {
      ...baseProps,
      fill: true,
      sizes: sizes || '100vw',
      priority,
    }
  }

  return {
    ...baseProps,
    width: width || 800,
    height: height || 600,
    sizes,
    priority,
  }
}

/**
 * Image loader for external images
 * Useful for images from CDNs or external sources
 */
export function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  // If it's a Firebase Storage URL or external CDN, return as-is
  if (src.startsWith('https://firebasestorage.googleapis.com') ||
      src.startsWith('https://lh3.googleusercontent.com')) {
    return src
  }

  // For local images, let Next.js handle optimization
  return src
}

/**
 * Preload critical images
 */
export function preloadImage(src: string, imageSrcSet?: string) {
  if (typeof window === 'undefined') return

  const link = document.createElement('link')
  link.rel = 'preload'
  link.as = 'image'
  link.href = src

  if (imageSrcSet) {
    link.imageSrcset = imageSrcSet
  }

  document.head.appendChild(link)
}

/**
 * Calculate aspect ratio from dimensions
 */
export function calculateAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
  const divisor = gcd(width, height)
  return `${width / divisor}/${height / divisor}`
}

/**
 * Get responsive sizes attribute based on breakpoints
 */
export function getResponsiveSizes(
  type: 'full' | 'half' | 'third' | 'quarter' | 'hero' = 'full'
): string {
  const sizeMap = {
    full: '100vw',
    half: '(max-width: 768px) 100vw, 50vw',
    third: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    quarter: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw',
    hero: '100vw',
  }

  return sizeMap[type]
}
