# Quick Start: Error Handling & Monitoring

Get up and running with error handling and monitoring in 5 minutes.

## 1. Test the Endpoints (2 minutes)

```bash
# Start the development server
cd /home/beano/DevProjects/next_js/DevTalks
npm run dev

# In another terminal, test the health endpoint
curl http://localhost:3000/api/health | jq

# Test the status endpoint
curl http://localhost:3000/api/status | jq
```

Expected output for `/api/health`:
```json
{
  "status": "healthy",
  "uptime": 123.456,
  "checks": {
    "database": { "status": "up" },
    "memory": { "status": "up" }
  }
}
```

## 2. Add to Your App Layout (1 minute)

Update your root layout to initialize error handlers:

```tsx
// src/app/layout.tsx
'use client';

import { useEffect } from 'react';
import { initializeClientErrorHandlers } from '@/lib/errors/client-init';
import { initializeTracking } from '@/lib/monitoring';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initializeClientErrorHandlers();
    initializeTracking();
  }, []);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

## 3. Wrap API Routes (1 minute)

Update an existing API route:

```typescript
// Example: src/app/api/posts/route.ts
import { NextResponse } from 'next/server';
import { withErrorHandler, NotFoundError } from '@/lib/errors';
import { metricsMiddleware } from '@/lib/monitoring';

export const GET = withErrorHandler(
  metricsMiddleware(async (request: Request) => {
    // Your existing code
    const posts = await getPosts();
    return NextResponse.json(posts);
  })
);
```

## 4. Add Error Boundary to a Page (1 minute)

```tsx
// Example: src/app/posts/page.tsx
import { ErrorBoundary } from '@/lib/errors/error-boundary';

export default function PostsPage() {
  return (
    <ErrorBoundary>
      <div>
        {/* Your existing content */}
      </div>
    </ErrorBoundary>
  );
}
```

## 5. Test Error Handling

### Test 404 Page
Visit: `http://localhost:3000/nonexistent-page`

### Test Maintenance Page
Visit: `http://localhost:3000/maintenance`

### Test Global Error Page
Create a test error in a component:
```tsx
function TestError() {
  throw new Error('Test error');
}
```

## Common Usage Patterns

### Throw Custom Errors
```typescript
import { NotFoundError, ValidationError } from '@/lib/errors';

// Not found
if (!post) {
  throw new NotFoundError('Post', { postId });
}

// Validation
if (!email.includes('@')) {
  throw new ValidationError('Invalid email');
}
```

### Track User Actions
```typescript
import { UserActions } from '@/lib/monitoring';

// Track login
UserActions.login(userId, 'email');

// Track post view
UserActions.viewPost(userId, postId);
```

### Track Performance
```typescript
import { trackDatabaseQuery } from '@/lib/monitoring';

const posts = await trackDatabaseQuery('get_posts', async () => {
  return await db.collection('posts').get();
});
```

## Next Steps

1. Read the full documentation:
   - `/docs/ERROR_HANDLING.md` - Complete guide
   - `/docs/MONITORING_SETUP.md` - Setup instructions
   - `/docs/INTEGRATION_EXAMPLES.md` - More examples

2. Set up external services (optional):
   - Sentry for error tracking
   - DataDog for monitoring
   - Google Analytics for user tracking

3. Configure monitoring:
   - Set up health check monitoring (UptimeRobot)
   - Create dashboards (Grafana)
   - Configure alerts

## Quick Reference

### Import Errors
```typescript
import {
  AppError,
  NotFoundError,
  ValidationError,
  AuthenticationError,
  handleApiError,
} from '@/lib/errors';
```

### Import Monitoring
```typescript
import {
  trackPerformance,
  AppMetrics,
  UserActions,
} from '@/lib/monitoring';
```

### Import Error Boundaries
```typescript
import {
  ErrorBoundary,
  SectionErrorBoundary,
  useErrorHandler,
} from '@/lib/errors/error-boundary';
```

## Environment Variables

Add to `.env.local` for production:

```bash
# Error tracking (optional)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn

# Maintenance mode
NEXT_PUBLIC_MAINTENANCE_MODE=false
NEXT_PUBLIC_MAINTENANCE_ETA="soon"

# Analytics (optional)
NEXT_PUBLIC_GA_ID=your-ga-id
```

## Testing

```bash
# Run tests
npm test

# Check health
curl http://localhost:3000/api/health

# Check status
curl http://localhost:3000/api/status
```

## Support

- Full docs: `/docs/ERROR_HANDLING.md`
- Examples: `/docs/INTEGRATION_EXAMPLES.md`
- Summary: `/ERROR_MONITORING_SUMMARY.md`

---

**You're all set!** The error handling and monitoring system is ready to use.
