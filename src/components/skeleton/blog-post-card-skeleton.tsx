/**
 * Skeleton loading state for BlogPostCard component
 */

import { Skeleton, SkeletonImage } from './skeleton'

export function BlogPostCardSkeleton() {
  return (
    <article className="rounded-lg shadow-lg overflow-hidden bg-white dark:bg-gray-800">
      <SkeletonImage aspectRatio="16/9" />
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-8 w-full mb-2" />
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3 mb-4" />
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-6 w-12" />
        </div>
      </div>
    </article>
  )
}

/**
 * Grid of blog post card skeletons
 */
export function BlogPostCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <BlogPostCardSkeleton key={i} />
      ))}
    </div>
  )
}
