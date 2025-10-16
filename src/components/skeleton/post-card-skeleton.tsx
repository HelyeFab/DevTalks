/**
 * Skeleton loading state for PostCard component
 */

import { Skeleton, SkeletonImage, SkeletonAvatar } from './skeleton'

export function PostCardSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden bg-card border border-border shadow-md">
      <div className="flex h-full">
        <div className="w-1/3">
          <SkeletonImage aspectRatio="1/1" />
        </div>
        <div className="w-2/3 p-4 flex flex-col justify-between">
          <div>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-5/6 mb-2" />
            <div className="flex gap-1 mb-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SkeletonAvatar size="sm" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Multiple post card skeletons for list views
 */
export function PostCardSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  )
}
