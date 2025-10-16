# DevTalks: Unified Content System - Deployment Guide

This guide provides step-by-step instructions for deploying the unified content system with enhanced announcements to production.

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] **Firebase Admin SDK service account key** saved as `service-account.json` in the project root
- [ ] **Node.js 18+** installed
- [ ] **Firebase CLI** installed (`npm install -g firebase-tools`)
- [ ] **tsx** installed for running migration scripts (`npm install -g tsx`)
- [ ] **Backup** of your Firestore database (via Firebase Console > Firestore Database > Export)
- [ ] **Testing environment** to verify changes before production deployment

---

## 🚀 Deployment Steps

### Step 1: Prepare Your Environment

```bash
# 1. Pull latest code
git pull origin trunk

# 2. Install dependencies
npm install

# 3. Build the project to verify no TypeScript errors
npm run build
```

### Step 2: Run Migration Scripts (DRY RUN)

**IMPORTANT**: Always run migrations in dry-run mode first!

#### 2.1 Migrate Announcements

This adds rich content fields to existing announcements:

```bash
# Dry run - preview changes
tsx scripts/migrate-announcements.ts --dry-run

# Review the output carefully
# Look for any errors or unexpected values
```

**What this migration does:**
- Adds `subtitle` (default: empty string)
- Adds `excerpt` (generated from content)
- Adds `tags` (default: empty array)
- Adds `author` (default: Admin)
- Adds `slug` (generated from title)
- Adds `readTime` (calculated from content)
- Adds `seo` metadata (default values)
- Adds `image`/`imageAlt` (default: null)
- Adds `publishedAt` for published announcements
- Converts Firestore Timestamps to ISO strings

#### 2.2 Clean Up Upvotes (Optional)

This removes the deprecated global `post_upvotes` collection:

```bash
# Dry run - preview deletions
tsx scripts/migrate-upvotes.ts --dry-run

# Verify subcollection system is working
# The script will check for upvotes in blog_posts/{id}/upvotes/
```

**What this migration does:**
- Verifies subcollection-based upvote system is working
- Creates backup of global collection (if --backup flag used)
- Deletes all documents in `post_upvotes` collection

---

### Step 3: Deploy Firestore Indexes

Composite indexes are required for efficient queries:

```bash
# Deploy indexes
firebase deploy --only firestore:indexes

# This will create indexes for:
# - blog_posts: published + date
# - blog_posts: published + upvotes
# - blog_posts: tags + published + date
# - announcements: published + date
# - announcements: pinned + priority + date
```

**Expected output:**
```
✔ Deploy complete!

Index creation may take several minutes.
Check status: https://console.firebase.google.com/project/YOUR_PROJECT/firestore/indexes
```

**IMPORTANT**: Wait for indexes to finish building before proceeding!

---

### Step 4: Update Firestore Security Rules

Deploy the updated security rules that support the new announcement fields:

```bash
# Deploy rules
firebase deploy --only firestore:rules

# Verify deployment
firebase firestore:rules:list
```

**What changed in the rules:**
- Added support for new announcement fields (subtitle, tags, author, etc.)
- Maintained admin-only write access
- Public read access for published content

---

### Step 5: Run Migrations (LIVE)

After verifying dry-run output looks correct:

#### 5.1 Migrate Announcements (LIVE)

```bash
# Run the actual migration
tsx scripts/migrate-announcements.ts

# Monitor output for errors
# Should see: "✅ Migration completed successfully!"
```

#### 5.2 Clean Up Upvotes (LIVE - Optional)

```bash
# Create backup first!
tsx scripts/migrate-upvotes.ts --backup

# If backup looks good, run deletion
tsx scripts/migrate-upvotes.ts

# Verify upvotes still work in the app
```

---

### Step 6: Deploy Application Code

```bash
# Build production bundle
npm run build

# If using Vercel, Netlify, or similar:
git push origin trunk  # Auto-deploys

# If manually deploying:
firebase deploy --only hosting
```

