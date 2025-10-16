# Security Documentation

## Overview

This document outlines the security measures implemented in DevTalks and best practices for maintaining security.

## Security Fixes Implemented

### 1. TypeScript Strict Mode ✅

**Status:** Enabled

**Changes:**
- Enabled `strict: true` in `tsconfig.json`
- Added `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`
- Added `noFallthroughCasesInSwitch` and `forceConsistentCasingInFileNames`

**Benefits:**
- Catches type errors at compile time
- Prevents null/undefined errors
- Improves code quality and maintainability

### 2. Authentication Middleware ✅

**Status:** Implemented

**Files:**
- `/src/middleware.ts` - Edge middleware for route protection
- `/src/lib/auth-middleware.ts` - API route authentication

**Features:**
- Server-side token validation
- Protected admin routes at edge
- Proper error handling
- Redirect unauthenticated users to login

**Protected Routes:**
- `/admin/*` - Requires admin privileges
- `/user/profile` - Requires authentication

### 3. Security Headers ✅

**Status:** Configured

**Implementation:** `/src/middleware.ts`

**Headers Applied:**
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-XSS-Protection: 1; mode=block` - XSS protection
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer info
- `Permissions-Policy` - Restricts browser features
- `Strict-Transport-Security` (production only) - Forces HTTPS
- `Content-Security-Policy` - Prevents XSS and injection attacks

### 4. Server/Client Code Separation ✅

**Status:** Implemented

**Structure:**
```
/src/lib/server/
  - firebase-admin.ts (Server-side Firebase Admin SDK)
  - admin-check.ts (Admin verification)
  - db-operations.ts (Database operations)
  - index.ts (Exports)
```

**Rules:**
- All files marked with `'use server'`
- Firestore access only through server functions
- No direct database access from client
- Client-safe API wrappers

### 5. Firebase Admin Security ✅

**Status:** Fixed

**Changes:**
- Removed mock implementation from production
- Implemented proper error handling
- Using custom claims for admin status
- Removed public admin email lookup

**Admin Management:**
```bash
# Set admin privileges using custom claims
npx tsx src/scripts/setup-admin-claims.ts user@example.com
```

**Custom Claims:**
- Admin status stored in Firebase custom claims
- Verified server-side only
- Not exposed to client

### 6. Input Validation ✅

**Status:** Implemented with Zod

**Files:**
- `/src/lib/validation.ts` - Validation schemas
- `/src/lib/rate-limit.ts` - Rate limiting

**Schemas:**
- `blogPostSchema` - Blog post validation
- `commentSchema` - Comment validation
- `projectSchema` - Project validation
- `announcementSchema` - Announcement validation
- `profileSchema` - User profile validation
- `contactSchema` - Contact form validation
- `imageUploadSchema` - File upload validation

**Sanitization:**
- `sanitizeString()` - Remove XSS vectors
- `sanitizeHtml()` - Basic HTML sanitization
- URL, email, and slug validation helpers

### 7. Environment Variables Security ✅

**Status:** Secured

**Files:**
- `.env.example` - Template with instructions
- `/src/lib/env.ts` - Type-safe environment access
- `.gitignore` - Updated to exclude sensitive files

**Best Practices:**
- Server-only variables never exposed to client
- Validation on server startup
- Type-safe access patterns
- Clear documentation

## Security Best Practices

### Authentication

1. **Always verify tokens server-side:**
   ```typescript
   import { verifyAuthToken } from '@/lib/auth-middleware'

   const authContext = await verifyAuthToken(request)
   ```

2. **Check admin privileges:**
   ```typescript
   import { isUserAdmin } from '@/lib/server/admin-check'

   const isAdmin = await isUserAdmin(userId)
   ```

3. **Use the withAuth wrapper:**
   ```typescript
   export async function POST(request: NextRequest) {
     return withAuth(request, async (authContext) => {
       // Your protected code here
     }, true) // true = require admin
   }
   ```

### Input Validation

1. **Validate all user inputs:**
   ```typescript
   import { validateRequestBody, commentSchema } from '@/lib/validation'

   const result = await validateRequestBody(request, commentSchema)
   if (!result.success) {
     return result.error
   }
   ```

2. **Sanitize user content:**
   ```typescript
   import { sanitizeString } from '@/lib/validation'

   const clean = sanitizeString(userInput)
   ```

### Rate Limiting

1. **Apply rate limits to API routes:**
   ```typescript
   import { rateLimit } from '@/lib/rate-limit'

   const limited = rateLimit(request, {
     limit: 10,
     windowMs: 60000
   })

   if (limited) return limited
   ```

### Database Access

1. **Only use server-side functions:**
   ```typescript
   import { getDocument, createDocument } from '@/lib/server/db-operations'

   const data = await getDocument('posts', postId)
   ```

2. **Never import Firestore directly in client code**

### Environment Variables

1. **Use the env utility:**
   ```typescript
   import { serverEnv, clientEnv } from '@/lib/env'

   // Server-side only
   const privateKey = serverEnv.firebase.privateKey

   // Client-side safe
   const apiKey = clientEnv.firebase.apiKey
   ```

2. **Never log sensitive variables**

## Firestore Security Rules

Located in `/firestore.rules`

**Key Rules:**
- Users can only read/write their own data
- Admin verification required for admin operations
- Comments must be authenticated
- Rate limiting through security rules

## Content Security Policy

The CSP is configured in `/src/middleware.ts`:

**Allowed Sources:**
- Scripts: Self, Google (reCAPTCHA)
- Styles: Self, inline (for Next.js)
- Images: Self, Firebase Storage, Google user photos
- Connections: Firebase services

**Restrictions:**
- No `eval()` in production
- No inline scripts (except Next.js)
- No object/embed tags
- Frame ancestors denied

## Known Limitations

1. **In-Memory Rate Limiting:**
   - Current implementation uses in-memory storage
   - Won't work in serverless/multi-instance deployments
   - **Recommendation:** Use Redis or similar for production

2. **CSP and Next.js:**
   - `'unsafe-inline'` required for styles (Next.js limitation)
   - `'unsafe-eval'` required for development (Next.js HMR)

3. **Admin Email Check:**
   - Still used for initial setup
   - Should transition to custom claims only

## Security Checklist

### Before Deployment

- [ ] All environment variables set in hosting platform
- [ ] `.env.local` not committed to git
- [ ] Admin privileges set via custom claims
- [ ] Firebase security rules deployed
- [ ] HTTPS enabled
- [ ] CSP headers configured
- [ ] Rate limiting tested
- [ ] All API routes protected
- [ ] Input validation on all forms
- [ ] Error messages don't leak sensitive info

### Regular Maintenance

- [ ] Review Firebase security rules monthly
- [ ] Audit admin user list quarterly
- [ ] Update dependencies (npm audit)
- [ ] Review CSP violations
- [ ] Monitor rate limit logs
- [ ] Check for unused environment variables

## Incident Response

### If Credentials are Compromised

1. Immediately rotate Firebase service account key
2. Update `FIREBASE_PRIVATE_KEY` in production
3. Invalidate all user sessions
4. Review access logs
5. Force password reset for affected users

### If Admin Account is Compromised

1. Remove admin custom claims immediately:
   ```bash
   npx tsx src/scripts/setup-admin-claims.ts --revoke user@example.com
   ```
2. Review recent admin actions
3. Check for unauthorized changes
4. Enable 2FA if not already enabled

## Security Contacts

For security issues, please contact:
- Email: security@your-domain.com
- Do not open public issues for security vulnerabilities

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Firebase Security](https://firebase.google.com/docs/rules)
- [CSP Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

Last Updated: October 16, 2025
