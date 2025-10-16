import type { Comment, CreateCommentData, UpdateCommentData } from '@/types/comment'
import { initAdmin } from './firebase-admin'

const POSTS_COLLECTION = 'blog_posts'
const COMMENTS_COLLECTION = 'comments'

// Don't initialize db at module level as it won't pick up changes to the global store
// Instead, get a fresh reference in each function

export async function getCommentsByPostId(postId: string): Promise<Comment[]> {
  console.log('Getting comments for post:', postId)

  // Get a fresh reference to the database
  const { db } = initAdmin()

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
    const { db } = initAdmin()
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
    const { db } = initAdmin()
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
    const { db } = initAdmin()
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