---

### Step 7: Post-Deployment Verification

#### 7.1 Test Announcement Creation

1. **Navigate to** `/admin/announcements/new`
2. **Create test announcement** with:
   - Title and subtitle
   - Rich MDX content
   - Cover image
   - Tags
   - Set priority to "High"
   - Pin it
   - Set start/end dates
3. **Save as draft** first
4. **Edit** the draft
5. **Publish** when ready

#### 7.2 Test Announcement Display

1. **Navigate to** `/admin/announcements`
2. **Verify** all announcements display correctly
3. **Check** new fields appear (subtitle, tags, read time, pinned badge)
4. **Edit** an existing announcement
5. **Delete** the test announcement

#### 7.3 Test Blog Post System (Regression)

1. **Create new post** at `/admin/posts/new`
2. **Verify** upvote functionality works
3. **Check** post editing still works
4. **Test** comment system

#### 7.4 Verify Firebase Data

1. **Open Firebase Console** > Firestore Database
2. **Check `announcements` collection**:
   - Verify migrated announcements have new fields
   - Check data types are correct
3. **Check `blog_posts/{id}/upvotes/` subcollections**:
   - Verify upvotes are being written
4. **Verify `post_upvotes` collection** is deleted (if you ran that migration)

#### 7.5 Test Search Functionality

1. **Search for** announcements by tag
2. **Filter** by published status
3. **Sort** by date
4. **Verify** queries are fast (indexes working)

---

## 📊 Monitoring

After deployment, monitor these metrics:

### Application Logs

```bash
# If using Vercel
vercel logs YOUR_DEPLOYMENT_URL

# Check for errors related to:
# - Announcement fetching
# - Upvote operations
# - Authentication
```

### Firebase Console

1. **Usage Tab**: Monitor read/write operations
2. **Performance Tab**: Check query performance
3. **Error Reporting**: Look for new errors

### Key Metrics to Watch

- **Announcement load time**: Should be fast with indexes
- **Upvote operations**: Should succeed without errors
- **Migration errors**: Check for any data inconsistencies

---

## 🔄 Rollback Procedures

If something goes wrong, here's how to rollback:

### Rollback Code Deployment

```bash
# Revert to previous commit
git revert HEAD
git push origin trunk

# Or rollback in Vercel/Netlify dashboard
```

### Restore Firestore Data

```bash
# Restore from backup (via Firebase Console)
# 1. Go to Firestore Database > Import/Export
# 2. Select your backup
# 3. Import to restore

# Or restore individual documents
# Use the backup JSON files created by migration scripts
```

### Restore Upvotes Collection

If you ran the upvote migration and need to rollback:

```bash
# Restore from backup JSON
node scripts/restore-upvotes-backup.js post_upvotes_backup_TIMESTAMP.json
```

### Rollback Security Rules

```bash
# Get previous rules version
firebase firestore:rules:list

# Revert to previous version
git checkout HEAD~1 firestore.rules
firebase deploy --only firestore:rules
```

### Rollback Indexes

```bash
# Delete problematic indexes via Firebase Console
# Or revert firestore.indexes.json
git checkout HEAD~1 firestore.indexes.json
firebase deploy --only firestore:indexes
```

---

## 🧪 Testing Checklist

Use this checklist to verify everything works:

### Announcement System

- [ ] Can create new announcement with toggle on "Announcement"
- [ ] Can add MDX content with formatting
- [ ] Can upload and select cover image
- [ ] Can add tags (autocomplete works)
- [ ] Can set priority (low/normal/high/urgent)
- [ ] Can pin announcement
- [ ] Can set start and end dates
- [ ] Can save as draft
- [ ] Can publish announcement
- [ ] Can edit existing announcement
- [ ] Can delete announcement
- [ ] Announcements list shows all new fields
- [ ] Pinned badge appears for pinned announcements
- [ ] Read time is calculated and displayed
- [ ] Tags are displayed and clickable
- [ ] SEO metadata is saved

