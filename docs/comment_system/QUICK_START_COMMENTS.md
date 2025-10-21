# Quick Start Guide - Enhanced Comment System

## 🚀 Deployment in 5 Minutes

### Step 1: Deploy Firestore Indexes
```bash
cd /home/beano/DevProjects/next_js/DevTalks
firebase deploy --only firestore:indexes
```

### Step 2: Update Firestore Security Rules

Add to `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ... your existing rules ...

    // Comments Collection
    match /comments/{commentId} {
      allow read: if resource.data.status == 'active' || request.auth != null;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null && (
        resource.data.userId == request.auth.uid ||
        get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.isAdmin == true
      );
    }

    // Comment Reports Collection
    match /comment_reports/{reportId} {
      allow read: if request.auth != null &&
        get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.isAdmin == true;
      allow create: if request.auth != null && request.resource.data.reportedBy == request.auth.uid;
      allow update: if request.auth != null &&
        get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.isAdmin == true;
    }
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

### Step 3: Build & Test
```bash
npm run build
npm run dev
```

### Step 4: Test the Features

1. Go to any blog post
2. Sign in as a user
3. Add a comment
4. Like a comment
5. Reply to a comment
6. Report a comment
7. Change sorting (dropdown at top)
8. Sign in as admin
9. Visit `/admin/comments`
10. Moderate reported comments

## 🎯 Quick Feature Overview

| Feature | User Action | Location |
|---------|-------------|----------|
| **Comment** | Use form at bottom of post | Blog post page |
| **Reply** | Click "Reply" button | On any comment |
| **Like** | Click heart icon | On any comment |
| **Report** | Click "Report" button | On any comment (not yours) |
| **Sort** | Use dropdown | Top of comments section |
| **Moderate** | Visit admin page | `/admin/comments` |
| **Edit** | Three-dot menu → Edit | Your comments only |
| **Delete** | Three-dot menu → Delete | Your comments + admin |

## 📁 Important Files

### Components
- `src/components/comments/comment-section-enhanced.tsx` - Main component
- `src/components/comments/comment-item-enhanced.tsx` - Individual comment
- `src/components/comments/report-modal.tsx` - Report dialog

### API Routes
- `/api/comments/[commentId]/react` - Like/unlike
- `/api/comments/[commentId]/report` - Report
- `/api/admin/comments/reports` - Admin moderation

### Pages
- `/admin/comments` - Moderation dashboard

### Utilities
- `src/lib/comments.ts` - Server-side functions
- `src/lib/comments-client.ts` - Client-side sorting
- `src/lib/validation/comment-schemas.ts` - Zod schemas

## 🐛 Troubleshooting

**Comments not showing?**
```bash
# Check Firestore console
# Verify indexes are deployed
firebase deploy --only firestore:indexes
```

**Build errors?**
```bash
# The auth page error is pre-existing, not from comments
# Verify no TypeScript errors in comment files
npx tsc --noEmit | grep comment
```

**Admin dashboard empty?**
```bash
# 1. Create a test report by reporting a comment
# 2. Check Firestore console for comment_reports collection
# 3. Verify your user has isAdmin: true in profiles collection
```

## 📚 Full Documentation

- **Complete Guide**: `docs/COMMENT_SYSTEM.md`
- **Implementation Summary**: `docs/COMMENT_SYSTEM_SUMMARY.md`
- **This File**: `docs/QUICK_START_COMMENTS.md`

## ✅ Deployment Checklist

- [ ] Firestore indexes deployed
- [ ] Security rules updated and deployed
- [ ] Build successful
- [ ] Tested commenting as user
- [ ] Tested liking comments
- [ ] Tested reporting
- [ ] Tested admin moderation
- [ ] Tested on mobile
- [ ] Tested in dark mode

## 🎉 You're Done!

Your comment system is now live with:
- ✅ Real-time updates
- ✅ Reactions (likes)
- ✅ Reporting
- ✅ Admin moderation
- ✅ Optimistic UI
- ✅ Comment sorting

Enjoy your robust comment system! 🚀
