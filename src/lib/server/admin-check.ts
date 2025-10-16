'use server'

import { getAdminAuth } from './firebase-admin'

/**
 * Checks if a user is an admin using custom claims
 * This is the secure way to verify admin status on the server
 */
export async function isUserAdmin(uid: string): Promise<boolean> {
  try {
    const auth = getAdminAuth()
    const user = await auth.getUser(uid)

    // Check custom claims for admin status
    return user.customClaims?.admin === true
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

/**
 * Sets admin status for a user using custom claims
 * This should only be called by a super admin or during setup
 */
export async function setAdminStatus(uid: string, isAdmin: boolean): Promise<void> {
  try {
    const auth = getAdminAuth()
    await auth.setCustomUserClaims(uid, { admin: isAdmin })
    console.log(`Admin status set to ${isAdmin} for user ${uid}`)
  } catch (error) {
    console.error('Error setting admin status:', error)
    throw new Error('Failed to set admin status')
  }
}

/**
 * Verifies if a user is admin by email
 * WARNING: This should only be used for initial setup
 * In production, use custom claims instead
 */
export async function checkAdminByEmail(email: string): Promise<boolean> {
  const adminEmail = process.env.ADMIN_EMAIL

  if (!adminEmail) {
    console.warn('ADMIN_EMAIL not configured')
    return false
  }

  return email === adminEmail
}

/**
 * Gets user information by UID
 */
export async function getUserInfo(uid: string) {
  try {
    const auth = getAdminAuth()
    const user = await auth.getUser(uid)

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      isAdmin: user.customClaims?.admin === true,
    }
  } catch (error) {
    console.error('Error getting user info:', error)
    throw new Error('Failed to get user info')
  }
}
