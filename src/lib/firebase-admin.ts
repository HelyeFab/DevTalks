import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

// Validate environment variables
if (!process.env.FIREBASE_PROJECT_ID) {
  throw new Error('FIREBASE_PROJECT_ID is not set in environment variables')
}
if (!process.env.FIREBASE_CLIENT_EMAIL) {
  throw new Error('FIREBASE_CLIENT_EMAIL is not set in environment variables')
}
if (!process.env.FIREBASE_PRIVATE_KEY) {
  throw new Error('FIREBASE_PRIVATE_KEY is not set in environment variables')
}

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
}

function getFirebaseAdminApp() {
  if (getApps().length === 0) {
    console.log('No Firebase Admin apps found, initializing...')
    try {
      const app = initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
      })
      console.log('Firebase Admin app initialized successfully')
      return app
    } catch (error) {
      console.error('Error initializing Firebase Admin:', error)
      throw error
    }
  }
  console.log('Firebase Admin already initialized')
  return getApps()[0]
}

export function initAdmin() {
  const app = getFirebaseAdminApp()
  const auth = getAuth(app)
  const db = getFirestore(app)
  console.log('Firebase Admin services initialized successfully')
  return { app, auth, db }
}

// Export auth and db for direct use
export { getAuth, getFirestore }
