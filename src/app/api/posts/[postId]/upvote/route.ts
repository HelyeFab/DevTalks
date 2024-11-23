import { NextRequest, NextResponse } from 'next/server'
import { initAdmin } from '@/lib/firebase-admin'

const { auth, db } = initAdmin()

const POSTS_COLLECTION = 'blog_posts'
const UPVOTES_COLLECTION = 'upvotes'

type RouteContext = {
  params: { postId: string }
}

export async function POST(request: NextRequest, context: RouteContext) {
  console.log('\n--- Starting upvote operation ---')
  const postId = context.params.postId

  try {
    // Get authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    // Verify the token
    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await auth.verifyIdToken(token)
    const userId = decodedToken.uid

    // Get the post document reference
    const postRef = db.collection(POSTS_COLLECTION).doc(postId)
    const postDoc = await postRef.get()

    if (!postDoc.exists) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Get or create the upvote document
    const upvoteRef = postRef.collection(UPVOTES_COLLECTION).doc(userId)
    const upvoteDoc = await upvoteRef.get()

    // Run the upvote operation in a transaction
    await db.runTransaction(async (transaction) => {
      if (upvoteDoc.exists) {
        // User has already upvoted, remove the upvote
        transaction.delete(upvoteRef)
        transaction.update(postRef, {
          upvotes: (postDoc.data()?.upvotes || 0) - 1
        })
      } else {
        // User hasn't upvoted yet, add the upvote
        transaction.create(upvoteRef, {
          userId,
          createdAt: new Date().toISOString()
        })
        transaction.update(postRef, {
          upvotes: (postDoc.data()?.upvotes || 0) + 1
        })
      }
    })

    // Return the new upvote status
    return NextResponse.json({
      upvoted: !upvoteDoc.exists,
      upvotes: postDoc.data()?.upvotes || 0
    })
  } catch (error) {
    console.error('Error in upvote operation:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process upvote' },
      { status: 500 }
    )
  }
}
