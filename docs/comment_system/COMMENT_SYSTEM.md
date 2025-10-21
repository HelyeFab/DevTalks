# Enhanced Comment System Documentation

## Overview

The DevTalks blog now features a robust, real-time comment system with advanced moderation capabilities, reactions, and reporting functionality.

## Features

### 1. **Real-time Updates**
- Comments update automatically using Firestore's `onSnapshot` listeners
- No page refresh needed to see new comments or replies
- Instant synchronization across all users viewing the same post

### 2. **Optimistic Updates**
- UI updates immediately when users add/edit/delete comments
- Provides instant feedback while the server processes the request
- Automatic rollback if the operation fails

### 3. **Reactions (Likes)**
- Users can like/unlike comments
- Like count displays next to each comment
- Heart icon fills in when liked
- Optimistic UI updates for instant feedback

### 4. **Comment Reporting**
- Users can report inappropriate comments
- Pre-defined report reasons + custom text option
- Reports are anonymous
- Comments get flagged for admin review

### 5. **Comment Sorting**
- **Newest First**: Default, shows most recent comments first
- **Oldest First**: Chronological order
- **Most Liked**: Sort by number of likes

### 6. **Admin Moderation Dashboard**
- Accessible at `/admin/comments`
- View all reported comments with report reasons
- Three action options:
  - **Dismiss Report**: Mark report as reviewed, no action
  - **Hide Comment**: Hide from public view (admins can still see)
  - **Delete Comment**: Permanently remove

### 7. **Nested Replies**
- Comments can have replies (1 level deep)
- Reply threads are indented for clarity
- Replies sorted chronologically

## Technical Architecture

### Data Model

#### Comment Structure
```typescript
interface Comment {
  id: string
  content: string
  postId: string
  userId: string
  parentId?: string  // For replies
  author: {
    name: string
    image?: string
    email: string
  }
  createdAt: string
  updatedAt: string | null
  replies?: Comment[]

  // Enhanced fields
  reactions?: {
    likes: string[]  // Array of user IDs
  }
  reports?: CommentReport[]
  isReported?: boolean
  status?: 'active' | 'flagged' | 'hidden' | 'deleted'
}
```

#### Report Structure
```typescript
interface CommentReport {
  id: string
  reportedBy: string
  reportedByEmail: string
  reason: string
  createdAt: string
  status: 'pending' | 'reviewed' | 'dismissed'
  reviewedBy?: string
  reviewedAt?: string
}
```

### Firestore Collections

1. **`comments`** - Stores all comments and replies
   - Top-level comments: `parentId` is null
   - Replies: `parentId` references parent comment

2. **`comment_reports`** - Stores all comment reports
   - Linked to comments via `commentId`
   - Filtered by `status` for admin dashboard

### API Routes

#### Comment Operations
- `POST /api/comments/[commentId]/react` - Toggle like/unlike
- `POST /api/comments/[commentId]/report` - Report a comment
- `PUT /api/comments/[commentId]` - Edit comment
- `DELETE /api/comments/[commentId]` - Delete comment

#### Admin Operations
- `GET /api/admin/comments/reports` - List all reported comments
- `POST /api/admin/comments/reports` - Take action on reports
  - Actions: `dismiss`, `hide`, `delete`

### Components

1. **CommentSectionEnhanced** - Main container with real-time listeners
2. **CommentItemEnhanced** - Individual comment with reactions/reporting
3. **CommentForm** - Form for adding/editing comments
4. **ReportModal** - Modal for reporting comments

## Setup Instructions

### 1. Firestore Indexes

Deploy the Firestore indexes:

```bash
firebase deploy --only firestore:indexes
```

The indexes are defined in `firestore.indexes.json`:
- Comments by postId + createdAt (for real-time queries)
- Reports by status + createdAt (for admin dashboard)

### 2. Firestore Security Rules

Add these rules to your `firestore.rules`:

```javascript
// Comments collection
match /comments/{commentId} {
  // Anyone can read active comments
  allow read: if resource.data.status == 'active'
               || request.auth != null;

  // Authenticated users can create comments
  allow create: if request.auth != null
                && request.resource.data.userId == request.auth.uid;

  // Users can edit their own comments
  allow update: if request.auth != null
                && resource.data.userId == request.auth.uid;

  // Users can delete their own comments, admins can delete any
  allow delete: if request.auth != null
                && (resource.data.userId == request.auth.uid
                    || get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.isAdmin == true);
}

// Comment reports collection
match /comment_reports/{reportId} {
  // Only admins can read reports
  allow read: if request.auth != null
              && get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.isAdmin == true;

  // Authenticated users can create reports
  allow create: if request.auth != null
                && request.resource.data.reportedBy == request.auth.uid;

  // Only admins can update reports
  allow update: if request.auth != null
                && get(/databases/$(database)/documents/profiles/$(request.auth.uid)).data.isAdmin == true;
}
```

### 3. Environment Variables

Ensure Firebase configuration is set in `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## Usage

### For Blog Readers

1. **Comment**: Sign in and use the comment form
2. **Reply**: Click "Reply" on any comment
3. **Like**: Click the heart icon to like/unlike
4. **Report**: Click "Report" to flag inappropriate content
5. **Sort**: Use the dropdown to change comment order

### For Admins

1. Navigate to `/admin/comments` to access the moderation dashboard
2. Review reported comments and their reasons
3. Take appropriate action:
   - **Dismiss** if the report is invalid
   - **Hide** to keep the comment but hide from public
   - **Delete** to permanently remove

## Validation

All comment operations are validated using Zod schemas:
- Minimum content length: 1 character
- Maximum content length: 5000 characters
- Report reasons: 10-500 characters

## Performance Considerations

### Real-time Listeners
- Automatically cleaned up when component unmounts
- Only listens to comments for the current post
- Efficient querying with Firestore indexes

### Optimistic Updates
- Reduces perceived latency
- Provides instant feedback
- Reverts on error to maintain consistency

## Future Enhancements

Potential additions for future versions:

1. **Edit History** - Track comment edits
2. **Mentions** - @mention other users
3. **Notifications** - Notify users of replies
4. **Email Digests** - Daily/weekly comment summaries
5. **Pagination** - Load comments in batches for posts with many comments
6. **Rich Text** - Markdown support in comments
7. **Attachments** - Images/files in comments
8. **Reactions** - Multiple reaction types (not just like)
9. **Comment Search** - Search within comments
10. **Threading** - Deeper nesting levels

## Troubleshooting

### Comments not updating in real-time
- Check Firestore indexes are deployed
- Verify Firebase configuration
- Check browser console for errors

### Reports not showing in admin dashboard
- Verify admin status in Firestore `profiles` collection
- Check Firestore security rules
- Ensure reports have `status: 'pending'`

### Like button not working
- Verify user is authenticated
- Check API route responses in Network tab
- Ensure Firestore permissions allow updates

## Support

For issues or questions, please check:
- Browser console for errors
- Network tab for failed API calls
- Firestore console for data structure
