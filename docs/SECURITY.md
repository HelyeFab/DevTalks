# Security Guide

This document outlines the security measures, best practices, and guidelines for the DevTalks platform.

## Table of Contents

- [Overview](#overview)
- [Authentication & Authorization](#authentication--authorization)
- [Firebase Security Rules](#firebase-security-rules)
- [API Security](#api-security)
- [Data Protection](#data-protection)
- [Input Validation](#input-validation)
- [Environment Variables](#environment-variables)
- [Security Best Practices](#security-best-practices)
- [Vulnerability Reporting](#vulnerability-reporting)

## Overview

DevTalks implements multiple layers of security to protect user data and prevent unauthorized access:

1. **Authentication Layer** - Firebase Authentication
2. **Authorization Layer** - Firebase Security Rules + API middleware
3. **Data Validation** - Client and server-side validation
4. **Infrastructure Security** - Firebase and Vercel security features
5. **Content Security** - XSS and injection prevention

## Authentication & Authorization

### Authentication Methods

DevTalks supports the following authentication methods:

1. **Email/Password Authentication**
   - Passwords are hashed and managed by Firebase Auth
   - Email verification available
   - Password reset functionality

2. **Google OAuth**
   - Secure OAuth 2.0 flow
   - No password storage required
   - Automatic profile information sync

### Authentication Flow

```
User Login Request
    │
    ▼
Firebase Auth SDK
    │
    ▼
Token Generation (JWT)
    │
    ▼
Client Storage (httpOnly cookies recommended)
    │
    ▼
Token Sent with Each Request
    │
    ▼
Server Verification (Firebase Admin SDK)
```

### Role-Based Access Control (RBAC)

DevTalks implements two user roles:

#### Regular User Permissions
- Create, read, update, delete own posts
- Create, read, update, delete own comments
- Read all public content
- Update own profile
- Upvote posts

#### Admin Permissions
- All user permissions, plus:
- Create, update, delete any posts
- Create, update, delete any comments
- Manage projects
- Create announcements
- Upload images to storage
- Access admin dashboard

### Admin Verification

Admin status is determined by:

```typescript
// Firestore Rule
function isAdmin() {
  return isAuthenticated() &&
    request.auth.token.email == string(get(/databases/$(database)/documents/env/admin).data.adminEmail);
}

// API Route Verification
const adminEmail = process.env.ADMIN_EMAIL;
const isAdmin = user.email === adminEmail;
```

## Firebase Security Rules

### Firestore Security Rules

Location: `/config/firestore.rules`

#### Key Rules

**1. Profile Access**
```javascript
match /profiles/{userId} {
  allow read: if true;  // Public profiles
  allow write: if request.auth != null && request.auth.uid == userId;  // Own profile only
}
```

**2. Blog Posts**
```javascript
match /blog_posts/{postId} {
  allow read: if true;  // Public read
  allow write: if isAdmin();  // Admin only
}
```

**3. Comments**
```javascript
match /comments/{commentId} {
  allow read: if true;  // Public read
  allow create: if isAuthenticated();  // Any authenticated user
  allow update, delete: if isAuthenticated() &&
    ((resource.data.userId == request.auth.uid) || isAdmin());  // Owner or admin
}
```

**4. Post Upvotes**
```javascript
match /post_upvotes/{upvoteId} {
  allow read: if true;
  allow create: if isAuthenticated();
  allow delete: if isAuthenticated() &&
    resource.data.userId == request.auth.uid;  // Only delete own upvotes
}
```

**5. Projects & Announcements**
```javascript
match /projects/{projectId} {
  allow read: if true;
  allow write: if isAdmin();  // Admin only
}

match /announcements/{announcementId} {
  allow read: if true;
  allow write: if isAdmin();  // Admin only
}
```

### Storage Security Rules

Location: `/config/storage.rules`

#### Image Storage Rules

**1. Public Images**
```javascript
match /images/{imageId} {
  allow read: if true;  // Public read
  allow write, delete: if isAdmin();  // Admin only
}
```

**2. Blog Images**
```javascript
match /blog-images/{imageId} {
  allow read: if true;  // Public read
  allow write, delete: if isAdmin();  // Admin only
}
```

**Production Recommendations:**
```javascript
// Enhanced security for production
match /blog-images/{imageId} {
  allow read: if true;
  allow write: if request.auth != null
    && request.auth.token.email_verified == true
    && request.resource.size < 5 * 1024 * 1024  // Max 5MB
    && request.resource.contentType.matches('image/.*')
    && request.resource.contentType in ['image/jpeg', 'image/png', 'image/webp'];
}
```

## API Security

### API Route Protection

All API routes implement authentication checks:

```typescript
// Example: Protected API Route
import { auth } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify token with Firebase Admin
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Continue with authorized operation...
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}
```

### Admin-Only API Routes

```typescript
export async function POST(request: Request) {
  // Verify authentication
  const decodedToken = await auth.verifyIdToken(token);

  // Check admin status
  const adminEmail = process.env.ADMIN_EMAIL;
  if (decodedToken.email !== adminEmail) {
    return NextResponse.json(
      { error: 'Forbidden - Admin access required' },
      { status: 403 }
    );
  }

  // Admin operation...
}
```

### Rate Limiting

Implement rate limiting to prevent abuse:

```typescript
// Example: Rate limiting (recommended for production)
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
```

### CSRF Protection

Next.js provides built-in CSRF protection for API routes. Ensure you're using:
- POST requests for mutations
- Proper CORS configuration
- SameSite cookies

## Data Protection

### Personal Data Handling

**Data Collected:**
- Email address (for authentication)
- Display name
- Profile picture (optional)
- User-generated content (posts, comments)

**Data Protection Measures:**
1. **Encryption in Transit** - All data transmitted over HTTPS
2. **Encryption at Rest** - Firebase encrypts all data at rest
3. **Access Control** - Strict Firestore security rules
4. **Data Minimization** - Only collect necessary data
5. **User Control** - Users can update/delete their data

### Password Security

- Passwords are never stored in plain text
- Firebase Auth handles all password hashing
- Uses bcrypt with salt
- Minimum password requirements enforced

### Token Security

**JWT Tokens:**
- Short expiration time (1 hour default)
- Automatic refresh mechanism
- Stored securely (httpOnly cookies recommended)
- Transmitted only over HTTPS

## Input Validation

### Client-Side Validation

All user inputs are validated before submission:

```typescript
// Example: Form validation with Zod
import { z } from 'zod';

const postSchema = z.object({
  title: z.string().min(3).max(100),
  content: z.string().min(10).max(10000),
  tags: z.array(z.string()).max(5),
});

// Validate input
const result = postSchema.safeParse(formData);
if (!result.success) {
  // Handle validation errors
}
```

### Server-Side Validation

API routes validate all inputs:

```typescript
export async function POST(request: Request) {
  const body = await request.json();

  // Validate input
  if (!body.title || typeof body.title !== 'string') {
    return NextResponse.json(
      { error: 'Invalid title' },
      { status: 400 }
    );
  }

  // Sanitize input
  const sanitizedTitle = body.title.trim().slice(0, 100);

  // Process...
}
```

### Sanitization

Prevent XSS attacks by sanitizing user content:

```typescript
import DOMPurify from 'isomorphic-dompurify';

// Sanitize HTML content
const cleanContent = DOMPurify.sanitize(userContent);
```

## Environment Variables

### Required Environment Variables

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Firebase Admin SDK (Server-side only)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Admin Configuration
ADMIN_EMAIL=

# Optional: Contact Form
RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=
EMAIL_USER=
EMAIL_PASSWORD=
```

### Security Best Practices for Environment Variables

1. **Never commit .env files to Git**
   ```gitignore
   .env
   .env.local
   .env.*.local
   ```

2. **Use different credentials for development and production**

3. **Rotate keys periodically**

4. **Use Vercel/Firebase environment variable management**

5. **Prefix public variables with NEXT_PUBLIC_**
   - Only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
   - Keep sensitive keys server-side only

## Security Best Practices

### For Developers

1. **Always validate and sanitize user inputs**
2. **Use parameterized queries (Firestore does this automatically)**
3. **Implement proper error handling (don't expose sensitive info)**
4. **Keep dependencies updated**
5. **Use TypeScript for type safety**
6. **Follow the principle of least privilege**
7. **Log security events**
8. **Implement rate limiting on sensitive endpoints**

### For Admins

1. **Use strong passwords**
2. **Enable 2FA on Firebase and Vercel accounts**
3. **Regularly review Firebase security rules**
4. **Monitor Firebase Analytics for suspicious activity**
5. **Keep admin email confidential**
6. **Regularly audit user permissions**
7. **Review and update security rules quarterly**

### Code Examples

**Good Practice:**
```typescript
// ✅ Good - Validate and sanitize
const title = body.title?.trim().slice(0, 100);
if (!title || title.length < 3) {
  return NextResponse.json({ error: 'Invalid title' }, { status: 400 });
}
```

**Bad Practice:**
```typescript
// ❌ Bad - No validation
const title = body.title;
await db.collection('posts').add({ title });
```

## Common Vulnerabilities & Mitigations

### 1. XSS (Cross-Site Scripting)
**Mitigation:**
- Sanitize all user-generated content
- Use React's built-in XSS protection
- Implement Content Security Policy (CSP)

### 2. SQL Injection
**Mitigation:**
- Not applicable (using Firestore NoSQL)
- Firestore queries are parameterized by default

### 3. CSRF (Cross-Site Request Forgery)
**Mitigation:**
- Next.js built-in CSRF protection
- Use POST requests for mutations
- Verify origin headers

### 4. Unauthorized Access
**Mitigation:**
- Firebase Security Rules
- API route authentication checks
- Token verification on every request

### 5. Data Exposure
**Mitigation:**
- Don't expose sensitive data in API responses
- Use Firestore rules to restrict data access
- Implement field-level security

## Security Checklist

### Pre-Deployment

- [ ] All environment variables configured
- [ ] Firebase Security Rules deployed
- [ ] Storage Security Rules deployed
- [ ] No sensitive data in Git history
- [ ] All dependencies updated
- [ ] Security headers configured
- [ ] HTTPS enabled
- [ ] Error handling doesn't expose sensitive info
- [ ] Rate limiting implemented
- [ ] Admin access tested

### Post-Deployment

- [ ] Monitor Firebase Analytics
- [ ] Review security logs weekly
- [ ] Test authentication flows
- [ ] Verify security rules are active
- [ ] Check for unauthorized access attempts
- [ ] Update dependencies monthly
- [ ] Review and rotate keys quarterly

## Incident Response

### If a Security Breach Occurs

1. **Immediate Actions:**
   - Disable affected accounts
   - Rotate all API keys and tokens
   - Review Firebase logs
   - Notify affected users

2. **Investigation:**
   - Identify the attack vector
   - Assess the scope of the breach
   - Document findings

3. **Remediation:**
   - Patch the vulnerability
   - Update security rules
   - Deploy fixes
   - Monitor for further attempts

4. **Post-Incident:**
   - Review security policies
   - Update documentation
   - Conduct security training
   - Implement additional safeguards

## Vulnerability Reporting

If you discover a security vulnerability, please report it responsibly:

1. **Email:** Send details to the project maintainer
2. **Include:**
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

3. **Do NOT:**
   - Publicly disclose the vulnerability before it's fixed
   - Exploit the vulnerability
   - Access other users' data

## Security Resources

- [Firebase Security Documentation](https://firebase.google.com/docs/rules)
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Web Security Checklist](https://github.com/0xRadi/OWASP-Web-Checklist)

## Compliance

DevTalks aims to comply with:

- **GDPR** - For EU users
- **CCPA** - For California users
- **Privacy by Design** - Privacy-first approach
- **Data Minimization** - Only collect necessary data

## Contact

For security concerns, contact the project maintainer at the admin email.

---

**Last updated:** 2025-10-16
**Security Policy Version:** 1.0
