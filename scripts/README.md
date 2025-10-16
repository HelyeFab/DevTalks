# Migration Scripts

This directory contains migration scripts for the DevTalks unified content system.

## Prerequisites

1. **Install tsx** (TypeScript execution environment):
   ```bash
   npm install -g tsx
   ```

2. **Set up Firebase Admin SDK**:
   - Download your service account key from Firebase Console
   - Save as `service-account.json` in the project root
   - **IMPORTANT**: Never commit this file to git (already in .gitignore)

3. **Create a backup** of your Firestore database:
   - Go to Firebase Console > Firestore Database
   - Click "Import/Export" > "Export"
   - Save the backup location

---

## Available Scripts

### 1. `migrate-announcements.ts`

Migrates existing announcements to include rich content fields.

#### What it does:
- Adds `subtitle`, `excerpt`, `tags`, `author`, `slug`, `readTime`, `seo` fields
- Converts Firestore Timestamps to ISO string format
- Generates URL-friendly slugs from titles
- Calculates read time based on content length
- Adds `publishedAt` timestamp for published announcements

#### Usage:

```bash
# Dry run (preview changes without modifying database)
tsx scripts/migrate-announcements.ts --dry-run

# Run with custom batch size
tsx scripts/migrate-announcements.ts --dry-run --batch-size=5

# Live migration (CAUTION: modifies database)
tsx scripts/migrate-announcements.ts

# Live migration with smaller batches
tsx scripts/migrate-announcements.ts --batch-size=5
```

#### Options:
- `--dry-run` - Preview changes without writing to database
- `--batch-size=N` - Process N announcements at a time (default: 10)

#### Expected Output:

```
🚀 Starting announcement migration...
Mode: DRY RUN (no changes will be made)
Batch size: 10

📊 Found 25 announcements to process

Processing batch 1/3...

  📄 Processing: "Welcome to DevTalks" (abc123)
    ➕ Adding subtitle: ""
    ➕ Adding excerpt: "Welcome to DevTalks, a community for developers..."
    ➕ Adding tags: []
    ➕ Adding author: Admin
    ➕ Adding slug: "welcome-to-devtalks"
    ➕ Adding readTime: 3 min
    ➕ Adding seo metadata
    🔍 Would update with: {...}

==================================================
📊 Migration Summary:
==================================================
Total announcements: 25
Updated: 25
Skipped: 0
Errors: 0

⚠️  This was a DRY RUN. No changes were made.
Run without --dry-run to apply changes.
```

---

### 2. `migrate-upvotes.ts`

Cleans up the deprecated global `post_upvotes` collection.

#### What it does:
- Verifies that the subcollection-based upvote system is working
- Creates a backup JSON file of all upvote data (if `--backup` flag used)
- Deletes all documents in the `post_upvotes` collection
- Uses batched deletes to prevent rate limiting

#### Usage:

```bash
# Dry run with backup preview
tsx scripts/migrate-upvotes.ts --dry-run --backup

# Dry run without backup
tsx scripts/migrate-upvotes.ts --dry-run

# Live migration with backup (RECOMMENDED)
tsx scripts/migrate-upvotes.ts --backup

# Live migration without backup (CAUTION)
tsx scripts/migrate-upvotes.ts

# Custom batch size
tsx scripts/migrate-upvotes.ts --batch-size=250 --backup
```

#### Options:
- `--dry-run` - Preview deletions without actually deleting
- `--backup` - Create JSON backup file before deletion
- `--batch-size=N` - Delete N documents at a time (default: 500, max: 500)

#### Expected Output:

```
🚀 Starting upvote migration...
Mode: LIVE
Batch size: 500

🔍 Verifying subcollection-based upvote system...

✅ Found upvotes in subcollection for post: post123
✅ Subcollection-based upvote system verified

📦 Creating backup of post_upvotes collection...
✅ Backup saved to: post_upvotes_backup_1697654321000.json
   Backed up 1543 documents

📊 Counting documents in post_upvotes collection...
Found 1543 documents to delete

🗑️  Deleted 500/1543 documents...
🗑️  Deleted 1000/1543 documents...
🗑️  Deleted 1500/1543 documents...
🗑️  Deleted 1543/1543 documents...

==================================================
📊 Migration Summary:
==================================================
Total documents: 1543
Deleted: 1543
Errors: 0
Backup: post_upvotes_backup_1697654321000.json

✅ Migration completed successfully!

📝 Next steps:
1. Verify upvote functionality still works
2. Update Firestore security rules to remove post_upvotes collection
3. Monitor error logs for any issues
```

