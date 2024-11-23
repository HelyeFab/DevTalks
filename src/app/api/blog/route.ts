import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { BlogPost } from '@/types/blog'
import { initAdmin } from '@/lib/firebase-admin'

const ADMIN_EMAIL = 'emmanuelfabiani23@gmail.com'

// Initialize Firebase Admin
const { auth, db } = initAdmin()

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
    const postRef = db.collection('blog')
    const docRef = await postRef.add(data)
    const post = { id: docRef.id, ...data }
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
    const { id, ...data } = await req.json() as BlogPost & { id: string }
    if (!id) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    // Update post
    const postRef = db.collection('blog').doc(id)
    await postRef.update(data)

    return NextResponse.json({ id, ...data })
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update post' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
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
    const { id } = await req.json() as { id: string }
    if (!id) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    // Delete post
    await db.collection('blog').doc(id).delete()

    return NextResponse.json({ id })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete post' },
      { status: 500 }
    )
  }
}
