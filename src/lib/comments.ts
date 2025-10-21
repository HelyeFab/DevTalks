import type {
  Comment,
  CreateCommentData,
  UpdateCommentData,
  ReportCommentData,
  CommentSortOption
} from '@/types/comment'
import { initAdmin } from './firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

const POSTS_COLLECTION = 'blog_posts'
const COMMENTS_COLLECTION = 'comments'
const REPORTS_COLLECTION = 'comment_reports'

// Don't initialize db at module level as it won't pick up changes to the global store
// Instead, get a fresh reference in each function

export async function getCommentsByPostId(postId: string): Promise<Comment[]> {
  console.log('Getting comments for post:', postId)

  // Get a fresh reference to the database
  const { adminDb: db } = initAdmin()

  // Validate postId
  if (!postId || typeof postId !== 'string') {
    throw new Error('Invalid post ID');
  }

  try {
    // First check if the post exists
    const postRef = db.collection(POSTS_COLLECTION).doc(postId);
    const postDoc = await postRef.get();

    if (!postDoc.exists) {
      console.log('Post not found:', postId);
      return []; // Return empty array for non-existent posts
    }

    // Get all comments for the post from top-level comments collection
    console.log('Creating query for comments collection...')
    const commentsRef = db.collection(COMMENTS_COLLECTION)
    const commentsQuery = commentsRef
      .where('postId', '==', postId)
      .orderBy('createdAt', 'desc')

    console.log('Executing query...')
    const commentsSnapshot = await commentsQuery.get()
    console.log('Found', commentsSnapshot.size, 'total comments')

    // Separate top-level comments and replies
    const topLevelComments: Comment[] = []
    const repliesMap = new Map<string, Comment[]>()

    commentsSnapshot.forEach((doc) => {
      try {
        const data = doc.data()
        const comment = {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null
        } as Comment

        if (data.parentId) {
          const replies = repliesMap.get(data.parentId) || []
          replies.push(comment)
          repliesMap.set(data.parentId, replies)
        } else {
          topLevelComments.push(comment)
        }
      } catch (docError) {
        console.error('Error processing comment document:', docError);
        // Skip this comment but continue processing others
      }
    })

    // Sort comments and attach replies
    const sortedComments = topLevelComments.map(comment => ({
      ...comment,
      replies: (repliesMap.get(comment.id) || [])
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    }))

    console.log('Processed comments:', {
      topLevel: topLevelComments.length,
      withReplies: sortedComments.length
    })

    return sortedComments
  } catch (error) {
    console.error('Error in getCommentsByPostId:', error instanceof Error ? error.message : 'Unknown error')
    throw error
  }
}

export async function createComment(
  userId: string,
  author: { name: string; email: string; image?: string },
  data: CreateCommentData
): Promise<Comment> {
  try {
    // Get a fresh reference to the database
    const { adminDb: db, isAvailable } = initAdmin()

    if (!isAvailable || !db) {
      throw new Error('Firebase Admin is not available. Please check your Firebase configuration.')
    }

    const commentData = {
      content: data.content.trim(),
      postId: data.postId,
      userId,
      author,
      createdAt: new Date(),
      updatedAt: new Date(),
      parentId: data.parentId || null
    }

    console.log('Creating comment with data:', {
      ...commentData,
      content: commentData.content.substring(0, 20) + '...',
      author: {
        name: author.name,
        image: author.image,
        email: author.email
      }
    })

    // Add to top-level comments collection
    const docRef = await db.collection(COMMENTS_COLLECTION).add(commentData)
    const docSnap = await docRef.get()
    const createdAt = new Date().toISOString()
    const _docData = docSnap.data() || {};

    // Ensure all required Comment properties are present
    const newComment: Comment = {
      id: docRef.id,
      content: commentData.content,
      postId: commentData.postId,
      userId: commentData.userId,
      author: commentData.author,
      createdAt,
      updatedAt: createdAt,
      parentId: commentData.parentId || undefined,
      replies: []
    }

    console.log('Comment created successfully:', {
      id: newComment.id,
      content: newComment.content.substring(0, 20) + '...'
    })

    return newComment
  } catch (error) {
    console.error('Error in createComment:', error instanceof Error ? error.message : 'Unknown error')
    throw error
  }
}

export async function updateComment(
  commentId: string,
  userId: string,
  data: UpdateCommentData
): Promise<void> {
  try {
    // Get a fresh reference to the database
    const { adminDb: db } = initAdmin()
    const commentRef = db.collection(COMMENTS_COLLECTION).doc(commentId)
    const commentSnap = await commentRef.get()

    if (!commentSnap.exists) {
      throw new Error('Comment not found')
    }

    const commentData = commentSnap.data()
    if (commentData?.userId !== userId) {
      throw new Error('Not authorized to update this comment')
    }

    await commentRef.update({
      ...data,
      updatedAt: new Date()
    })
  } catch (error) {
    console.error('Error in updateComment:', error instanceof Error ? error.message : 'Unknown error')
    throw error
  }
}

export async function deleteComment(
  commentId: string,
  userId: string,
  isAdmin: boolean = false,
  postId: string
): Promise<boolean> {
  try {
    // Get a fresh reference to the database
    const { adminDb: db } = initAdmin()
    const commentRef = db.collection(COMMENTS_COLLECTION).doc(commentId)
    const commentSnap = await commentRef.get()

    if (!commentSnap.exists) {
      throw new Error('Comment not found')
    }

    const commentData = commentSnap.data()
    if (!isAdmin && commentData?.userId !== userId) {
      return false
    }

    await commentRef.delete()
    return true
  } catch (error) {
    console.error('Error in deleteComment:', error instanceof Error ? error.message : 'Unknown error')
    throw error
  }
}

