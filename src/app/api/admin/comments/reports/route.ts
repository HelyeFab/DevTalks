import { NextRequest, NextResponse } from 'next/server'
import { getReportedComments, dismissReport, approveReport } from '@/lib/comments'
import { getAuth } from '@/lib/firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'

export const dynamic = 'force-dynamic'

async function isAdmin(uid: string): Promise<boolean> {
  try {
    const db = getFirestore()
    const profileRef = db.collection('profiles').doc(uid)
    const profile = await profileRef.get()
    return profile.exists && profile.data()?.isAdmin === true
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

export async function GET(request: NextRequest) {
  console.log('\n--- Starting fetch reported comments ---')
  try {
    // Get authorization header
    const authHeader = request.headers.get('Authorization')
    console.log('Auth header present:', !!authHeader)

    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Invalid auth header format')
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    // Verify the token
    const token = authHeader.split('Bearer ')[1]

    try {
      // Get Firebase Admin auth instance
      console.log('Getting Firebase Admin auth instance...')
      const auth = getAuth()

      // Verify the token
      console.log('Verifying token...')
      const decodedToken = await auth.verifyIdToken(token)
      console.log('Token verified successfully for user:', {
        uid: decodedToken.uid,
        email: decodedToken.email
      })

      // Check if user is admin
      const userIsAdmin = await isAdmin(decodedToken.uid)
      console.log('User admin status:', { isAdmin: userIsAdmin })

      if (!userIsAdmin) {
        return NextResponse.json(
          { error: 'Unauthorized - admin access required' },
          { status: 403 }
        )
      }

      // Get reported comments
      console.log('Fetching reported comments...')
      const reportedComments = await getReportedComments()
      console.log('Reported comments fetched:', reportedComments.length)

      return NextResponse.json(reportedComments)
    } catch (error) {
      console.error('Error verifying token:', error)
      return NextResponse.json(
        { error: 'Invalid authorization token' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Error in GET /api/admin/comments/reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  console.log('\n--- Starting report action ---')
  try {
    // Get authorization header
    const authHeader = request.headers.get('Authorization')
    console.log('Auth header present:', !!authHeader)

    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Invalid auth header format')
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    // Verify the token
    const token = authHeader.split('Bearer ')[1]

    try {
      // Get Firebase Admin auth instance
      console.log('Getting Firebase Admin auth instance...')
      const auth = getAuth()

      // Verify the token
      console.log('Verifying token...')
      const decodedToken = await auth.verifyIdToken(token)
      console.log('Token verified successfully for user:', {
        uid: decodedToken.uid,
        email: decodedToken.email
      })

      // Check if user is admin
      const userIsAdmin = await isAdmin(decodedToken.uid)
      console.log('User admin status:', { isAdmin: userIsAdmin })

      if (!userIsAdmin) {
        return NextResponse.json(
          { error: 'Unauthorized - admin access required' },
          { status: 403 }
        )
      }

      // Get request body
      const body = await request.json()
      const { reportId, commentId, action } = body

      if (!reportId || !action) {
        return NextResponse.json(
          { error: 'Missing required fields: reportId, action' },
          { status: 400 }
        )
      }

      // Handle the action
      if (action === 'dismiss') {
        await dismissReport(reportId, decodedToken.uid)
        return NextResponse.json({ success: true, action: 'dismissed' })
      } else if (action === 'hide' || action === 'delete') {
        if (!commentId) {
          return NextResponse.json(
            { error: 'commentId required for hide/delete actions' },
            { status: 400 }
          )
        }
        await approveReport(reportId, commentId, decodedToken.uid, action)
        return NextResponse.json({ success: true, action })
      } else {
        return NextResponse.json(
          { error: 'Invalid action. Must be: dismiss, hide, or delete' },
          { status: 400 }
        )
      }
    } catch (error) {
      console.error('Error verifying token:', error)
      return NextResponse.json(
        { error: 'Invalid authorization token' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Error in POST /api/admin/comments/reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
