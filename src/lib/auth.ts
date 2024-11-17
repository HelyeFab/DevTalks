import { User } from 'firebase/auth'
import { auth } from './firebase'
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
  getAuth
} from 'firebase/auth'

export const ADMIN_EMAIL = 'emmanuelfabiani23@gmail.com'
export const DEFAULT_AVATAR = '/images/default-avatar.svg'

export async function getAuth() {
  return new Promise((resolve) => {
    // Wait for auth state to be ready
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe() // Unsubscribe immediately
      
      if (!user) {
        resolve(null)
        return
      }

      resolve({
        user: {
          id: user.uid,
          email: user.email,
          name: user.displayName || user.email?.split('@')[0] || 'Anonymous',
          image: user.photoURL || DEFAULT_AVATAR,
        }
      })
    })
  })
}

export async function signInWithGoogle() {
  try {
    const auth = getAuth()
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    return result.user
  } catch (error) {
    console.error('Error signing in with Google:', error)
    throw error
  }
}

export async function signIn(email: string, password: string) {
  try {
    const auth = getAuth()
    const result = await signInWithEmailAndPassword(auth, email, password)
    return result.user
  } catch (error) {
    console.error('Error signing in:', error)
    throw error
  }
}

export async function signUp(email: string, password: string, name: string) {
  try {
    const auth = getAuth()
    const result = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(result.user, {
      displayName: name,
    })
    return result.user
  } catch (error) {
    console.error('Error signing up:', error)
    throw error
  }
}

export async function signOut() {
  try {
    const auth = getAuth()
    await firebaseSignOut(auth)
  } catch (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

export function isAdmin(user: User | null): boolean {
  return user?.email === ADMIN_EMAIL
}

export function getRedirectPath(user: User | null): string {
  return isAdmin(user) ? '/admin/dashboard' : '/user/profile'
}
