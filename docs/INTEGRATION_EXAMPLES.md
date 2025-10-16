# Integration Examples

Practical examples of how to integrate error handling and monitoring into the DevTalks application.

## Table of Contents

1. [Root Layout Integration](#root-layout-integration)
2. [API Route Integration](#api-route-integration)
3. [Component Integration](#component-integration)
4. [Database Operations](#database-operations)
5. [Authentication Integration](#authentication-integration)
6. [Form Handling](#form-handling)

## Root Layout Integration

### Update Root Layout

```tsx
// src/app/layout.tsx
'use client';

import { useEffect } from 'react';
import { ErrorBoundary } from '@/lib/errors/error-boundary';
import { initializeClientErrorHandlers } from '@/lib/errors/client-init';
import { initializeTracking } from '@/lib/monitoring';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Initialize error handlers
    initializeClientErrorHandlers();

    // Initialize analytics tracking
    initializeTracking();
  }, []);

  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

## API Route Integration

### Basic API Route with Error Handling

```typescript
// src/app/api/posts/route.ts
import { NextResponse } from 'next/server';
import { withErrorHandler, NotFoundError } from '@/lib/errors';
import { metricsMiddleware, AppMetrics } from '@/lib/monitoring';

export const GET = withErrorHandler(
  metricsMiddleware(async (request: Request) => {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      throw new NotFoundError('Post ID is required');
    }

    // Track the request
    AppMetrics.dbQuery('posts', 'get');

    // Fetch post from database
    const post = await db.collection('posts').doc(id).get();

    if (!post.exists) {
      throw new NotFoundError('Post', { postId: id });
    }

    return NextResponse.json(post.data());
  })
);
```

### POST Route with Validation

```typescript
// src/app/api/posts/create/route.ts
import { NextResponse } from 'next/server';
import {
  withErrorHandler,
  ValidationError,
  parseRequestBody,
} from '@/lib/errors';
import { AppMetrics } from '@/lib/monitoring';
import { trackDatabaseQuery } from '@/lib/monitoring';

interface CreatePostBody {
  title: string;
  content: string;
  authorId: string;
}

export const POST = withErrorHandler(async (request: Request) => {
  // Parse and validate request body
  const body = await parseRequestBody<CreatePostBody>(request);

  if (!body.title || !body.content) {
    throw new ValidationError('Title and content are required', {
      title: !body.title,
      content: !body.content,
    });
  }

  // Track metrics
  AppMetrics.postCreated();

  // Create post with performance tracking
  const post = await trackDatabaseQuery('create_post', async () => {
    const docRef = await db.collection('posts').add({
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { id: docRef.id, ...body };
  });

  return NextResponse.json(post, { status: 201 });
});
```

### Protected API Route

```typescript
// src/app/api/admin/users/route.ts
import { NextResponse } from 'next/server';
import {
  withErrorHandler,
  AuthenticationError,
  AuthorizationError,
} from '@/lib/errors';
import { verifyAuth } from '@/lib/auth';

export const GET = withErrorHandler(async (request: Request) => {
  // Verify authentication
  const auth = await verifyAuth(request);

  if (!auth) {
    throw new AuthenticationError('Please sign in to access this resource');
  }

  // Check admin permissions
  if (!auth.isAdmin) {
    throw new AuthorizationError('Admin access required', {
      userId: auth.userId,
    });
  }

  // Fetch users
  const users = await db.collection('users').get();

  return NextResponse.json({
    users: users.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
  });
});
```

## Component Integration

### Page Component with Error Boundary

```tsx
// src/app/posts/[slug]/page.tsx
import { ErrorBoundary } from '@/lib/errors/error-boundary';
import { UserActions } from '@/lib/monitoring';

export default function PostPage({ params }: { params: { slug: string } }) {
  // Track page view
  useEffect(() => {
    UserActions.viewPost(userId, params.slug);
  }, [params.slug, userId]);

  return (
    <ErrorBoundary>
      <article>
        <PostContent slug={params.slug} />
        <ErrorBoundary fallback={<CommentsError />}>
          <CommentsSection postId={params.slug} />
        </ErrorBoundary>
      </article>
    </ErrorBoundary>
  );
}

function CommentsError() {
  return (
    <div className="p-4 bg-red-50 rounded">
      <p>Unable to load comments. Please try again later.</p>
    </div>
  );
}
```

### Component with Error Handling Hook

```tsx
// src/components/PostForm.tsx
import { useState } from 'react';
import { useErrorHandler } from '@/lib/errors/error-boundary';
import { UserActions } from '@/lib/monitoring';
import { toast } from 'sonner';

export function PostForm() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const handleError = useErrorHandler();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create post');
      }

      const post = await response.json();

      // Track successful creation
      UserActions.createPost(userId, post.id);

      toast.success('Post created successfully!');
    } catch (error) {
      // This will trigger the error boundary
      handleError(error as Error);

      // Or handle it locally
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}
```

### Section Error Boundary

```tsx
// src/components/Dashboard.tsx
import { SectionErrorBoundary } from '@/lib/errors/error-boundary';

export function Dashboard() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <SectionErrorBoundary sectionName="Statistics">
        <StatisticsWidget />
      </SectionErrorBoundary>

      <SectionErrorBoundary sectionName="Recent Activity">
        <RecentActivityWidget />
      </SectionErrorBoundary>

      <SectionErrorBoundary sectionName="User Profile">
        <UserProfileWidget />
      </SectionErrorBoundary>

      <SectionErrorBoundary sectionName="Notifications">
        <NotificationsWidget />
      </SectionErrorBoundary>
    </div>
  );
}
```

## Database Operations

### Wrapped Database Queries

```typescript
// src/lib/posts.ts
import { trackDatabaseQuery } from '@/lib/monitoring';
import { NotFoundError, DatabaseError } from '@/lib/errors';

export async function getPost(postId: string) {
  return trackDatabaseQuery('get_post', async () => {
    try {
      const doc = await db.collection('posts').doc(postId).get();

      if (!doc.exists) {
        throw new NotFoundError('Post', { postId });
      }

      return { id: doc.id, ...doc.data() };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to fetch post', {
        postId,
        error: String(error),
      });
    }
  });
}

export async function getPosts(limit: number = 10) {
  return trackDatabaseQuery('get_posts', async () => {
    try {
      const snapshot = await db
        .collection('posts')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      throw new DatabaseError('Failed to fetch posts', {
        limit,
        error: String(error),
      });
    }
  });
}
```

## Authentication Integration

### Login with Error Handling

```typescript
// src/lib/auth-operations.ts
import { AuthenticationError } from '@/lib/errors';
import { UserActions } from '@/lib/monitoring';

export async function loginUser(email: string, password: string) {
  try {
    const auth = getAuth();
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Track login
    UserActions.login(userCredential.user.uid, 'email');

    return userCredential.user;
  } catch (error: any) {
    // Map Firebase errors to our error types
    if (error.code === 'auth/user-not-found') {
      throw new AuthenticationError('No account found with this email', {
        email,
      });
    } else if (error.code === 'auth/wrong-password') {
      throw new AuthenticationError('Incorrect password', { email });
    } else if (error.code === 'auth/too-many-requests') {
      throw new AuthenticationError(
        'Too many failed login attempts. Please try again later.',
        { email }
      );
    }

    throw new AuthenticationError('Login failed', {
      error: error.message,
    });
  }
}
```

### Signup with Validation

```typescript
// src/lib/auth-operations.ts
import { ValidationError } from '@/lib/errors';
import { UserActions } from '@/lib/monitoring';

export async function signupUser(
  email: string,
  password: string,
  displayName: string
) {
  // Validate input
  if (!email || !email.includes('@')) {
    throw new ValidationError('Invalid email address', { email });
  }

  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters');
  }

  if (!displayName || displayName.length < 2) {
    throw new ValidationError('Display name must be at least 2 characters');
  }

  try {
    const auth = getAuth();
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Update profile
    await updateProfile(userCredential.user, { displayName });

    // Track signup
    UserActions.signup(userCredential.user.uid, 'email');

    return userCredential.user;
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      throw new ValidationError('Email already in use', { email });
    }

    throw new AuthenticationError('Signup failed', {
      error: error.message,
    });
  }
}
```

## Form Handling

### Form with Validation and Error Handling

```tsx
// src/components/ContactForm.tsx
import { useState } from 'react';
import { ValidationError } from '@/lib/errors';
import { UserActions } from '@/lib/monitoring';
import { toast } from 'sonner';

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email || !formData.email.includes('@')) {
      newErrors.email = 'Valid email is required';
    }

    if (!formData.message || formData.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      // Track successful submission
      UserActions.featureUsed(userId, 'contact_form');

      toast.success('Message sent successfully!');
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          value={formData.message}
          onChange={(e) =>
            setFormData({ ...formData, message: e.target.value })
          }
          className={errors.message ? 'border-red-500' : ''}
        />
        {errors.message && (
          <p className="text-red-500 text-sm">{errors.message}</p>
        )}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  );
}
```

## Performance Tracking Examples

### Track Component Render

```tsx
// src/components/HeavyComponent.tsx
import { useEffect } from 'react';
import { measureRenderTime } from '@/lib/monitoring';

