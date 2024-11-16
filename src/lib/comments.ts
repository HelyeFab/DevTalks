import type { Comment, CreateCommentData, UpdateCommentData } from '@/types/comment'
import { db } from './firebase-admin'

const COMMENTS_COLLECTION = 'comments'

export async function getCommentsByPostId(postId: string): Promise<Comment[]> {
  console.log('Getting comments for post:', postId)
  try {
    // Get all comments for the post
    console.log('Creating query for comments collection...')
    const commentsRef = db.collection(COMMENTS_COLLECTION)
    const commentsQuery = commentsRef.where('postId', '==', postId)

    console.log('Executing query...')
    const commentsSnapshot = await commentsQuery.get()
    console.log('Found', commentsSnapshot.size, 'total comments')

    // Separate top-level comments and replies
    const topLevelComments: Comment[] = []
    const repliesMap = new Map<string, Comment[]>()

    commentsSnapshot.forEach((doc) => {
      const data = doc.data()
      const comment = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      } as Comment

      if (data.parentId) {
        // This is a reply
        if (!repliesMap.has(data.parentId)) {
          repliesMap.set(data.parentId, [])
        }
        repliesMap.get(data.parentId)?.push(comment)
      } else {
        // This is a top-level comment
        topLevelComments.push(comment)
      }
    })

    // Sort comments and attach replies
    const sortedComments = topLevelComments
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(comment => ({
        ...comment,
        replies: (repliesMap.get(comment.id) || [])
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      }))

    console.log('Processed comments:', sortedComments.length, 'top-level,', repliesMap.size, 'with replies')
    return sortedComments
  } catch (error) {
    console.error('Error in getCommentsByPostId:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    }
    throw error
  }
}

export async function createComment(
  data: CreateCommentData,
  userId: string,
  author: { name: string; image: string; email: string }
): Promise<Comment> {
  try {
    // Create the comment data with all required fields
    const commentData = {
      content: data.content.trim(),
      postId: data.postId,
      userId,
      author,
      createdAt: new Date(),
      updatedAt: new Date(),
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

    const docRef = await db.collection(COMMENTS_COLLECTION).add(commentData)
    const docSnap = await docRef.get()
    const createdAt = new Date().toISOString()

    const newComment = {
      id: docRef.id,
      ...docSnap.data(),
      createdAt,
      updatedAt: createdAt,
    } as Comment

    console.log('Comment created:', {
      id: newComment.id,
      userId: newComment.userId,
      author: newComment.author,
      content: newComment.content.substring(0, 20) + '...'
    })

    return newComment
  } catch (error) {
    console.error('Error in createComment:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    }
    throw error
  }
}

export async function updateComment(
  commentId: string,
  userId: string,
  data: UpdateCommentData
): Promise<void> {
  try {
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
      updatedAt: new Date(),
    })
  } catch (error) {
    console.error('Error in updateComment:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    }
    throw error
  }
}

export async function deleteComment(commentId: string, userId: string): Promise<void> {
  try {
    const commentRef = db.collection(COMMENTS_COLLECTION).doc(commentId)
    const commentSnap = await commentRef.get()

    if (!commentSnap.exists) {
      throw new Error('Comment not found')
    }

    const commentData = commentSnap.data()
    if (commentData?.userId !== userId) {
      throw new Error('Not authorized to delete this comment')
    }

    await commentRef.delete()
  } catch (error) {
    console.error('Error in deleteComment:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
    }
    throw error
  }
}
