# Authentication & Authorization Module

Comprehensive authentication and authorization utilities for the DevTalks Next.js application.

## Overview

This module provides:

- **Token Validation**: Firebase Admin SDK-based token verification
- **Role Management**: Admin, Moderator, and User roles with hierarchical permissions
- **API Route Protection**: Middleware for securing API endpoints
- **Rate Limiting**: Configurable rate limiting for API routes
- **Server-Side Auth**: Authentication utilities for Server Components
- **CORS Support**: Built-in CORS handling for API routes

## Module Structure

```
src/lib/auth/
├── auth-utils.ts       # Core authentication utilities
├── api-auth.ts         # API route authentication middleware
├── rate-limit.ts       # Rate limiting functionality
├── server-auth.ts      # Server component authentication
├── index.ts           # Module exports
└── README.md          # Documentation (this file)
```

## Installation & Setup

The module is already integrated. To use it, simply import from `@/lib/auth`:

```typescript
import { withApiAuth, requireAdmin, withRateLimit } from '@/lib/auth'
```

## Usage Examples

### 1. API Route Authentication

#### Protect an API route (require authentication)

```typescript
// src/app/api/profile/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withApiAuth, AuthContext } from '@/lib/auth'

export const GET = withApiAuth(
  async (request: NextRequest, context, authContext: AuthContext) => {
    // authContext.user is guaranteed to exist here
    return NextResponse.json({
      uid: authContext.user.uid,
      email: authContext.user.email,
      role: authContext.user.role
    })
  },
  { requireAuth: true }
)
```

#### Protect an admin-only route

```typescript
// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, AuthContext } from '@/lib/auth'

export const DELETE = withAdminAuth(
  async (request: NextRequest, context, authContext: AuthContext) => {
    // User is guaranteed to be admin here
    const { userId } = await request.json()
    // Delete user logic...
    return NextResponse.json({ success: true })
  }
)
```

#### Protect a moderator route

```typescript
// src/app/api/moderate/content/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withModeratorAuth, AuthContext } from '@/lib/auth'

export const POST = withModeratorAuth(
  async (request: NextRequest, context, authContext: AuthContext) => {
    // User is guaranteed to be moderator or admin
    const { contentId, action } = await request.json()
    // Moderate content logic...
    return NextResponse.json({ success: true })
  }
)
```

#### Optional authentication

```typescript
// src/app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getOptionalAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const authContext = await getOptionalAuth(request)

  // Check if user liked the post (only if authenticated)
  const isLiked = authContext
    ? await checkIfUserLiked(authContext.user.uid, postId)
    : false

  return NextResponse.json({ isLiked, post: postData })
}
```

### 2. Rate Limiting

#### Apply rate limiting to an API route

```typescript
// src/app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/auth'

export const POST = withRateLimit(
  async (request: NextRequest) => {
    // Handle contact form submission
    return NextResponse.json({ success: true })
  },
  {
    limit: 5,                    // 5 requests
    windowMs: 60 * 60 * 1000,    // per hour
    message: 'Too many requests, please try again later.'
  }
)
```

#### Use predefined rate limit presets

```typescript
import { withRateLimit, RateLimitPresets } from '@/lib/auth'

// Strict: 5 requests per 15 minutes (for sensitive operations)
export const POST = withRateLimit(handler, RateLimitPresets.strict)

// Moderate: 20 requests per minute (for write operations)
export const POST = withRateLimit(handler, RateLimitPresets.moderate)

// Generous: 100 requests per minute (for read operations)
export const GET = withRateLimit(handler, RateLimitPresets.generous)

// Auth: 3 requests per 5 minutes (for authentication attempts)
export const POST = withRateLimit(handler, RateLimitPresets.auth)
```

#### Combine authentication and rate limiting

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit, withAdminAuth, RateLimitPresets } from '@/lib/auth'

export const POST = withRateLimit(
  withAdminAuth(
    async (request: NextRequest, context, authContext) => {
      // Admin-only logic with rate limiting
      return NextResponse.json({ success: true })
    }
  ),
  RateLimitPresets.moderate
)
```

### 3. Server Component Authentication

#### Require authentication in a Server Component

```typescript
// src/app/profile/page.tsx
import { requireAuth } from '@/lib/auth'

