import { NextRequest, NextResponse } from 'next/server'
import { getCommentsByPostId, createComment } from '@/lib/comments'
import { CreateCommentData } from '@/types/comment'
import { auth } from '@/lib/firebase'

export const dynamic = 'force-dynamic'

const DEFAULT_AVATAR = '/images/default-avatar.svg'

type RouteContext = {
  params: { postId: string }
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const postId = params.postId
  console.log('Fetching comments for post:', { postId })

  try {
    const comments = await getCommentsByPostId(postId)
    console.log('Found comments:', { count: comments.length })
    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const postId = params.postId
  console.log('Creating comment for post:', { postId })

  try {
    // Get current user
    const currentUser = auth.currentUser
    console.log('Current user:', {
      uid: currentUser?.uid,
      email: currentUser?.email,
      displayName: currentUser?.displayName
    })

    if (!currentUser) {
      console.error('No authenticated user found')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    const data = await request.json() as CreateCommentData
    console.log('Comment data:', {
      postId,
      userId: currentUser.uid,
      content: data.content?.substring(0, 20) + '...',
    })

    // Create comment
    const comment = await createComment(
      {
        ...data,
        postId,
      },
      currentUser.uid,
      {
        name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Anonymous',
        image: currentUser.photoURL || DEFAULT_AVATAR,
      }
    )

    console.log('Comment created:', {
      commentId: comment.id,
      postId,
      userId: currentUser.uid,
    })

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create comment' },
      { status: 500 }
    )
  }
}
