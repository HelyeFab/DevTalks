import { NextRequest, NextResponse } from 'next/server'
import { initAdmin } from '@/lib/firebase-admin'
import {
  withApiAuth,
  createApiError,
  withRateLimit,
  RateLimitPresets,
  type AuthContext
} from '@/lib/auth'

const { db } = initAdmin()

const POSTS_COLLECTION = 'blog_posts'
const UPVOTES_COLLECTION = 'upvotes'
// Consolidation: Using only subcollections for upvotes
// const POST_UPVOTES_COLLECTION = 'post_upvotes' // DEPRECATED - removed duplicate storage

type RouteContext = {
  params: Promise<{ postId: string }>
}

// Apply rate limiting and require authentication for upvoting
export const POST = withRateLimit(
  withApiAuth(
    async (request: NextRequest, context: RouteContext, authContext: AuthContext) => {
      console.log('\n--- Starting upvote operation ---')
      const resolvedParams = await context.params;
      const postId = resolvedParams.postId

      try {
        const userId = authContext.user.uid

        // Get the post document reference
        const postRef = db.collection(POSTS_COLLECTION).doc(postId)
        const postDoc = await postRef.get()

        if (!postDoc.exists) {
          return createApiError('Post not found', 404)
        }

        // Get the upvote document from the subcollection (single source of truth)
        const upvoteRef = postRef.collection(UPVOTES_COLLECTION).doc(userId)
        const upvoteDoc = await upvoteRef.get()

        let newUpvoteTotal = 0
        let isUpvoted = false

        // Run the upvote operation in a transaction
        await db.runTransaction(async (transaction) => {
          if (upvoteDoc.exists) {
            // User has already upvoted, remove the upvote
            transaction.delete(upvoteRef)

            const currentUpvotes = postDoc.data()?.upvotes || 0
            newUpvoteTotal = Math.max(0, currentUpvotes - 1) // Prevent negative upvotes

            transaction.update(postRef, {
              upvotes: newUpvoteTotal
            })

            isUpvoted = false
          } else {
            // User hasn't upvoted yet, add the upvote
            const upvoteData = {
              userId,
              postId,
              createdAt: new Date().toISOString()
            }

            transaction.create(upvoteRef, upvoteData)

            newUpvoteTotal = (postDoc.data()?.upvotes || 0) + 1

            transaction.update(postRef, {
              upvotes: newUpvoteTotal
            })

            isUpvoted = true
          }
        })

        // Return the new upvote status
        return NextResponse.json({
          upvoted: isUpvoted,
          upvotes: newUpvoteTotal
        })
      } catch (error) {
        console.error('Error in upvote operation:', error)
        return createApiError(
          error instanceof Error ? error.message : 'Failed to process upvote',
          500
        )
      }
    },
    { requireAuth: true }
  ),
  RateLimitPresets.moderate
)
