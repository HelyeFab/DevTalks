# Error Handling Documentation

This document describes the error handling and monitoring infrastructure for the DevTalks application.

## Table of Contents

1. [Overview](#overview)
2. [Error Classes](#error-classes)
3. [Error Boundaries](#error-boundaries)
4. [Error Pages](#error-pages)
5. [Error Logging](#error-logging)
6. [API Error Handling](#api-error-handling)
7. [Monitoring](#monitoring)
8. [Best Practices](#best-practices)
9. [Integration Guide](#integration-guide)

## Overview

The DevTalks application implements a comprehensive error handling system that includes:

- **Structured error classes** for consistent error handling
- **Error boundaries** to catch React component errors
- **Custom error pages** for better user experience
- **Centralized error logging** with context tracking
- **Performance monitoring** for tracking application health
- **User action tracking** for analytics
- **Health check endpoints** for monitoring

## Error Classes

### Base Error Class

All application errors extend from `AppError`:

```typescript
import { AppError, ErrorCode } from '@/lib/errors';

throw new AppError(
  'User not found',
  ErrorCode.NOT_FOUND,
  404,
  { userId: '123' }
);
```

### Specialized Error Classes

```typescript
import {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  DatabaseError,
  RateLimitError,
} from '@/lib/errors';

// Authentication error
throw new AuthenticationError('Invalid token');

// Authorization error
throw new AuthorizationError('Insufficient permissions');

// Not found error
throw new NotFoundError('Post');

// Validation error
throw new ValidationError('Invalid email format');

// Database error
throw new DatabaseError('Failed to connect to database');

// Rate limit error
throw new RateLimitError('Too many requests');
```

### Error Codes

Available error codes:

- `UNAUTHORIZED` - User is not authenticated
- `FORBIDDEN` - User lacks permissions
- `INVALID_TOKEN` - Authentication token is invalid
- `SESSION_EXPIRED` - User session has expired
- `NOT_FOUND` - Resource not found
- `ALREADY_EXISTS` - Resource already exists
- `INVALID_INPUT` - Invalid input data
- `VALIDATION_ERROR` - Validation failed
- `INTERNAL_ERROR` - Internal server error
- `DATABASE_ERROR` - Database operation failed
- `EXTERNAL_SERVICE_ERROR` - External service error
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded
- `INSUFFICIENT_PERMISSIONS` - Insufficient permissions
- `OPERATION_FAILED` - Operation failed

## Error Boundaries

### Root Error Boundary

Wrap your entire application with an error boundary:

```tsx
import { ErrorBoundary } from '@/lib/errors/error-boundary';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

### Section Error Boundary

Use section error boundaries for specific parts of your app:

```tsx
import { SectionErrorBoundary } from '@/lib/errors/error-boundary';

function MyPage() {
  return (
    <div>
      <SectionErrorBoundary sectionName="Comments">
        <CommentsSection />
      </SectionErrorBoundary>
    </div>
  );
}
```

### Custom Error Boundary

Create custom error boundaries with custom fallback UI:

```tsx
import { ErrorBoundary } from '@/lib/errors/error-boundary';

function MyComponent() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div>
          <h2>Something went wrong</h2>
          <p>{error.message}</p>
          <button onClick={reset}>Try again</button>
        </div>
      )}
    >
      <MyChildComponent />
    </ErrorBoundary>
  );
}
```

### Error Handler Hook

Use the error handler hook in components:

```tsx
import { useErrorHandler } from '@/lib/errors/error-boundary';

function MyComponent() {
  const handleError = useErrorHandler();

  const fetchData = async () => {
    try {
      const data = await api.getData();
      setData(data);
    } catch (error) {
      handleError(error);
    }
  };

  // ...
}
```

## Error Pages

### Global Error Page

Located at `src/app/error.tsx`, this page catches all unhandled errors in the application.

### 404 Not Found Page

Located at `src/app/not-found.tsx`, provides helpful navigation for users who land on non-existent pages.

### Global Root Error

Located at `src/app/global-error.tsx`, catches errors in the root layout.

### Maintenance Page

Located at `src/app/maintenance/page.tsx`, display when the application is under maintenance.

To enable maintenance mode, set the `NEXT_PUBLIC_MAINTENANCE_MODE` environment variable:

```bash
NEXT_PUBLIC_MAINTENANCE_MODE=true
NEXT_PUBLIC_MAINTENANCE_ETA="in 2 hours"
```

## Error Logging

### Server-Side Error Logging

```typescript
import { logServerError } from '@/lib/errors';

try {
  // Server operation
  const result = await db.collection('users').get();
} catch (error) {
  logServerError(error, {
    method: 'GET',
    url: '/api/users',
  }, {
    userId: 'user123',
    operation: 'fetch_users',
  });
  throw error;
}
```

### Client-Side Error Logging

```typescript
import { logClientError } from '@/lib/errors';

try {
  // Client operation
  await fetchData();
} catch (error) {
  logClientError(error, undefined, {
    component: 'DataFetcher',
    action: 'fetch_data',
  });
  throw error;
}
```

### Error Context

Always include relevant context when logging errors:

```typescript
import { createErrorContext } from '@/lib/errors';

const context = createErrorContext(request, userId);
logServerError(error, undefined, context);
```

## API Error Handling

### Error Handler Wrapper

Wrap API route handlers with automatic error handling:

```typescript
import { withErrorHandler } from '@/lib/errors';

export const GET = withErrorHandler(async (request: Request) => {
  // Your handler code
  const data = await fetchData();
  return NextResponse.json(data);
});
```

### Manual Error Handling

Handle errors manually in API routes:

```typescript
import { handleApiError } from '@/lib/errors';

export async function GET(request: Request) {
  try {
    const data = await fetchData();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, request);
  }
}
```

### Request Body Parsing

Use the safe request body parser:

```typescript
import { parseRequestBody } from '@/lib/errors';

export async function POST(request: Request) {
  const body = await parseRequestBody<{ name: string }>(request);
  // body is safely parsed
}
```

### Database Error Handling

Handle database errors specifically:

```typescript
import { handleDatabaseError } from '@/lib/errors';

try {
  const result = await db.collection('users').doc(id).get();
} catch (error) {
  handleDatabaseError(error, 'fetch_user');
}
```

## Monitoring

### Health Check Endpoint

Check application health:

```bash
curl http://localhost:3000/api/health
```

Response:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600,
  "checks": {
    "database": {
      "status": "up",
      "responseTime": 45
    },
    "memory": {
      "status": "up",
      "usage": {
        "heapUsed": 128,
        "heapTotal": 256,
        "rss": 512,
        "external": 8
      },
      "percentage": 50
    },
    "environment": {
      "nodeVersion": "v18.0.0",
      "platform": "linux",
      "environment": "production"
    }
  }
}
```

### Status Endpoint

Get detailed application status:

```bash
curl http://localhost:3000/api/status
```

Response:

```json
{
  "application": {
    "name": "DevTalks",
    "version": "1.0.0",
    "environment": "production",
    "uptime": 3600,
    "startTime": "2024-01-01T11:00:00.000Z"
  },
  "system": {
    "platform": "linux",
    "nodeVersion": "v18.0.0",
    "memory": {
      "total": 256,
      "used": 128,
      "free": 128,
      "percentage": 50
    }
  },
  "services": {
    "database": {
      "status": "connected",
      "type": "firestore"
    },
    "firebase": {
      "status": "available",
      "projectId": "my-project"
    }
  }
}
```

### Performance Tracking

Track async operations:

```typescript
import { trackPerformance } from '@/lib/monitoring';

const result = await trackPerformance(
  'fetch_users',
  async () => {
    return await db.collection('users').get();
  },
  { collection: 'users' }
);
```

Track sync operations:

```typescript
import { trackPerformanceSync } from '@/lib/monitoring';

const result = trackPerformanceSync(
  'process_data',
  () => {
    return processData(data);
  }
);
```

Use performance tracker:

```typescript
import { PerformanceTracker } from '@/lib/monitoring';

const tracker = new PerformanceTracker('complex_operation');

// Checkpoint 1
await step1();
tracker.checkpoint('step1_complete');

// Checkpoint 2
await step2();
tracker.checkpoint('step2_complete');

// End tracking
const duration = tracker.end();
```

### Metrics Collection

Track application metrics:

```typescript
import { AppMetrics } from '@/lib/monitoring';

// Track API request
AppMetrics.apiRequest('/api/users', 'GET');

// Track API error
AppMetrics.apiError('/api/users', 500);

// Track database query
AppMetrics.dbQuery('users', 'get');

// Track user login
AppMetrics.userLogin();

// Track post creation
AppMetrics.postCreated();
```

Use metrics middleware:

```typescript
import { metricsMiddleware } from '@/lib/monitoring';

export const GET = metricsMiddleware(async (request: Request) => {
  // Handler automatically tracked
  return NextResponse.json({ success: true });
});
```

### User Tracking

Track user actions:

```typescript
import { UserActions } from '@/lib/monitoring';

// Track login
UserActions.login(userId, 'email');

// Track post view
UserActions.viewPost(userId, postId);

// Track comment creation
UserActions.createComment(userId, postId, commentId);

// Track search
UserActions.search(userId, 'react hooks', 10);
```

Initialize tracking on client:

```typescript
import { initializeTracking } from '@/lib/monitoring';

// In your root layout or app component
useEffect(() => {
  initializeTracking();
}, []);
```

Track session:

```typescript
import { SessionTracker } from '@/lib/monitoring';

const session = new SessionTracker(userId);

// Track action in session
session.trackAction('button_click', { button: 'submit' });

// End session
session.end();
```

## Best Practices

### 1. Use Specific Error Classes

Always use the most specific error class:

```typescript
// Good
throw new NotFoundError('Post');

// Bad
throw new Error('Post not found');
```

### 2. Include Context

Always include relevant context in errors:

```typescript
// Good
throw new AppError(
  'Failed to update post',
  ErrorCode.OPERATION_FAILED,
  500,
  { postId: '123', userId: 'user456' }
);

// Bad
throw new AppError('Failed to update post', ErrorCode.OPERATION_FAILED, 500);
```

### 3. Don't Expose Sensitive Information

Never include sensitive data in error messages:

```typescript
// Good
throw new ValidationError('Invalid password format');

// Bad
throw new ValidationError(`Invalid password: ${password}`);
```

### 4. Use Error Boundaries

Always wrap components with error boundaries:

```tsx
// Good
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>

// Bad
<MyComponent />
```

### 5. Log Errors with Context

Always log errors with sufficient context:

```typescript
// Good
logServerError(error, { method: 'POST', url: '/api/posts' }, {
  userId: 'user123',
  postId: 'post456',
});

// Bad
console.error(error);
```

### 6. Track Performance

Track performance of critical operations:

```typescript
// Good
const result = await trackDatabaseQuery('fetch_posts', async () => {
  return await db.collection('posts').get();
});

// Bad
const result = await db.collection('posts').get();
```

### 7. Monitor Metrics

Monitor important application metrics:

```typescript
// Good
AppMetrics.apiRequest('/api/posts', 'GET');
const result = await handler();
AppMetrics.apiDuration('/api/posts', Date.now() - startTime);

// Bad
const result = await handler();
```

## Integration Guide

### Sentry Integration

To integrate with Sentry for error tracking:

1. Install Sentry SDK:

```bash
npm install @sentry/nextjs
```

2. Update error logger to send to Sentry:

```typescript
// In src/lib/errors/error-logger.ts
import * as Sentry from '@sentry/nextjs';

function sendToExternalService(logEntry: ErrorLogEntry): void {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.captureException(logEntry.error, {
      contexts: {
        custom: logEntry.context,
      },
      tags: {
        environment: logEntry.environment,
      },
      user: {
        id: logEntry.userId,
      },
    });
  }
}
```

3. Initialize Sentry in your app:

```typescript
// In src/app/layout.tsx or _app.tsx
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### DataDog Integration

To integrate with DataDog for monitoring:

1. Install DataDog SDK:

```bash
npm install dd-trace
```

2. Update monitoring to send to DataDog:

```typescript
// In src/lib/monitoring/metrics.ts
import tracer from 'dd-trace';

tracer.init({
  service: 'devtalks',
  env: process.env.NODE_ENV,
});
```

### Google Analytics Integration

To integrate with Google Analytics:

1. Update user tracking:

```typescript
// In src/lib/monitoring/user-tracking.ts
function sendToAnalytics(action: UserAction): void {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action.action, {
      user_id: action.userId,
      page_path: action.page,
      ...action.metadata,
    });
  }
}
```

2. Add Google Analytics script to your app:

```tsx
// In src/app/layout.tsx
<Script
  src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
  strategy="afterInteractive"
/>
<Script id="google-analytics" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
  `}
</Script>
```

## Environment Variables

Required environment variables for error handling and monitoring:

```bash
# Production error tracking
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn

# Maintenance mode
NEXT_PUBLIC_MAINTENANCE_MODE=false
NEXT_PUBLIC_MAINTENANCE_ETA="soon"

# Analytics
NEXT_PUBLIC_GA_ID=your-ga-id
```

## Common Error Scenarios

### API Route Error

```typescript
export async function POST(request: Request) {
  try {
    const body = await parseRequestBody(request);
    const result = await createPost(body);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, request);
  }
}
```

### Database Operation Error

```typescript
try {
  const post = await db.collection('posts').doc(postId).get();
  if (!post.exists) {
    throw new NotFoundError('Post', { postId });
  }
  return post.data();
} catch (error) {
  handleDatabaseError(error, 'fetch_post');
}
```

### Component Error

```tsx
function MyComponent() {
  const handleError = useErrorHandler();

  const handleSubmit = async () => {
    try {
      await submitForm();
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <ErrorBoundary>
      <form onSubmit={handleSubmit}>
        {/* form content */}
      </form>
    </ErrorBoundary>
  );
}
```

## Testing Error Handling

### Test Error Boundaries

```tsx
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/lib/errors/error-boundary';

const ThrowError = () => {
  throw new Error('Test error');
};

test('error boundary catches errors', () => {
  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );

  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
});
```

### Test Error Handlers

```typescript
import { handleApiError } from '@/lib/errors';

test('handles API errors correctly', async () => {
  const error = new NotFoundError('Post');
  const response = handleApiError(error);

  expect(response.status).toBe(404);
  const json = await response.json();
  expect(json.error).toBe('Post not found');
});
```

## Support

For issues or questions about error handling:

1. Check the error logs in development console
2. Review error context in the logs
3. Check the health endpoint for service status
4. Review Sentry (in production) for detailed error reports

## Additional Resources

- [Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Sentry Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [DataDog APM](https://docs.datadoghq.com/tracing/)
