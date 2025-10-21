import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getAuth, Auth } from 'firebase/auth'
import { getStorage, FirebaseStorage } from 'firebase/storage'
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Check if Firebase config is valid
const hasValidConfig = firebaseConfig.apiKey && firebaseConfig.projectId

// Initialize Firebase
let app: FirebaseApp | undefined
let db: Firestore | undefined
let auth: Auth | undefined
let storage: FirebaseStorage | undefined
let analytics: Analytics | undefined

// Only initialize on the client side
if (typeof window !== 'undefined' && hasValidConfig) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    db = getFirestore(app)
    auth = getAuth(app)
    storage = getStorage(app)

    // Initialize Analytics
    isSupported().then(yes => yes && (analytics = getAnalytics(app!)))
  } catch (error) {
    console.error('Failed to initialize Firebase:', error)
    console.error('Firebase config:', {
      hasApiKey: !!firebaseConfig.apiKey,
      hasProjectId: !!firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain
    })
  }
} else if (typeof window === 'undefined') {
  console.log('[SERVER] Skipping Firebase client initialization on server')
} else if (!hasValidConfig) {
  console.error('[CLIENT] Invalid Firebase configuration - missing required environment variables')
}

export { app, db, auth, storage, analytics }
