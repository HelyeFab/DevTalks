#!/usr/bin/env tsx
/**
 * Migration Script: Enhance Existing Announcements
 *
 * This script migrates existing announcements in Firebase to include new rich content fields.
 * It adds default values for fields that were added to the announcement system:
 * - subtitle
 * - excerpt
 * - tags
 * - author
 * - slug
 * - readTime
 * - seo
 * - image/imageAlt
 * - publishedAt
 *
 * IMPORTANT: Run this script BEFORE deploying the new announcement system to production.
 *
 * Usage:
 *   npm install -g tsx
 *   tsx scripts/migrate-announcements.ts [--dry-run] [--batch-size=10]
 *
 * Options:
 *   --dry-run       Preview changes without writing to database
 *   --batch-size=N  Process N announcements at a time (default: 10)
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import * as path from 'path'
import * as fs from 'fs'

// Parse command line arguments
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const batchSizeArg = args.find(arg => arg.startsWith('--batch-size='))
const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1], 10) : 10

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

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '')  // Remove leading/trailing hyphens
}

// Helper function to calculate read time
function calculateReadTime(content: string): number {
  const wordsPerMinute = 200
  const wordCount = content.trim().split(/\s+/).length
  return Math.ceil(wordCount / wordsPerMinute)
}

// Helper function to generate excerpt
function generateExcerpt(content: string, maxLength = 150): string {
  const plainText = content.replace(/<[^>]*>/g, '') // Remove HTML tags
  if (plainText.length <= maxLength) {
    return plainText
  }
  return plainText.substring(0, maxLength).trim() + '...'
}

interface MigrationStats {
  total: number
  updated: number
  skipped: number
  errors: number
}

async function migrateAnnouncements(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    total: 0,
    updated: 0,
    skipped: 0,
    errors: 0
  }

  console.log('🚀 Starting announcement migration...')
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}`)
  console.log(`Batch size: ${batchSize}`)
  console.log()

  try {
    // Get all announcements
    const announcementsRef = db.collection('announcements')
    const snapshot = await announcementsRef.get()

    stats.total = snapshot.size
    console.log(`📊 Found ${stats.total} announcements to process\n`)

    if (stats.total === 0) {
      console.log('✅ No announcements found. Nothing to migrate.')
      return stats
    }

    // Process in batches
    const docs = snapshot.docs
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = docs.slice(i, i + batchSize)
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(docs.length / batchSize)}...`)

      for (const docSnap of batch) {
        const data = docSnap.data()
        const updates: Record<string, any> = {}
        let needsUpdate = false

        console.log(`\n  📄 Processing: "${data.title}" (${docSnap.id})`)

        // Check and add missing fields
        if (!data.subtitle) {
          updates.subtitle = ''
          needsUpdate = true
          console.log(`    ➕ Adding subtitle: ""`)
        }

        if (!data.excerpt) {
          const excerpt = data.content ? generateExcerpt(data.content) : ''
          updates.excerpt = excerpt
          needsUpdate = true
          console.log(`    ➕ Adding excerpt: "${excerpt.substring(0, 50)}..."`)
        }

        if (!data.tags || !Array.isArray(data.tags)) {
          updates.tags = []
          needsUpdate = true
          console.log(`    ➕ Adding tags: []`)
        }

        if (!data.author) {
          updates.author = {
            name: 'Admin',
            email: process.env.ADMIN_EMAIL || 'admin@devtalks.com',
            image: '',
            uid: ''
          }
          needsUpdate = true
          console.log(`    ➕ Adding author: Admin`)
        }

        if (!data.slug) {
          const slug = generateSlug(data.title || `announcement-${docSnap.id}`)
          updates.slug = slug
          needsUpdate = true
          console.log(`    ➕ Adding slug: "${slug}"`)
        }

        if (!data.readTime) {
          const readTime = data.content ? calculateReadTime(data.content) : 1
          updates.readTime = readTime
          needsUpdate = true
          console.log(`    ➕ Adding readTime: ${readTime} min`)
        }

        if (!data.seo) {
          updates.seo = {
            title: data.title || '',
            description: data.excerpt || (data.content ? generateExcerpt(data.content) : ''),
            keywords: [],
            ogImage: data.image || '',
            canonicalUrl: ''
          }
          needsUpdate = true
          console.log(`    ➕ Adding seo metadata`)
        }

        // Ensure image fields exist (can be undefined)
        if (data.image === undefined) {
          updates.image = null
          needsUpdate = true
          console.log(`    ➕ Adding image: null`)
        }

        if (data.imageAlt === undefined) {
          updates.imageAlt = null
          needsUpdate = true
          console.log(`    ➕ Adding imageAlt: null`)
        }

        // Add publishedAt if published but no publishedAt
        if (data.published && !data.publishedAt) {
          updates.publishedAt = data.date || new Date().toISOString()
          needsUpdate = true
          console.log(`    ➕ Adding publishedAt: ${updates.publishedAt}`)
        }

        // Add updatedAt if missing
        if (!data.updatedAt) {
          updates.updatedAt = new Date().toISOString()
          needsUpdate = true
          console.log(`    ➕ Adding updatedAt`)
        }

        // Convert date to ISO string if it's a Timestamp
        if (data.date && typeof data.date.toDate === 'function') {
          updates.date = data.date.toDate().toISOString()
          needsUpdate = true
          console.log(`    🔄 Converting date to ISO string`)
        }

        if (needsUpdate) {
          if (!isDryRun) {
            await docSnap.ref.update(updates)
            console.log(`    ✅ Updated successfully`)
          } else {
            console.log(`    🔍 Would update with:`, updates)
          }
          stats.updated++
        } else {
          console.log(`    ⏭️  Already has all fields, skipping`)
          stats.skipped++
        }
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log('📊 Migration Summary:')
    console.log('='.repeat(50))
    console.log(`Total announcements: ${stats.total}`)
    console.log(`Updated: ${stats.updated}`)
    console.log(`Skipped: ${stats.skipped}`)
    console.log(`Errors: ${stats.errors}`)

    if (isDryRun) {
      console.log('\n⚠️  This was a DRY RUN. No changes were made.')
      console.log('Run without --dry-run to apply changes.')
    } else {
      console.log('\n✅ Migration completed successfully!')
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    stats.errors++
  }

  return stats
}

// Run migration
migrateAnnouncements()
  .then((stats) => {
    process.exit(stats.errors > 0 ? 1 : 0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
