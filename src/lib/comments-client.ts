import type { Comment, CommentSortOption } from '@/types/comment'

/**
 * Sort comments by different criteria (client-side version)
 */
export function sortComments(
  comments: Comment[],
  sortBy: CommentSortOption
): Comment[] {
  const sorted = [...comments]

  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    case 'oldest':
      return sorted.sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    case 'most-liked':
      return sorted.sort((a, b) => {
        const aLikes = a.reactions?.likes?.length || 0
        const bLikes = b.reactions?.likes?.length || 0
        return bLikes - aLikes
      })
    default:
      return sorted
  }
}
