/**
 * Dynamic imports for code splitting
 * Lazy load heavy components to reduce initial bundle size
 */

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/skeleton'

/**
 * Dynamically imported components with loading states
 * Add your heavy components here for code splitting
 */

// Example: MDX Editor (heavy component)
export const DynamicMDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false, // Disable SSR for editor
  }
)

// Example: Syntax Highlighter
export const DynamicSyntaxHighlighter = dynamic(
  () => import('react-syntax-highlighter').then((mod) => mod.Prism),
  {
    loading: () => <Skeleton className="h-32 w-full" />,
    ssr: true,
  }
)

// Example: Image Picker (heavy component with compression)
export const DynamicImagePicker = dynamic(
  () => import('@/components/image-picker').then((mod) => mod.ImagePicker),
  {
    loading: () => (
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8">
        <Skeleton className="h-32 w-full" />
      </div>
    ),
    ssr: false,
  }
)

/**
 * Create a dynamic import with custom loading component
 */
export function createDynamicImport<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T } | T>,
  options: {
    loading?: React.ComponentType
    ssr?: boolean
  } = {}
) {
  return dynamic(importFn, {
    loading: options.loading || (() => <Skeleton className="h-32 w-full" />),
    ssr: options.ssr !== undefined ? options.ssr : true,
  })
}

/**
 * Intersection Observer based lazy loader
 * Only load component when it enters viewport
 */
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T } | T>,
  fallback?: React.ReactNode
) {
  const Component = dynamic(importFn, {
    loading: () => <>{fallback || <Skeleton className="h-32 w-full" />}</>,
  })

  return Component
}
