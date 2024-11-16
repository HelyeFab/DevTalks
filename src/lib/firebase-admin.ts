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

console.log('Initializing Firebase Admin with project:', serviceAccount.projectId)

function getFirebaseAdminApp() {
  if (getApps().length === 0) {
    console.log('No Firebase Admin apps found, initializing...')
    try {
      const app = initializeApp({
        credential: cert(serviceAccount),
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

// Initialize Firebase Admin
const app = getFirebaseAdminApp()

// Initialize Firestore
const db = getFirestore(app)
console.log('Firestore Admin initialized successfully')

// Export instances
export { getAuth, db }
