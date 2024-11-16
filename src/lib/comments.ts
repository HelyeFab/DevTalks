import {
  collection,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Comment, CreateCommentData, UpdateCommentData } from '@/types/comment'

const COMMENTS_COLLECTION = 'comments'

export async function getCommentsByPostId(postId: string): Promise<Comment[]> {
  console.log('Getting comments for post:', postId)
  try {
    // Get all comments for the post
    const commentsQuery = query(
      collection(db, COMMENTS_COLLECTION),
      where('postId', '==', postId)
    )

    const commentsSnapshot = await getDocs(commentsQuery)
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
    throw error
  }
}

export async function createComment(
  data: CreateCommentData,
  userId: string,
  author: { name: string; image: string }
): Promise<Comment> {
  try {
    const commentData = {
      ...data,
      userId,
      author,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, COMMENTS_COLLECTION), commentData)
    const docSnap = await getDoc(docRef)
    const createdAt = new Date().toISOString()

    return {
      id: docRef.id,
      ...docSnap.data(),
      createdAt,
      updatedAt: createdAt,
    } as Comment
  } catch (error) {
    console.error('Error in createComment:', error)
    throw error
  }
}

export async function updateComment(
  commentId: string,
  userId: string,
  data: UpdateCommentData
): Promise<void> {
  try {
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId)
    const commentSnap = await getDoc(commentRef)

    if (!commentSnap.exists()) {
      throw new Error('Comment not found')
    }

    if (commentSnap.data()?.userId !== userId) {
      throw new Error('Unauthorized')
    }

    await updateDoc(commentRef, {
      ...data,
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error in updateComment:', error)
    throw error
  }
}

export async function deleteComment(commentId: string, userId: string): Promise<void> {
  try {
    const commentRef = doc(db, COMMENTS_COLLECTION, commentId)
    const commentSnap = await getDoc(commentRef)

    if (!commentSnap.exists()) {
      throw new Error('Comment not found')
    }

    if (commentSnap.data()?.userId !== userId) {
      throw new Error('Unauthorized')
    }

    // Delete all replies first
    const repliesQuery = query(
      collection(db, COMMENTS_COLLECTION),
      where('parentId', '==', commentId)
    )
    const repliesSnapshot = await getDocs(repliesQuery)
    
    const deletePromises = repliesSnapshot.docs.map((replyDoc) =>
      deleteDoc(doc(db, COMMENTS_COLLECTION, replyDoc.id))
    )
    await Promise.all(deletePromises)

    // Delete the main comment
    await deleteDoc(commentRef)
  } catch (error) {
    console.error('Error in deleteComment:', error)
    throw error
  }
}