---

## Safety Checklist

Before running any migration:

- [ ] Create Firestore database backup via Firebase Console
- [ ] Run migration in **dry-run mode** first
- [ ] Review the dry-run output carefully
- [ ] Verify the changes look correct
- [ ] Test in a development/staging environment first
- [ ] Have rollback plan ready (backup + rollback script)
- [ ] Monitor application logs during and after migration

---

## Troubleshooting

### Error: "service-account.json not found"

**Solution**: Download your service account key:
1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate new private key"
3. Save as `service-account.json` in project root

### Error: "Verification failed"

For `migrate-upvotes.ts`, this means no upvotes were found in subcollections.

**Solution**:
1. Verify the upvote API route is working: `src/app/api/posts/[postId]/upvote/route.ts`
2. Test upvoting a post in the UI
3. Check Firebase Console for upvotes in `blog_posts/{postId}/upvotes/`
4. Only run upvote migration after confirming subcollections work

### Error: "Permission denied"

**Solution**: Verify your service account has the required permissions:
- Firestore read/write access
- Check IAM & Admin in Firebase Console

### Migration is slow

**Cause**: Large number of documents or slow network

**Solutions**:
1. Reduce batch size: `--batch-size=5`
2. Run during off-peak hours
3. Be patient - large collections take time
4. Monitor progress in the console output

---

## Rollback Procedures

### Rollback Announcement Migration

If the migration causes issues:

1. **Restore from Firestore backup**:
   - Firebase Console > Firestore Database > Import/Export
   - Select your backup and restore

2. **Manual field removal** (if needed):
   ```typescript
   // Remove migrated fields from specific documents
   const docRef = db.collection('announcements').doc('ANNOUNCEMENT_ID')
   await docRef.update({
     subtitle: admin.firestore.FieldValue.delete(),
     excerpt: admin.firestore.FieldValue.delete(),
     // ... etc
   })
   ```

### Rollback Upvote Migration

If you need to restore the `post_upvotes` collection:

1. **Use the backup JSON**:
   ```typescript
   import { initAdmin } from './firebase-admin'
   const { db } = initAdmin()
   const backup = require('./post_upvotes_backup_TIMESTAMP.json')

   for (const item of backup) {
     await db.collection('post_upvotes').doc(item.id).set(item.data)
   }
   ```

2. **Update the upvote API route** to write to both locations again

---

## Post-Migration Verification

After running migrations:

### For Announcements:

1. **Check Firebase Console**:
   - Open an announcement document
   - Verify all new fields exist
   - Check data types are correct

2. **Test the UI**:
   - Navigate to `/admin/announcements`
   - Verify announcements display correctly
   - Create new announcement
   - Edit existing announcement

3. **Check for errors**:
   - Browser console
   - Application logs
   - Firebase error reporting

### For Upvotes:

1. **Test upvote functionality**:
   - Open a blog post
   - Click upvote button
   - Verify count increments
   - Click again to remove upvote
   - Verify count decrements

2. **Check Firebase Console**:
   - Verify `post_upvotes` collection is deleted/empty
   - Check `blog_posts/{postId}/upvotes/` subcollections exist
   - Verify upvote documents have correct structure

3. **Monitor performance**:
   - Upvote operations should be fast (<500ms)
   - No errors in console or logs

---

## Best Practices

1. **Always use --dry-run first**
2. **Always backup before live migration**
3. **Test in development environment first**
4. **Run during low-traffic periods**
5. **Monitor logs during and after migration**
6. **Have rollback plan ready**
7. **Communicate with your team** about planned migrations

---

## Support

For issues or questions:

1. Review this README
2. Check the main [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md)
3. Review [IMPLEMENTATION_SUMMARY.md](../IMPLEMENTATION_SUMMARY.md)
4. Check Firebase Console for data integrity
5. Review application logs for errors

---

## Related Documentation

- [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [IMPLEMENTATION_SUMMARY.md](../IMPLEMENTATION_SUMMARY.md) - What was built and why

---

**Last Updated**: 2025-10-16
**Version**: 1.0.0
