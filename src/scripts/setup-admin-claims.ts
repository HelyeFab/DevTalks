#!/usr/bin/env node

/**
 * Setup script to grant admin privileges to a user
 * Usage: npx tsx src/scripts/setup-admin-claims.ts <email>
 *
 * This script uses Firebase Admin SDK to set custom claims
 * This is the secure way to manage admin privileges
 */

import { setAdminStatus, getUserByEmail } from '../lib/server/firebase-admin'

async function setupAdmin() {
  const email = process.argv[2]

  if (!email) {
    console.error('Usage: npx tsx src/scripts/setup-admin-claims.ts <email>')
    process.exit(1)
  }

  try {
    console.log(`Setting up admin privileges for ${email}...`)

    // Get user by email
    const user = await getUserByEmail(email)

    if (!user) {
      console.error(`User not found: ${email}`)
      process.exit(1)
    }

    // Set admin claim
    await setAdminStatus(user.uid, true)

    console.log(`✓ Admin privileges granted to ${email}`)
    console.log(`User ID: ${user.uid}`)
    console.log('\nThe user will need to sign out and sign back in for changes to take effect.')
  } catch (error) {
    console.error('Error setting up admin:', error)
    process.exit(1)
  }
}

setupAdmin()
