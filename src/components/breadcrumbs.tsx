/**
 * Breadcrumbs Component
 * Displays navigation breadcrumbs with Schema.org structured data
 */

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { generateBreadcrumbSchema, toJsonLd } from '@/lib/seo/schema'

export interface BreadcrumbItem {
  name: string
  url: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

// Server Component - no interactivity needed, just renders navigation links
export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  // Always include Home as first item
  const allItems = [{ name: 'Home', url: '/' }, ...items]
  const uniqueItems = allItems.filter((item, index, array) =>
    array.findIndex((entry) => entry.url === item.url) === index
  )

  // Generate Schema.org JSON-LD
  const schema = generateBreadcrumbSchema(uniqueItems)
  const jsonLd = toJsonLd(schema)

  return (
    <>
      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />

      {/* Visual breadcrumb navigation */}
      <nav
        aria-label="Breadcrumb"
        className={`flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 ${className}`}
      >
        {uniqueItems.map((item, index) => {
          const isLast = index === uniqueItems.length - 1
          const isHome = index === 0

          return (
            <div key={item.url} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
              )}

              {isLast ? (
                <span
                  className="font-medium text-gray-900 dark:text-gray-100"
                  aria-current="page"
                >
                  {isHome ? <Home className="w-4 h-4" /> : item.name}
                </span>
              ) : (
                <Link
                  href={item.url}
                  className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  {isHome ? <Home className="w-4 h-4" /> : item.name}
                </Link>
              )}
            </div>
          )
        })}
      </nav>
    </>
  )
}

/**
 * Simple breadcrumb generator from path
 */
export function generateBreadcrumbsFromPath(path: string): BreadcrumbItem[] {
  const segments = path.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []

  let currentPath = ''
  segments.forEach((segment) => {
    currentPath += `/${segment}`
    const name = segment
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    breadcrumbs.push({
      name,
      url: currentPath,
    })
  })

  return breadcrumbs
}
