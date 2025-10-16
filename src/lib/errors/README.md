# Error Handling System

Comprehensive error handling infrastructure for the DevTalks application.

## Quick Start

### 1. Import Error Classes

```typescript
import {
  AppError,
  NotFoundError,
  ValidationError,
  AuthenticationError,
} from '@/lib/errors';
```

### 2. Use Error Boundaries

```tsx
import { ErrorBoundary } from '@/lib/errors/error-boundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### 3. Handle API Errors

```typescript
import { withErrorHandler } from '@/lib/errors';

export const GET = withErrorHandler(async (request: Request) => {
  // Your handler code
});
```

## Structure

```
src/lib/errors/
├── error-classes.ts      # Custom error class definitions
├── error-handler.ts      # Error handling utilities
├── error-logger.ts       # Error logging service
├── error-boundary.tsx    # React error boundaries
├── client-init.ts        # Client-side initialization
├── index.ts              # Main exports
└── README.md             # This file
```

## Key Features

- **Typed Error Classes**: Structured errors with consistent properties
- **Error Boundaries**: Catch React component errors gracefully
- **Centralized Logging**: Consistent error logging with context
- **API Error Handling**: Automatic error handling for API routes
- **User-Friendly Messages**: Hide technical details from users
- **Development Mode**: Enhanced error details in development
- **Production Ready**: External service integration (Sentry, etc.)

## Documentation

See [docs/ERROR_HANDLING.md](/docs/ERROR_HANDLING.md) for comprehensive documentation.

## Examples

### Throw a Custom Error

```typescript
throw new NotFoundError('Post', { postId: '123' });
```

### Log an Error

```typescript
import { logServerError } from '@/lib/errors';

logServerError(error, { method: 'GET', url: '/api/posts' }, { userId: 'user123' });
```

### Handle API Route Errors

```typescript
import { handleApiError } from '@/lib/errors';

try {
  const result = await operation();
  return NextResponse.json(result);
} catch (error) {
  return handleApiError(error, request);
}
```

## Best Practices

1. Always use specific error classes
2. Include relevant context in errors
3. Don't expose sensitive information
4. Wrap components with error boundaries
5. Log errors with sufficient context
6. Monitor errors in production

For more details, see the [full documentation](/docs/ERROR_HANDLING.md).
