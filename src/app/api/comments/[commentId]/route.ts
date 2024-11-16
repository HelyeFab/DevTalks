import { NextRequest, NextResponse } from 'next/server'
import { updateComment, deleteComment } from '@/lib/comments'
import { getAuth } from '@/lib/auth'
import { UpdateCommentData } from '@/types/comment'

export async function PUT(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const session = await getAuth()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const data = (await request.json()) as UpdateCommentData
    await updateComment(params.commentId, session.user.id, data)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating comment:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized to update this comment' },
        { status: 403 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update comment' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const session = await getAuth()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    await deleteComment(params.commentId, session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comment:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized to delete this comment' },
        { status: 403 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    )
  }
}
