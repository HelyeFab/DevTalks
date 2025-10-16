# Database Schema

Firestore database structure for DevTalks.

## Overview

DevTalks uses Firebase Firestore, a NoSQL document database. Data is organized into collections of documents.

## Collections

### 1. `users` / `profiles`

User profile information.

**Document Structure:**

```typescript
{
  id: string;                  // Auto-generated Firebase UID
  email: string;               // User email
  displayName: string;         // Full name
  photoURL?: string;           // Profile picture URL
  bio?: string;                // User bio
  website?: string;            // Personal website
  github?: string;             // GitHub username
  twitter?: string;            // Twitter handle
  isAdmin?: boolean;           // Admin status (optional)
  createdAt: Timestamp;        // Account creation date
  updatedAt?: Timestamp;       // Last update date
}
```

**Example:**

```json
{
  "id": "abc123",
  "email": "john@example.com",
  "displayName": "John Doe",
  "photoURL": "https://example.com/avatar.jpg",
  "bio": "Full-stack developer",
  "createdAt": "2025-10-16T00:00:00.000Z"
}
```

**Indexes:**
- `email` (ascending)
- `createdAt` (descending)

### 2. `blog_posts`

Firestore-based blog posts.

**Document Structure:**

```typescript
{
  id: string;                  // Auto-generated
  title: string;               // Post title
  slug: string;                // URL-friendly identifier
  content: string;             // Markdown content
  excerpt?: string;            // Short description
  author: string;              // Author name
  authorId: string;            // User ID
  publishedAt: Timestamp;      // Publication date
  updatedAt?: Timestamp;       // Last modified date
  tags: string[];              // Category tags
  image?: string;              // Featured image URL
  upvotes: number;             // Upvote count
  published: boolean;          // Publication status
  views?: number;              // View count (if implemented)
}
```

**Example:**

```json
{
  "id": "post-123",
  "title": "Getting Started with Next.js",
  "slug": "getting-started-nextjs",
  "content": "# Introduction\n\nNext.js is...",
  "excerpt": "Learn the basics of Next.js",
  "author": "John Doe",
  "authorId": "abc123",
  "publishedAt": "2025-10-16T00:00:00.000Z",
  "tags": ["nextjs", "react", "tutorial"],
  "image": "/images/nextjs-post.jpg",
  "upvotes": 42,
  "published": true
}
```

**Indexes:**
- `slug` (ascending)
- `publishedAt` (descending)
- `published` + `publishedAt` (composite)
- `tags` (array-contains)

**Subcollections:**

#### `blog_posts/{postId}/upvotes`

Tracks user upvotes for each post.

```typescript
{
  userId: string;              // User who upvoted
  createdAt: Timestamp;        // When upvoted
}
```

Document ID: `{userId}`

### 3. `comments`

Top-level comments collection for both blog posts and MDX posts.

**Document Structure:**

```typescript
{
  id: string;                  // Auto-generated
  content: string;             // Comment text (markdown)
  userId: string;              // Commenter user ID
  userName: string;            // Commenter name
  userEmail: string;           // Commenter email
  userAvatar?: string;         // Commenter avatar URL
  postId: string;              // Associated post ID
  parentId?: string;           // Parent comment ID (for replies)
  createdAt: Timestamp;        // Creation date
  updatedAt?: Timestamp;       // Last update date
  deleted?: boolean;           // Soft delete flag
}
```

**Example:**

```json
{
  "id": "comment-456",
  "content": "Great post! Very informative.",
  "userId": "abc123",
  "userName": "John Doe",
  "userEmail": "john@example.com",
  "postId": "post-123",
  "parentId": null,
  "createdAt": "2025-10-16T10:00:00.000Z"
}
```

**Indexes:**
- `postId` + `createdAt` (composite, descending)
- `userId` + `createdAt` (composite)
- `parentId` (ascending)

### 4. `post_upvotes`

Global upvotes collection (separate from subcollection).

**Document Structure:**

```typescript
{
  userId: string;              // User who upvoted
  postId: string;              // Post that was upvoted
  postTitle?: string;          // Post title (for reference)
  postSlug?: string;           // Post slug (for reference)
  createdAt: Timestamp;        // When upvoted
}
```

Document ID: `{postId}_{userId}`

**Example:**

```json
{
  "userId": "abc123",
  "postId": "post-123",
  "postTitle": "Getting Started with Next.js",
  "postSlug": "getting-started-nextjs",
  "createdAt": "2025-10-16T11:00:00.000Z"
}
```

**Indexes:**
- `userId` + `createdAt` (composite)
- `postId` + `userId` (composite)

### 5. `projects`

Project showcase items.

**Document Structure:**

```typescript
{
  id: string;                  // Auto-generated
  title: string;               // Project name
  slug: string;                // URL-friendly identifier
  description: string;         // Short description
  content: string;             // Detailed markdown content
  technologies: string[];      // Tech stack
  image: string;               // Project image URL
  githubUrl?: string;          // GitHub repository
  liveUrl?: string;            // Live demo URL
  featured: boolean;           // Featured status
  createdAt: Timestamp;        // Creation date
  updatedAt?: Timestamp;       // Last update date
}
```

**Example:**