export default async function ProfilePage() {
  const user = await requireAuth()

  return (
    <div>
      <h1>Profile</h1>
      <p>Welcome {user.name}</p>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
    </div>
  )
}
```

#### Require admin access in a Server Component

```typescript
// src/app/admin/page.tsx
import { requireAdmin } from '@/lib/auth'

export default async function AdminPage() {
  const admin = await requireAdmin()

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Logged in as: {admin.email}</p>
    </div>
  )
}
```

#### Optional authentication in a Server Component

```typescript
// src/app/page.tsx
import { getOptionalServerAuth } from '@/lib/auth'

export default async function HomePage() {
  const user = await getOptionalServerAuth()

  return (
    <div>
      {user ? (
        <p>Welcome back, {user.name}!</p>
      ) : (
        <p>Welcome, guest!</p>
      )}
    </div>
  )
}
```

### 4. User Role Management

#### Promote a user to moderator

```typescript
import { promoteToModerator } from '@/lib/auth'

// In an admin API route
await promoteToModerator(userId)
```

#### Promote a user to admin

```typescript
import { promoteToAdmin } from '@/lib/auth'

// In an admin API route
await promoteToAdmin(userId)
```

#### Check user roles

```typescript
import { hasRole, AuthUser } from '@/lib/auth'

const user: AuthUser = authContext.user

if (hasRole(user, 'moderator')) {
  // User is moderator or admin
}

if (hasRole(user, 'admin')) {
  // User is admin
}
```

#### Set custom claims

```typescript
import { setUserClaims } from '@/lib/auth'

await setUserClaims(userId, {
  premium: true,
  subscriptionLevel: 'gold'
})
```

### 5. Advanced Token Operations

#### Revoke user tokens (force re-authentication)

```typescript
import { revokeUserTokens } from '@/lib/auth'

// Force user to re-authenticate
await revokeUserTokens(suspiciousUserId)
```

#### Disable a user account

```typescript
import { disableUser } from '@/lib/auth'

await disableUser(bannedUserId)
```

#### Enable a previously disabled account

```typescript
import { enableUser } from '@/lib/auth'

await enableUser(userId)
```

### 6. Error Handling

#### Create standardized API errors

```typescript
import { createApiError } from '@/lib/auth'

// 400 Bad Request
return createApiError('Invalid input', 400)

// 401 Unauthorized
return createApiError('Authentication required', 401)

// 403 Forbidden
return createApiError('Insufficient permissions', 403)

// 404 Not Found
return createApiError('Resource not found', 404)

// 500 Internal Server Error
return createApiError('Server error', 500)
```

#### Validate request body

```typescript
import { validateRequestBody } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1),
  content: z.string().min(10)
})

export const POST = withApiAuth(async (request, context, authContext) => {
  const result = await validateRequestBody(request, schema)
  if (result.error) return result.error

  const { title, content } = result.data
  // Use validated data...
})
```

## API Reference

### Auth Utils

- `verifyAuthToken(idToken: string)` - Verifies Firebase ID token
- `extractBearerToken(authHeader: string)` - Extracts token from Authorization header
- `hasRole(user: AuthUser, role: UserRole)` - Checks if user has required role
- `getUserByUid(uid: string)` - Gets user info by UID
- `getUserByEmail(email: string)` - Gets user info by email
- `promoteToModerator(uid: string)` - Promotes user to moderator
- `promoteToAdmin(uid: string)` - Promotes user to admin
- `revokeUserTokens(uid: string)` - Revokes all user tokens
- `disableUser(uid: string)` - Disables user account
- `enableUser(uid: string)` - Enables user account

### API Auth

- `withApiAuth(handler, options)` - Wraps API route with authentication
- `withAdminAuth(handler, options)` - Wraps API route requiring admin
- `withModeratorAuth(handler, options)` - Wraps API route requiring moderator
- `getOptionalAuth(request)` - Gets auth context without requiring it
- `createApiError(message, status, details)` - Creates error response
- `createApiSuccess(data, status, headers)` - Creates success response
- `validateRequestBody(request, schema)` - Validates request body

### Rate Limiting

- `withRateLimit(handler, options)` - Wraps API route with rate limiting
- `applyRateLimit(request, options, userId)` - Applies rate limit check
- `resetRateLimit(request, options, userId)` - Resets rate limit for key
- `RateLimitPresets` - Predefined rate limit configurations

### Server Auth

- `requireAuth(redirectTo?)` - Requires authentication (redirects if not)
- `requireAdmin(redirectTo?)` - Requires admin role (redirects if not)
- `requireModerator(redirectTo?)` - Requires moderator role (redirects if not)
- `getOptionalServerAuth()` - Gets optional auth in Server Component
- `isAuthenticated()` - Checks if user is authenticated
- `isAdmin()` - Checks if user is admin
- `isModerator()` - Checks if user is moderator

## Types

```typescript
// User role hierarchy: user < moderator < admin
type UserRole = 'admin' | 'moderator' | 'user'

