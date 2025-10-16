import { User } from 'firebase/auth'
import { auth } from './firebase'
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword
} from 'firebase/auth'

export const DEFAULT_AVATAR = '/images/default-avatar.svg'

/**
 * Checks if user is admin by checking custom claims
 * This will be set server-side using Firebase Admin SDK
 */
async function checkAdminClaims(user: User): Promise<boolean> {
  try {
    const idTokenResult = await user.getIdTokenResult()
    return idTokenResult.claims.admin === true
  } catch (error) {
    console.error('Error checking admin claims:', error)
    return false
  }
}

export async function getCurrentAuth() {
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
    const result = await signInWithEmailAndPassword(auth, email, password)
    return result.user
  } catch (error) {
    console.error('Error signing in:', error)
    throw error
  }
}

export async function signUp(email: string, password: string, name: string) {
  try {
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
    await firebaseSignOut(auth)
  } catch (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

export async function isAdmin(user: User | null): Promise<boolean> {
  if (!user) return false
  return checkAdminClaims(user)
}

export async function getRedirectPath(user: User | null): Promise<string> {
  const adminStatus = await isAdmin(user)
  return adminStatus ? '/admin/dashboard' : '/user/profile'
}