```json
{
  "id": "project-789",
  "title": "Weather Dashboard",
  "slug": "weather-dashboard",
  "description": "Real-time weather application",
  "content": "# Weather Dashboard\n\nA full-featured...",
  "technologies": ["React", "Next.js", "OpenWeather API"],
  "image": "/images/projects/weather-app.jpg",
  "githubUrl": "https://github.com/user/weather-dashboard",
  "liveUrl": "https://weather-dashboard.vercel.app",
  "featured": true,
  "createdAt": "2025-10-16T00:00:00.000Z"
}
```

**Indexes:**
- `slug` (ascending)
- `featured` + `createdAt` (composite)
- `technologies` (array-contains)

### 6. `announcements`

Platform-wide announcements.

**Document Structure:**

```typescript
{
  id: string;                  // Auto-generated
  title: string;               // Announcement title
  slug: string;                // URL-friendly identifier
  content: string;             // Markdown content
  type: 'info' | 'warning' | 'success' | 'error';  // Type
  priority: 'low' | 'medium' | 'high';             // Priority
  active: boolean;             // Visibility status
  createdAt: Timestamp;        // Creation date
  updatedAt?: Timestamp;       // Last update date
}
```

**Example:**

```json
{
  "id": "announcement-101",
  "title": "New Features Released",
  "slug": "new-features-released",
  "content": "We've added several new features...",
  "type": "info",
  "priority": "medium",
  "active": true,
  "createdAt": "2025-10-16T00:00:00.000Z"
}
```

**Indexes:**
- `slug` (ascending)
- `active` + `priority` + `createdAt` (composite)
- `createdAt` (descending)

### 7. `env`

Environment configuration (admin settings).

**Document: `admin`**

```typescript
{
  adminEmail: string;          // Admin user email
}
```

**Example:**

```json
{
  "adminEmail": "admin@devtalks.com"
}
```

## Data Relationships

### One-to-Many

```
User ─┬─> Posts (author)
      ├─> Comments
      └─> Upvotes

Post ─┬─> Comments
      └─> Upvotes
```

### Hierarchical

```
Post
  └─> Comments
        └─> Replies (comments with parentId)
```

## Query Patterns

### Get All Published Posts

```typescript
const posts = await db
  .collection('blog_posts')
  .where('published', '==', true)
  .orderBy('publishedAt', 'desc')
  .limit(10)
  .get();
```

### Get Comments for a Post

```typescript
const comments = await db
  .collection('comments')
  .where('postId', '==', postId)
  .where('parentId', '==', null)  // Top-level only
  .orderBy('createdAt', 'desc')
  .get();
```

### Get User's Upvoted Posts

```typescript
const upvotes = await db
  .collection('post_upvotes')
  .where('userId', '==', userId)
  .orderBy('createdAt', 'desc')
  .get();
```

### Get Featured Projects

```typescript
const projects = await db
  .collection('projects')
  .where('featured', '==', true)
  .orderBy('createdAt', 'desc')
  .get();
```

## Data Validation

### Firestore Rules

Data validation is enforced through Firestore Security Rules (see `/config/firestore.rules`).

Key validations:

- **Authentication**: Most writes require authentication
- **Ownership**: Users can only modify their own content
- **Admin**: Some operations require admin privileges
- **Data Structure**: Rules validate required fields

### Application-Level Validation

Additional validation in API routes using Zod:

```typescript
import { z } from 'zod';

const postSchema = z.object({
  title: z.string().min(3).max(100),
  content: z.string().min(10),
  tags: z.array(z.string()).max(5),
});
```

## Data Migration

When schema changes are needed:

1. **Plan Migration**: Document changes
2. **Test on Dev**: Test with development data
3. **Create Script**: Write migration script
4. **Backup Data**: Export current data
5. **Run Migration**: Execute migration
6. **Verify**: Check data integrity
7. **Update Rules**: Deploy new security rules

### Example Migration Script

```typescript
// Migrate posts to add new field
const posts = await db.collection('blog_posts').get();

const batch = db.batch();
posts.docs.forEach(doc => {
  batch.update(doc.ref, {
    views: 0,  // Add new field
  });
});

await batch.commit();
```

## Performance Optimization

### Indexes

Create compound indexes for common queries:

```json
{
  "indexes": [
    {
      "collectionGroup": "blog_posts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "published", "order": "ASCENDING" },
        { "fieldPath": "publishedAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### Denormalization

For performance, some data is denormalized:

- Author name stored in posts (not just authorId)
- Post title/slug stored in upvotes
- User info cached in comments

### Pagination

Always use pagination for large collections:

```typescript
const pageSize = 10;
const startAfter = lastDoc;

const query = db
  .collection('blog_posts')
  .orderBy('publishedAt', 'desc')
  .startAfter(startAfter)
  .limit(pageSize);
```

## Backup Strategy

### Automated Backups

Set up automated Firestore exports:

```bash
gcloud firestore export gs://your-backup-bucket/$(date +%Y%m%d)
```

### Manual Backup

```bash
# Export all data
firebase firestore:export backup.json

# Import data
firebase firestore:import backup.json
```

## Monitoring

Monitor database metrics:

- **Read/Write Operations**: Stay within quotas
- **Document Count**: Track growth
- **Index Performance**: Check slow queries
- **Error Rates**: Monitor failures

## References

- [Firestore Data Model](https://firebase.google.com/docs/firestore/data-model)
- [Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Indexes](https://firebase.google.com/docs/firestore/query-data/indexing)

---

**Last updated:** 2025-10-16
