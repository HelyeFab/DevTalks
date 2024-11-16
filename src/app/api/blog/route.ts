import { NextRequest, NextResponse } from 'next/server'
import { auth, db } from '@/lib/firebase'
import { BlogPost } from '@/types/blog'

const ADMIN_EMAIL = 'emmanuelfabiani23@gmail.com'

// Helper function to check if user is admin
async function isAdmin(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return false
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await auth.verifyIdToken(token)
    return decodedToken.email === ADMIN_EMAIL
  } catch (error) {
    console.error('Error verifying admin status:', error)
    return false
  }
}

export async function POST(req: NextRequest) {
  console.log('Handling POST request to /api/blog')

  try {
    // Check admin status
    if (!await isAdmin(req)) {
      console.error('Unauthorized access attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const data = await req.json() as BlogPost
    console.log('Creating post:', {
      title: data.title,
      excerpt: data.excerpt?.substring(0, 50) + '...',
    })

    // Create post
    const postRef = db.collection('blog').doc()
    await postRef.set(data)
    const post = { id: postRef.id, ...data }
    console.log('Post created:', { id: post.id })

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create post' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  console.log('Handling PUT request to /api/blog')

  try {
    // Check admin status
    if (!await isAdmin(req)) {
      console.error('Unauthorized access attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const data = await req.json() as BlogPost
    console.log('Updating post:', {
      id: data.id,
      title: data.title,
    })

    // Update post
    const postRef = db.collection('blog').doc(data.id)
    await postRef.update(data)
    const post = { id: data.id, ...data }
    console.log('Post updated:', { id: post.id })

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update post' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  console.log('Handling DELETE request to /api/blog')

  try {
    // Check admin status
    if (!await isAdmin(req)) {
      console.error('Unauthorized access attempt')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const data = await req.json() as { id: string }
    console.log('Deleting post:', { id: data.id })

    // Delete post
    await db.collection('blog').doc(data.id).delete()
    console.log('Post deleted:', { id: data.id })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete post' },
      { status: 500 }
    )
  }
}
