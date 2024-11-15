import { initializeApp, getApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAnalytics, isSupported } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

console.log('Firebase initialization starting...')
console.log('Firebase config:', firebaseConfig)

// Initialize Firebase
let app
if (!getApps().length) {
  console.log('No Firebase apps found, initializing...')
  try {
    app = initializeApp(firebaseConfig)
    console.log('Firebase app initialized successfully')
  } catch (error) {
    console.error('Error initializing Firebase app:', error)
    throw error
  }
} else {
  console.log('Firebase app already exists, getting instance...')
  app = getApp()
}

// Initialize services
console.log('Initializing Firebase services...')

const auth = getAuth(app)
console.log('Auth service initialized')

const db = getFirestore(app)
console.log('Firestore service initialized')

const storage = getStorage(app)
console.log('Storage service initialized')

// Initialize Analytics only in browser
let analytics = null
if (typeof window !== 'undefined') {
  isSupported().then(yes => {
    if (yes) {
      analytics = getAnalytics(app)
      console.log('Analytics service initialized')
    } else {
      console.log('Analytics not supported in this environment')
    }
  })
}

console.log('Firebase initialization complete')

export { app, auth, db, storage, analytics }
