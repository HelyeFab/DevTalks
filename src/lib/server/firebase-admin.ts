// Server-only module - do NOT use 'use server' for initialization utilities
// Only use 'use server' for actual Server Actions that need to be called from Client Components

import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getAuth, Auth } from 'firebase-admin/auth'
import { getFirestore, Firestore } from 'firebase-admin/firestore'

/**
 * Server-side Firebase Admin SDK initialization
 * This file should only be imported in server-side code (API routes, Server Components)
 */

let adminApp: App | null = null
let adminAuth: Auth | null = null
let adminDb: Firestore | null = null

interface AdminServices {
  app: App | null
  auth: Auth
  db: Firestore
  isAvailable: boolean
}

/**
 * Validates environment variables for Firebase Admin SDK
 */
function validateEnvironment(): boolean {
  const requiredVars = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY'
  ]

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      console.error(`Missing environment variable: ${varName}`)
      return false
    }
  }

  // Check if private key is a placeholder
  if (process.env.FIREBASE_PRIVATE_KEY?.includes('placeholder-for-new-key')) {
    console.error('FIREBASE_PRIVATE_KEY appears to be a placeholder')
    return false
  }

  return true
}

/**
 * Initializes Firebase Admin SDK
 * Throws an error in production if configuration is invalid
 */
export function initializeFirebaseAdmin(): AdminServices {
  // Return cached instances if already initialized
  if (adminApp && adminAuth && adminDb) {
    return {
      app: adminApp,
      auth: adminAuth,
      db: adminDb,
      isAvailable: true
    }
  }

  // Validate environment variables
  const isValid = validateEnvironment()

  if (!isValid) {
    // During Next.js build, skip Firebase initialization
    if (process.env.NEXT_PHASE === 'phase-production-build' ||
        process.env.NODE_ENV === 'development') {
      console.warn('[BUILD/DEV] Firebase Admin SDK not configured, skipping')
      // Return empty mock services to prevent build errors
      return {
        app: null,
        auth: {} as Auth,
        db: {} as Firestore,
        isAvailable: false
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('Firebase Admin SDK is not properly configured')
    }

    throw new Error('Firebase Admin SDK not configured')
  }

  try {
    // Check if an app is already initialized
    if (getApps().length === 0) {
      adminApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID!,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
          privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        }),
        projectId: process.env.FIREBASE_PROJECT_ID,
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
      })
      console.log('Firebase Admin SDK initialized successfully')
    } else {
      adminApp = getApps()[0]
      console.log('Using existing Firebase Admin app')
    }

    // Initialize services
    adminAuth = getAuth(adminApp)
    adminDb = getFirestore(adminApp)

    return {
      app: adminApp,
      auth: adminAuth,
      db: adminDb,
      isAvailable: true
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error)

    if (process.env.NODE_ENV === 'production') {
      throw error
    }

    throw new Error('Firebase Admin SDK initialization failed')
  }
}

/**
 * Gets the Firebase Admin Auth instance
 * Use this for server-side authentication operations
 */
export function getAdminAuth(): Auth {
  if (!adminAuth) {
    const services = initializeFirebaseAdmin()
    adminAuth = services.auth
  }
  return adminAuth
}

/**
 * Gets the Firebase Admin Firestore instance
 * Use this for server-side database operations
 */
export function getAdminDb(): Firestore {
  if (!adminDb) {
    const services = initializeFirebaseAdmin()
    adminDb = services.db
  }
  return adminDb
}

/**
 * Verifies a Firebase ID token
 * @param idToken - The Firebase ID token to verify
 * @returns The decoded token
 */
export async function verifyIdToken(idToken: string) {
  const auth = getAdminAuth()
  return auth.verifyIdToken(idToken)
}

/**
 * Sets custom claims for a user
 * @param uid - User ID
 * @param claims - Custom claims to set
 */
export async function setCustomClaims(uid: string, claims: Record<string, unknown>) {
  const auth = getAdminAuth()
  return auth.setCustomUserClaims(uid, claims)
}

/**
 * Gets a user by email
 * @param email - User email
 */
export async function getUserByEmail(email: string) {
  const auth = getAdminAuth()
  return auth.getUserByEmail(email)
}

/**
 * Sets or removes admin status for a user
 * @param uid - User ID
 * @param isAdmin - Whether the user should be an admin
 */
export async function setAdminStatus(uid: string, isAdmin: boolean) {
  return setCustomClaims(uid, { admin: isAdmin })
}
