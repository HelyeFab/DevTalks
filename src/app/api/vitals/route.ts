/**
 * Web Vitals API endpoint
 * Receives and stores performance metrics from the client
 */

import { NextRequest, NextResponse } from 'next/server'

interface VitalsPayload {
  name: string
  value: number
  id: string
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  url: string
  userAgent: string
  timestamp: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as VitalsPayload

    // Validate payload
    if (!body.name || typeof body.value !== 'number') {
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      )
    }

    // Log metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Web Vitals API]', {
        metric: body.name,
        value: body.value,
        rating: body.rating,
        url: body.url,
      })
    }

    // In production, you would typically:
    // 1. Store in a database (Firestore, PostgreSQL, etc.)
    // 2. Send to analytics service (Google Analytics, Vercel Analytics, etc.)
    // 3. Send to monitoring service (Sentry, DataDog, etc.)

    // Example: Store in Firestore
    // const db = getFirestore()
    // await addDoc(collection(db, 'webVitals'), {
    //   ...body,
    //   createdAt: serverTimestamp(),
    // })

    // Example: Send to Google Analytics
    // if (process.env.GA_MEASUREMENT_ID) {
    //   await fetch(
    //     `https://www.google-analytics.com/mp/collect?measurement_id=${process.env.GA_MEASUREMENT_ID}&api_secret=${process.env.GA_API_SECRET}`,
    //     {
    //       method: 'POST',
    //       body: JSON.stringify({
    //         client_id: body.id,
    //         events: [
    //           {
    //             name: 'web_vitals',
    //             params: {
    //               metric_name: body.name,
    //               metric_value: body.value,
    //               metric_rating: body.rating,
    //               page_path: new URL(body.url).pathname,
    //             },
    //           },
    //         ],
    //       }),
    //     }
    //   )
    // }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[Web Vitals API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS if needed
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