export function HeavyComponent() {
  useEffect(() => {
    const endMeasure = measureRenderTime('HeavyComponent');
    return () => endMeasure();
  }, []);

  // Component content
  return <div>Heavy component content</div>;
}
```

### Track API Call Performance

```typescript
// src/lib/api-client.ts
import { trackApiCall } from '@/lib/monitoring';

export async function fetchPosts() {
  return trackApiCall('/api/posts', async () => {
    const response = await fetch('/api/posts');
    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }
    return response.json();
  });
}
```

### Track Complex Operation

```typescript
// src/lib/data-processor.ts
import { PerformanceTracker } from '@/lib/monitoring';

export async function processLargeDataset(data: any[]) {
  const tracker = new PerformanceTracker('process_dataset', {
    size: data.length,
  });

  // Step 1: Validation
  const validData = data.filter((item) => validateItem(item));
  tracker.checkpoint('validation_complete');

  // Step 2: Transformation
  const transformed = validData.map((item) => transformItem(item));
  tracker.checkpoint('transformation_complete');

  // Step 3: Storage
  await saveToDatabase(transformed);
  tracker.checkpoint('storage_complete');

  const duration = tracker.end();
  console.log(`Processed ${data.length} items in ${duration}ms`);

  return transformed;
}
```

## Testing Examples

### Test Error Boundary

```tsx
// src/components/__tests__/ErrorBoundary.test.tsx
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/lib/errors/error-boundary';

const ThrowError = () => {
  throw new Error('Test error');
};

test('catches and displays errors', () => {
  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );

  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
});
```

### Test API Error Handling

```typescript
// src/app/api/posts/__tests__/route.test.ts
import { GET } from '../route';
import { NotFoundError } from '@/lib/errors';

test('handles not found errors', async () => {
  const request = new Request('http://localhost/api/posts?id=nonexistent');
  const response = await GET(request);

  expect(response.status).toBe(404);
  const json = await response.json();
  expect(json.error).toContain('not found');
});
```

## Summary

These examples demonstrate:

1. **Root Layout**: Initialize error handlers and tracking
2. **API Routes**: Handle errors and track metrics
3. **Components**: Use error boundaries and track user actions
4. **Database**: Track query performance and handle errors
5. **Authentication**: Handle auth errors properly
6. **Forms**: Validate input and handle errors gracefully
7. **Performance**: Track critical operations
8. **Testing**: Test error scenarios

For more details, see:
- [Error Handling Documentation](/docs/ERROR_HANDLING.md)
- [Monitoring Setup Guide](/docs/MONITORING_SETUP.md)
