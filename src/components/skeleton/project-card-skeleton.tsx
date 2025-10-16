/**
 * Skeleton loading state for ProjectCard component
 */

import { Skeleton, SkeletonImage } from './skeleton'

export function ProjectCardSkeleton() {
  return (
    <div className="rounded-lg shadow-lg overflow-hidden bg-white dark:bg-gray-800">
      <SkeletonImage aspectRatio="16/9" />
      <div className="p-6">
        <Skeleton className="h-8 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-4" />
        <div className="flex flex-wrap gap-2 mb-4">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-5 rounded" />
        </div>
      </div>
    </div>
  )
}

/**
 * Grid of project card skeletons
 */
export function ProjectCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  )
}