interface AuthUser {
  uid: string
  email: string | undefined
  name: string | undefined
  displayName: string | undefined
  photoURL: string | undefined
  role: UserRole
  isAdmin: boolean
  isModerator: boolean
  customClaims: Record<string, unknown>
}

interface AuthContext {
  user: AuthUser
  token: string
}

interface ApiAuthOptions {
  requireAuth?: boolean
  requireAdmin?: boolean
  requireRole?: UserRole
  unauthorizedMessage?: string
  forbiddenMessage?: string
}

interface RateLimitOptions {
  limit?: number          // Max requests in window
  windowMs?: number       // Time window in milliseconds
  message?: string        // Custom error message
  keyPrefix?: string      // Custom key prefix
  useUserId?: boolean     // Use user ID for rate limiting
  useIpAddress?: boolean  // Use IP address for rate limiting
  productionOnly?: boolean // Only enforce in production
}
```

## Security Best Practices

1. **Always use HTTPS in production** - Tokens should never be transmitted over HTTP
2. **Implement proper CORS policies** - The module includes CORS headers, but configure them for your domain
3. **Use rate limiting on sensitive endpoints** - Especially authentication and write operations
4. **Validate all input data** - Use the `validateRequestBody` helper with Zod schemas
5. **Log security events** - The module logs authentication failures and unauthorized access attempts
6. **Revoke tokens for suspicious activity** - Use `revokeUserTokens` when needed
7. **Use role hierarchy properly** - Admin > Moderator > User
8. **Keep Firebase Admin credentials secure** - Never expose service account keys

## Migration Guide

### From old auth-middleware.ts

**Before:**
```typescript
import { withAuth } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  return withAuth(request, async (authContext) => {
    // handler
  }, true) // requireAdmin
}
```

**After:**
```typescript
import { withAdminAuth } from '@/lib/auth'

export const POST = withAdminAuth(
  async (request, context, authContext) => {
    // handler
  }
)
```

### From old rate-limit.ts

**Before:**
```typescript
import { rateLimit } from '@/lib/rate-limit'

const rateLimitResponse = rateLimit(request, { limit: 10 })
if (rateLimitResponse) return rateLimitResponse
```

**After:**
```typescript
import { withRateLimit } from '@/lib/auth'

export const POST = withRateLimit(handler, { limit: 10, windowMs: 60000 })
```

## Troubleshooting

### Token verification fails

- Ensure Firebase Admin SDK is properly initialized
- Check that the token is being sent in the `Authorization` header as `Bearer <token>`
- Verify the token hasn't expired (Firebase tokens expire after 1 hour)

### Rate limiting not working

- Rate limiting is disabled in development by default (set `productionOnly: false` to enable)
- Check that the in-memory store isn't being cleared (happens on hot reload in development)

### Admin routes returning 403

- Verify the user has admin custom claims set in Firebase
- Check that `isUserAdmin` is correctly reading custom claims
- Ensure the token is fresh (custom claims changes require new token)

## Contributing

When adding new authentication features:

1. Add utility functions to `auth-utils.ts`
2. Add API middleware to `api-auth.ts`
3. Add server-side helpers to `server-auth.ts`
4. Export new functions in `index.ts`
5. Document usage in this README
6. Add JSDoc comments to all exported functions

## License

Part of the DevTalks Next.js project.
