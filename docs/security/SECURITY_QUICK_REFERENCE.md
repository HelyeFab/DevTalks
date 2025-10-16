# Security Quick Reference Guide

Quick reference for developers working on DevTalks.

## 🔐 Authentication

### Protecting API Routes

```typescript
import { withAuth } from '@/lib/auth-middleware'
import { NextRequest } from 'next/server'

// Require authentication only
export async function POST(request: NextRequest) {
  return withAuth(request, async (authContext) => {
    const { userId, email, isAdmin } = authContext
    // Your code here
  })
}

// Require admin privileges
export async function DELETE(request: NextRequest) {
  return withAuth(request, async (authContext) => {
    // Only admins can access this
  }, true) // true = requireAdmin
}
```

### Checking Admin Status

```typescript
import { isUserAdmin } from '@/lib/server/admin-check'

const isAdmin = await isUserAdmin(userId)
```

### Client-Side Auth Check

```typescript
import { isAdmin } from '@/lib/auth'

const user = auth.currentUser
const adminStatus = await isAdmin(user)
```

## ✅ Input Validation

### Validating Request Body

```typescript
import { validateRequestBody, commentSchema } from '@/lib/validation'

const result = await validateRequestBody(request, commentSchema)
if (!result.success) {
  return result.error // Returns 400 with error details
}

const validatedData = result.data // Type-safe!
```

### Available Schemas

- `blogPostSchema` - Blog posts
- `commentSchema` - Comments
- `projectSchema` - Projects
- `announcementSchema` - Announcements
- `profileSchema` - User profiles
- `contactSchema` - Contact form
- `imageUploadSchema` - File uploads
- `upvoteSchema` - Upvotes

### Sanitizing User Input

```typescript
import { sanitizeString, sanitizeHtml } from '@/lib/validation'

const cleanText = sanitizeString(userInput)
const cleanHtml = sanitizeHtml(userHtml)
```

## 🛡️ Rate Limiting

### Apply Rate Limiting

```typescript
import { rateLimit } from '@/lib/rate-limit'

const limited = rateLimit(request, {
  userId: authContext.userId,
  limit: 10, // max requests
  windowMs: 60000, // 1 minute
  message: 'Too many comments'
})

if (limited) return limited
```

### Using the Wrapper

```typescript
import { withRateLimit } from '@/lib/rate-limit'

export const POST = withRateLimit(
  async (request: NextRequest) => {
    // Your handler
  },
  {
    limit: 5,
    windowMs: 60000
  }
)
```

## 💾 Database Operations

### Server-Side Only

```typescript
import {
  getDocument,
  getCollection,
  createDocument,
  updateDocument,
  deleteDocument
} from '@/lib/server/db-operations'

// Get a document
const post = await getDocument('posts', postId)

// Get collection with filtering
const posts = await getCollection('posts', {
  where: { field: 'published', operator: '==', value: true },
  orderBy: { field: 'createdAt', direction: 'desc' },
  limit: 10
})

// Create
const newPost = await createDocument('posts', data)

// Update
await updateDocument('posts', postId, { title: 'New Title' })

// Delete
await deleteDocument('posts', postId)
```

## 🌍 Environment Variables

### Type-Safe Access

```typescript
import { serverEnv, clientEnv } from '@/lib/env'

// Client-side (safe to expose)
const apiKey = clientEnv.firebase.apiKey

// Server-side (keep secret)
const privateKey = serverEnv.firebase.privateKey

// Helper functions
import { isDevelopment, isProduction } from '@/lib/env'

if (isProduction()) {
  // Production-only code
}
```

### Validation

```typescript
import { validateEnv, logEnvStatus } from '@/lib/env'

const { valid, missing } = validateEnv()
if (!valid) {
  console.error('Missing variables:', missing)
}
```

## 🔧 Common Patterns

### Protected API Route with Validation and Rate Limiting

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-middleware'
import { validateRequestBody, commentSchema } from '@/lib/validation'
import { rateLimit } from '@/lib/rate-limit'
import { createDocument } from '@/lib/server/db-operations'

export async function POST(request: NextRequest) {
  return withAuth(request, async (authContext) => {
    // Rate limiting
    const limited = rateLimit(request, {
      userId: authContext.userId,
      limit: 10,
      windowMs: 60000
    })
    if (limited) return limited

    // Validation
    const result = await validateRequestBody(request, commentSchema)
    if (!result.success) return result.error

    // Database operation
    const comment = await createDocument('comments', {
      ...result.data,
      userId: authContext.userId
    })

    return NextResponse.json(comment)
  })
}
```

### Admin-Only Route

```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (authContext) => {
    const { id } = await params

    await deleteDocument('posts', id)

    return NextResponse.json({ success: true })
  }, true) // Require admin
}
```

## 📋 Checklists

### Creating New API Route

- [ ] Import and use `withAuth` for authentication
- [ ] Add rate limiting if needed
- [ ] Validate all input with Zod schemas
- [ ] Sanitize user-provided strings
- [ ] Use server-side DB operations only
- [ ] Return proper error responses
- [ ] Add error logging

### Creating New Form

- [ ] Create Zod schema in `/src/lib/validation.ts`
- [ ] Validate on client-side (UX)
- [ ] Validate on server-side (security)
- [ ] Sanitize all text inputs
- [ ] Add rate limiting to submission endpoint
- [ ] Show clear error messages
- [ ] Handle loading and error states

### Deploying to Production

- [ ] Set all environment variables
- [ ] Remove any console.logs with sensitive data
- [ ] Test authentication flow
- [ ] Test admin access
- [ ] Verify rate limiting works
- [ ] Check security headers in browser
- [ ] Test CSP doesn't break features
- [ ] Deploy Firestore security rules
- [ ] Enable HTTPS
- [ ] Test error pages

## 🚨 Security Incidents

### If Credentials Leaked

1. Immediately revoke the compromised key
2. Generate new credentials
3. Update production environment variables
4. Review access logs
5. Notify affected users if needed

### If Admin Account Compromised

1. Run: `npx tsx src/scripts/setup-admin-claims.ts --revoke user@email.com`
2. Review recent admin actions
3. Check for unauthorized changes
4. Reset password
5. Enable 2FA

## 📚 Further Reading

- [SECURITY.md](./SECURITY.md) - Detailed security documentation
- [SECURITY_FIXES_REPORT.md](./SECURITY_FIXES_REPORT.md) - Complete security audit
- [.env.example](./.env.example) - Environment variables template

## 🆘 Need Help?

- Check [SECURITY.md](./SECURITY.md) for detailed docs
- Review examples in existing API routes
- Ask in team chat for security questions
- Never commit credentials or secrets

---

Last Updated: October 16, 2025