### Blog Post System (Regression Testing)

- [ ] Can create new blog post with toggle on "Post"
- [ ] Can add MDX content
- [ ] Can upload cover image
- [ ] Can add tags
- [ ] Upvote button works (increment/decrement)
- [ ] Upvote count updates correctly
- [ ] Comments system still works
- [ ] Post editing works
- [ ] Post deletion works
- [ ] Search by tags works

### Unified Editor

- [ ] Content type toggle appears in create mode
- [ ] Content type toggle does NOT appear in edit mode
- [ ] Switching between Post/Announcement shows/hides correct fields
- [ ] Markdown import works
- [ ] Image upload helper works
- [ ] SEO analysis updates in real-time
- [ ] Auto-slug generation works
- [ ] Date picker sets custom dates

### Performance

- [ ] Announcement list loads quickly
- [ ] Blog post list loads quickly
- [ ] Queries complete in <1 second
- [ ] No console errors in browser
- [ ] No 500 errors in API routes

### Data Integrity

- [ ] Migrated announcements have all new fields
- [ ] No null/undefined errors in UI
- [ ] Timestamps are formatted correctly
- [ ] Slugs are unique and URL-safe
- [ ] Read times are reasonable (1-10 min for most posts)

---

## 📝 Common Issues and Solutions

### Issue: "Index required" error

**Symptom**: Firestore query fails with "requires an index" error

**Solution**:
1. Copy the index URL from the error message
2. Open URL in browser to create index
3. Wait for index to build (can take 5-10 minutes)
4. Or deploy indexes: `firebase deploy --only firestore:indexes`

### Issue: Migration script fails with "service-account.json not found"

**Symptom**: `❌ Error: service-account.json not found`

**Solution**:
1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate new private key"
3. Save as `service-account.json` in project root
4. Add to `.gitignore` (already included)

### Issue: Announcements show "undefined" for new fields

**Symptom**: UI displays "undefined" or empty values

**Solution**:
1. Verify migration ran successfully
2. Check Firebase Console for data
3. Clear browser cache
4. Check component is reading correct field names

### Issue: Upvotes not working after migration

**Symptom**: Upvote button doesn't work or shows errors

**Solution**:
1. Check browser console for errors
2. Verify subcollection path: `blog_posts/{postId}/upvotes/{userId}`
3. Check Firestore rules allow write to subcollections
4. Verify API route is deployed

### Issue: Index build is taking too long

**Symptom**: Index stuck in "Building" state for >30 minutes

**Solution**:
1. Check Firebase Console for index status
2. If stuck, delete and recreate index
3. For large collections, indexes can take hours

---

## 🎯 Success Criteria

Deployment is successful when:

✅ All migration scripts complete without errors
✅ All Firestore indexes are in "Enabled" state
✅ New announcements can be created with rich content
✅ Existing announcements display correctly with migrated data
✅ Blog post system continues to work (upvotes, comments)
✅ No console errors in browser
✅ No 500 errors in application logs
✅ Performance is acceptable (<1s for list queries)
✅ All tests in testing checklist pass

---

## 📞 Support

If you encounter issues:

1. **Check this guide** for common issues
2. **Review error logs** in Firebase and application logs
3. **Verify data** in Firebase Console
4. **Test in development** before deploying to production
5. **Use rollback procedures** if needed

---

## 📚 Related Documentation

- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - What was built
- [Migration Scripts README](#) - Detailed script documentation
- [Firebase Indexes Guide](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

---

## ✅ Post-Deployment

After successful deployment:

1. **Update documentation** with any findings
2. **Monitor** for 24-48 hours
3. **Collect feedback** from users
4. **Plan next improvements** (cursor pagination, custom claims, etc.)
5. **Archive backup files** in safe location

---

**Last Updated**: 2025-10-16
**Version**: 1.0.0
**Maintainer**: DevTalks Team
