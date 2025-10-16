#!/usr/bin/env tsx
/**
 * Migration Script: Clean Up Duplicate Upvote Storage
 *
 * This script removes the deprecated global `post_upvotes` collection.
 * The upvote system now uses only subcollections as the single source of truth:
 *   blog_posts/{postId}/upvotes/{userId}
 *
 * IMPORTANT: Only run this AFTER verifying the subcollection-based upvote system is working.
 *
 * Usage:
 *   npm install -g tsx
 *   tsx scripts/migrate-upvotes.ts [--dry-run] [--batch-size=500]
 *
 * Options:
 *   --dry-run       Preview what would be deleted without actually deleting
 *   --batch-size=N  Delete N documents at a time (default: 500, max: 500)
 *   --backup        Create a backup JSON file before deletion
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import * as path from 'path'
import * as fs from 'fs'

// Parse command line arguments
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const shouldBackup = args.includes('--backup')
const batchSizeArg = args.find(arg => arg.startsWith('--batch-size='))
const batchSize = Math.min(batchSizeArg ? parseInt(batchSizeArg.split('=')[1], 10) : 500, 500)

// Initialize Firebase Admin
const serviceAccountPath = path.join(process.cwd(), 'service-account.json')

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: service-account.json not found')
  console.error('Please download your Firebase Admin SDK service account key and save it as service-account.json')
  process.exit(1)
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))

initializeApp({
  credential: cert(serviceAccount)
})

const db = getFirestore()

interface MigrationStats {
  totalDocuments: number
  deletedDocuments: number
  errors: number
  backupPath?: string
}

async function backupCollection(): Promise<any[]> {
  console.log('📦 Creating backup of post_upvotes collection...')

  const snapshot = await db.collection('post_upvotes').get()
  const backup = snapshot.docs.map(doc => ({
    id: doc.id,
    data: doc.data()
  }))

  const backupPath = path.join(process.cwd(), `post_upvotes_backup_${Date.now()}.json`)
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2))

  console.log(`✅ Backup saved to: ${backupPath}`)
  console.log(`   Backed up ${backup.length} documents\n`)

  return backup
}

async function verifySubcollections(): Promise<boolean> {
  console.log('🔍 Verifying subcollection-based upvote system...\n')

  // Get a sample of blog posts
  const postsSnapshot = await db.collection('blog_posts').limit(5).get()

  if (postsSnapshot.empty) {
    console.log('⚠️  No blog posts found. Cannot verify subcollection system.')
    return false
  }

  let hasSubcollectionUpvotes = false

  for (const postDoc of postsSnapshot.docs) {
    const upvotesSnapshot = await postDoc.ref.collection('upvotes').limit(1).get()
    if (!upvotesSnapshot.empty) {
      hasSubcollectionUpvotes = true
      console.log(`✅ Found upvotes in subcollection for post: ${postDoc.id}`)
      break
    }
  }

  if (!hasSubcollectionUpvotes) {
    console.log('⚠️  Warning: No upvotes found in subcollections.')
    console.log('   Make sure the subcollection-based system is working before proceeding.')
    return false
  }

  console.log('✅ Subcollection-based upvote system verified\n')
  return true
}

async function deleteGlobalUpvotes(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalDocuments: 0,
    deletedDocuments: 0,
    errors: 0
  }

  console.log('🚀 Starting upvote migration...')
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no deletions will be made)' : 'LIVE'}`)
  console.log(`Batch size: ${batchSize}`)
  console.log()

  try {
    // Check if collection exists
    const collectionRef = db.collection('post_upvotes')
    const snapshot = await collectionRef.limit(1).get()

    if (snapshot.empty) {
      console.log('✅ No post_upvotes collection found. Nothing to migrate.')
      return stats
    }

    // Verify subcollection system is working
    const isVerified = await verifySubcollections()
    if (!isVerified) {
      console.log('\n❌ Verification failed. Aborting migration.')
      console.log('Please ensure the subcollection-based upvote system is working correctly.')
      return stats
    }

    // Create backup if requested
    if (shouldBackup) {
      await backupCollection()
      stats.backupPath = `post_upvotes_backup_${Date.now()}.json`
    }

    // Count total documents
    console.log('📊 Counting documents in post_upvotes collection...')
    const allDocs = await collectionRef.get()
    stats.totalDocuments = allDocs.size
    console.log(`Found ${stats.totalDocuments} documents to delete\n`)

    if (stats.totalDocuments === 0) {
      console.log('✅ Collection is already empty.')
      return stats
    }

    // Delete in batches
    let deletedCount = 0
    while (true) {
      const batchSnapshot = await collectionRef.limit(batchSize).get()

      if (batchSnapshot.empty) {
        break
      }

      if (isDryRun) {
        console.log(`🔍 Would delete batch of ${batchSnapshot.size} documents`)
        deletedCount += batchSnapshot.size
      } else {
        const batch = db.batch()
        batchSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref)
        })

        await batch.commit()
        deletedCount += batchSnapshot.size
        console.log(`🗑️  Deleted ${deletedCount}/${stats.totalDocuments} documents...`)
      }

      stats.deletedDocuments = deletedCount

      // Prevent rate limiting
      if (!isDryRun && batchSnapshot.size === batchSize) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log('📊 Migration Summary:')
    console.log('='.repeat(50))
    console.log(`Total documents: ${stats.totalDocuments}`)
    console.log(`Deleted: ${stats.deletedDocuments}`)
    console.log(`Errors: ${stats.errors}`)

    if (stats.backupPath) {
      console.log(`Backup: ${stats.backupPath}`)
    }

    if (isDryRun) {
      console.log('\n⚠️  This was a DRY RUN. No deletions were made.')
      console.log('Run without --dry-run to actually delete the collection.')
    } else {
      console.log('\n✅ Migration completed successfully!')
      console.log('\n📝 Next steps:')
      console.log('1. Verify upvote functionality still works')
      console.log('2. Update Firestore security rules to remove post_upvotes collection')
      console.log('3. Monitor error logs for any issues')
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    stats.errors++
  }

  return stats
}

// Run migration
deleteGlobalUpvotes()
  .then((stats) => {
    process.exit(stats.errors > 0 ? 1 : 0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