// ============ NEW ENHANCED FEATURES ============

/**
 * Toggle like/unlike on a comment
 */
export async function toggleCommentReaction(
  commentId: string,
  userId: string
): Promise<{ liked: boolean; likeCount: number }> {
  try {
    const { adminDb: db } = initAdmin()
    const commentRef = db.collection(COMMENTS_COLLECTION).doc(commentId)
    const commentSnap = await commentRef.get()

    if (!commentSnap.exists) {
      throw new Error('Comment not found')
    }

    const commentData = commentSnap.data()
    const currentLikes = commentData?.reactions?.likes || []
    const hasLiked = currentLikes.includes(userId)

    if (hasLiked) {
      // Unlike: remove userId from likes array
      await commentRef.update({
        'reactions.likes': FieldValue.arrayRemove(userId)
      })
      return { liked: false, likeCount: currentLikes.length - 1 }
    } else {
      // Like: add userId to likes array
      await commentRef.update({
        'reactions.likes': FieldValue.arrayUnion(userId)
      })
      return { liked: true, likeCount: currentLikes.length + 1 }
    }
  } catch (error) {
    console.error('Error in toggleCommentReaction:', error instanceof Error ? error.message : 'Unknown error')
    throw error
  }
}

/**
 * Report a comment for moderation
 */
export async function reportComment(
  data: ReportCommentData
): Promise<{ success: boolean; reportId: string }> {
  try {
    const { adminDb: db } = initAdmin()
    const commentRef = db.collection(COMMENTS_COLLECTION).doc(data.commentId)
    const commentSnap = await commentRef.get()

    if (!commentSnap.exists) {
      throw new Error('Comment not found')
    }

    // Create a report document
    const reportData = {
      commentId: data.commentId,
      reportedBy: data.reportedBy,
      reportedByEmail: data.reportedByEmail,
      reason: data.reason,
      createdAt: new Date(),
      status: 'pending'
    }

    const reportRef = await db.collection(REPORTS_COLLECTION).add(reportData)

    // Update comment to mark it as reported
    await commentRef.update({
      isReported: true,
      status: 'flagged'
    })

    console.log('Comment reported successfully:', {
      commentId: data.commentId,
      reportId: reportRef.id
    })

    return { success: true, reportId: reportRef.id }
  } catch (error) {
    console.error('Error in reportComment:', error instanceof Error ? error.message : 'Unknown error')
    throw error
  }
}

/**
 * Get all reported comments for admin moderation
 */
export async function getReportedComments(): Promise<{
  comment: Comment
  reports: ReportCommentData[]
}[]> {
  try {
    const { adminDb: db } = initAdmin()

    // Get all pending reports
    const reportsSnapshot = await db
      .collection(REPORTS_COLLECTION)
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get()

    // Group reports by comment ID
    const reportsByComment = new Map<string, ReportCommentData[]>()

    reportsSnapshot.forEach((doc) => {
      const report = { id: doc.id, ...doc.data() } as ReportCommentData
      const existingReports = reportsByComment.get(report.commentId) || []
      reportsByComment.set(report.commentId, [...existingReports, report])
    })

    // Fetch the actual comments
    const result: { comment: Comment; reports: ReportCommentData[] }[] = []

    for (const [commentId, reports] of reportsByComment.entries()) {
      const commentSnap = await db.collection(COMMENTS_COLLECTION).doc(commentId).get()

      if (commentSnap.exists) {
        const data = commentSnap.data()
        const comment = {
          id: commentSnap.id,
          ...data,
          createdAt: data?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || null
        } as Comment

        result.push({ comment, reports })
      }
    }

    return result
  } catch (error) {
    console.error('Error in getReportedComments:', error instanceof Error ? error.message : 'Unknown error')
    throw error
  }
}

/**
 * Dismiss a report (admin action)
 */
export async function dismissReport(
  reportId: string,
  adminId: string
): Promise<void> {
  try {
    const { adminDb: db } = initAdmin()
    const reportRef = db.collection(REPORTS_COLLECTION).doc(reportId)

    await reportRef.update({
      status: 'dismissed',
      reviewedBy: adminId,
      reviewedAt: new Date()
    })

    console.log('Report dismissed:', reportId)
  } catch (error) {
    console.error('Error in dismissReport:', error instanceof Error ? error.message : 'Unknown error')
    throw error
  }
}

/**
 * Approve a report and take action on the comment (admin action)
 */
export async function approveReport(
  reportId: string,
  commentId: string,
  adminId: string,
  action: 'hide' | 'delete'
): Promise<void> {
  try {
    const { adminDb: db } = initAdmin()
    const reportRef = db.collection(REPORTS_COLLECTION).doc(reportId)
    const commentRef = db.collection(COMMENTS_COLLECTION).doc(commentId)

    // Update report status
    await reportRef.update({
      status: 'reviewed',
      reviewedBy: adminId,
      reviewedAt: new Date()
    })

    // Take action on comment
    if (action === 'delete') {
      await commentRef.delete()
    } else {
      await commentRef.update({
        status: 'hidden'
      })
    }

    console.log('Report approved and action taken:', { reportId, action })
  } catch (error) {
    console.error('Error in approveReport:', error instanceof Error ? error.message : 'Unknown error')
    throw error
  }
}

/**
 * Sort comments by different criteria
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
