import { getFirestore, doc, setDoc } from 'firebase/firestore'
import { initializeApp } from 'firebase/app'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

async function setupAdmin() {
  try {
    const app = initializeApp(firebaseConfig)
    const db = getFirestore(app)

    // Create admin document
    await setDoc(doc(db, 'env', 'admin'), {
      adminEmail: 'emmanuelfabiani23@gmail.com'
    })

    console.log('Admin document created successfully')
  } catch (error) {
    console.error('Error creating admin document:', error)
  }
}

setupAdmin()
