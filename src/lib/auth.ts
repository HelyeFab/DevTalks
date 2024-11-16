import { User } from 'firebase/auth'
import { auth } from './firebase'

const ADMIN_EMAIL = 'emmanuelfabiani23@gmail.com'
const DEFAULT_AVATAR = '/images/default-avatar.png'

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

export function isAdmin(user: User | null): boolean {
  return user?.email === ADMIN_EMAIL
}

export function getRedirectPath(user: User | null): string {
  return isAdmin(user) ? '/admin/dashboard' : '/user/profile'
}
