# API Documentation

Complete API reference for the DevTalks platform.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Response Format](#response-format)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)
  - [Blog Posts](#blog-posts)
  - [Comments](#comments)
  - [Announcements](#announcements)
  - [Upvotes](#upvotes)
  - [Contact](#contact)

## Overview

The DevTalks API is built using Next.js API Routes (App Router) and provides RESTful endpoints for managing blog posts, comments, announcements, and user interactions.

**Base URL**: `https://your-domain.com/api`

**Content-Type**: `application/json`

**Authentication**: Bearer Token (Firebase Auth)

## Authentication

Most write operations require authentication using Firebase Auth tokens.

### Obtaining a Token

Users authenticate through Firebase Auth (client-side), which provides a JWT token:

```typescript
// Client-side authentication
import { getAuth } from 'firebase/auth';

const auth = getAuth();
const user = auth.currentUser;
const token = await user.getIdToken();
```

### Using the Token

Include the token in the `Authorization` header:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://your-domain.com/api/posts
```

### Admin Privileges

Some endpoints require admin privileges. Admin status is determined by checking if the user's email matches the `ADMIN_EMAIL` environment variable.

## Response Format

### Success Response

```json
{
  "data": { ... },
  "message": "Success message (optional)"
}
```

### Error Response

```json
{
  "error": "Error message",
  "details": { ... }  // Optional
}
```

### HTTP Status Codes

- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## Error Handling

All errors follow a consistent format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",  // Optional
  "details": {           // Optional
    "field": "Additional context"
  }
}
```

## Rate Limiting

### Contact Form

- **Limit**: 5 requests per hour per IP address
- **Response**: 429 Too Many Requests
- **Headers**:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Time until limit resets

### Other Endpoints

Consider implementing rate limiting for production using middleware or a service like Vercel Edge Middleware.

## Endpoints

### Blog Posts

#### Get All Blog Posts

```http
GET /api/blog
```

**Query Parameters:**

| Parameter   | Type    | Description                          | Default |
|------------|---------|--------------------------------------|---------|
| page       | number  | Page number                          | 1       |
| limit      | number  | Items per page                       | 10      |
| published  | boolean | Filter by published status           | true    |
| tag        | string  | Filter by tag                        | -       |
| slug       | string  | Get specific post by slug            | -       |

**Response:**

```json
{
  "data": [
    {
      "id": "post-123",
      "title": "Blog Post Title",
      "slug": "blog-post-title",
      "excerpt": "Brief description...",
      "content": "Full content...",
      "author": "Author Name",
      "authorId": "user-456",
      "publishedAt": "2025-10-16T00:00:00.000Z",
      "updatedAt": "2025-10-16T12:00:00.000Z",
      "tags": ["nextjs", "react"],
      "image": "/images/post.jpg",
      "upvotes": 42,
      "published": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

#### Get Single Blog Post

```http
GET /api/blog?slug=post-slug
```

**Response:**

```json
{
  "id": "post-123",
  "title": "Blog Post Title",
  "slug": "blog-post-title",
  "content": "Full content...",
  // ... other fields
}
```

#### Create Blog Post

```http
POST /api/blog
```

**Authentication**: Required (Admin only)

**Request Body:**

```json
{
  "title": "New Blog Post",
  "content": "Post content in markdown...",
  "excerpt": "Brief description",
  "tags": ["tag1", "tag2"],
  "image": "/images/new-post.jpg",
  "published": true
}
```

**Response:**

```json
{
  "id": "post-789",
  "slug": "new-blog-post",
  // ... created post data
}
```

**Validation Rules:**

- `title`: Required, 3-100 characters
- `content`: Required, min 10 characters
- `excerpt`: Optional, max 200 characters
- `tags`: Optional, max 5 tags
- `image`: Optional, valid URL
- `published`: Optional, boolean

### Comments

#### Get Comments for a Post

```http
GET /api/posts/:postId/comments
```

**Parameters:**

- `postId` (path): The ID of the post

**Response:**

```json
[
  {
    "id": "comment-123",
    "content": "This is a comment",
    "userId": "user-456",
    "userName": "John Doe",
    "userEmail": "john@example.com",
    "userAvatar": "/images/avatar.jpg",
    "postId": "post-123",
    "parentId": null,
    "createdAt": "2025-10-16T10:00:00.000Z",
    "updatedAt": null,
    "replies": [
      {
        "id": "comment-456",
        "content": "This is a reply",
        "parentId": "comment-123",
        // ... other fields
      }
    ]
  }
]
```

#### Create Comment

```http
POST /api/posts/:postId/comments
```

**Authentication**: Required

**Request Body:**

```json
{
  "content": "Comment text (supports markdown)",
  "parentId": null  // Optional, for replies
}
```

**Response:**

```json
{
  "id": "comment-789",
  "content": "Comment text",
  "userId": "user-123",
  "createdAt": "2025-10-16T11:00:00.000Z",
  // ... other fields
}
```

**Validation:**

- `content`: Required, 1-1000 characters
- `parentId`: Optional, must be valid comment ID

#### Update Comment

```http
PUT /api/posts/:postId/comments/:commentId
```

**Authentication**: Required (Must be comment owner or admin)

**Request Body:**

```json
{
  "content": "Updated comment text"
}
```

**Response:**

```json
{
  "id": "comment-123",
  "content": "Updated comment text",
  "updatedAt": "2025-10-16T12:00:00.000Z"
}
```

#### Delete Comment

```http
DELETE /api/posts/:postId/comments/:commentId
```

**Authentication**: Required (Must be comment owner or admin)

**Response:**

```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

#### Create Reply

```http
POST /api/posts/:postId/comments/:commentId/replies
```

**Authentication**: Required

**Request Body:**

```json
{
  "content": "Reply text"
}
```

**Response:**

```json
{
  "id": "comment-999",
  "content": "Reply text",
  "parentId": "comment-123",
  // ... other fields
}
```

### MDX Post Comments

MDX posts use separate comment endpoints but with similar structure:

```http
GET /api/mdx-posts/:slug/comments
POST /api/mdx-posts/:slug/comments
PUT /api/mdx-posts/:slug/comments/:commentId
DELETE /api/mdx-posts/:slug/comments/:commentId
POST /api/mdx-posts/:slug/comments/:commentId/replies
```

### Announcements

#### Get All Announcements

```http
GET /api/announcements
```

**Response:**

```json
[
  {
    "id": "announcement-123",
    "title": "Important Update",
    "content": "Announcement content...",
    "slug": "important-update",
    "type": "info",  // info, warning, success, error
    "priority": "high",  // low, medium, high
    "active": true,
    "createdAt": "2025-10-16T00:00:00.000Z",
    "updatedAt": null
  }
]
```

#### Get Single Announcement

```http
GET /api/announcements/:slug
```

**Response:**

```json
{
  "id": "announcement-123",
  "title": "Important Update",
  "content": "Full announcement content...",
  // ... other fields
}
```

#### Create Announcement

```http
POST /api/announcements
```

**Authentication**: Required (Admin only)

**Request Body:**

```json
{
  "title": "New Announcement",
  "content": "Announcement content...",
  "type": "info",
  "priority": "medium",
  "active": true
}
```

**Response:**

```json
{
  "id": "announcement-456",
  "slug": "new-announcement",
  // ... created announcement
}
```

#### Update Announcement

```http
PUT /api/announcements
```

**Authentication**: Required (Admin only)

**Request Body:**

```json
{
  "id": "announcement-123",
  "title": "Updated Title",
  "content": "Updated content..."
}
```

#### Delete Announcement

```http
DELETE /api/announcements?id=announcement-123
```

**Authentication**: Required (Admin only)

**Response:**

```json
{
  "success": true
}
```

### Upvotes

#### Toggle Upvote

```http
POST /api/posts/:postId/upvote
```

**Authentication**: Required

**Description**: Adds upvote if not already upvoted, removes if already upvoted.

**Response:**

```json
{
  "upvoted": true,
  "upvotes": 43
}
```

**Fields:**

- `upvoted`: Boolean indicating current upvote status
- `upvotes`: Total upvote count for the post

### Contact

#### Submit Contact Form

```http
POST /api/contact
```

**Rate Limit**: 5 requests per hour per IP

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Your message here",
  "recaptchaToken": "recaptcha_token_from_client"
}
```

**Response:**

```json
{
  "message": "Message sent successfully"
}
```

**Validation:**

- `name`: Required, 2-100 characters
- `email`: Required, valid email format
- `message`: Required, 10-1000 characters
- `recaptchaToken`: Required (if reCAPTCHA is enabled)

**Error Responses:**

```json
// Rate limit exceeded
{
  "error": "Too many requests. Please try again later."
}

// Invalid reCAPTCHA
{
  "error": "Failed to verify reCAPTCHA"
}

// Missing fields
{
  "error": "Missing required fields"
}
```

## Code Examples

### JavaScript/TypeScript

#### Fetch Blog Posts

```typescript
async function getBlogPosts(page = 1, limit = 10) {
  const response = await fetch(
    `/api/blog?page=${page}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch posts');
  }

  return response.json();
}
```

#### Create Comment with Authentication

```typescript
import { getAuth } from 'firebase/auth';

async function createComment(postId: string, content: string) {
  const auth = getAuth();
  const token = await auth.currentUser?.getIdToken();

  const response = await fetch(`/api/posts/${postId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create comment');
  }

  return response.json();
}
```

#### Toggle Upvote

```typescript
async function toggleUpvote(postId: string) {
  const auth = getAuth();
  const token = await auth.currentUser?.getIdToken();

  const response = await fetch(`/api/posts/${postId}/upvote`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to toggle upvote');
  }

  return response.json();
}
```

### cURL Examples

#### Get Blog Posts

```bash
curl https://your-domain.com/api/blog?page=1&limit=10
```

#### Create Comment (Authenticated)

```bash
curl -X POST https://your-domain.com/api/posts/post-123/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"content":"Great post!"}'
```

#### Toggle Upvote

```bash
curl -X POST https://your-domain.com/api/posts/post-123/upvote \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Webhook Support

Currently, DevTalks does not support webhooks. Consider implementing webhooks for:

- New comment notifications
- New post notifications
- Upvote milestones
- User mentions

## API Versioning

The current API is unversioned. Future versions will use URL-based versioning:

```
/api/v1/posts
/api/v2/posts
```

## Best Practices

### Client-Side Usage

1. **Cache Responses**: Use SWR or React Query for caching
2. **Handle Errors Gracefully**: Always provide user feedback
3. **Implement Loading States**: Show spinners during API calls
4. **Retry Failed Requests**: Implement exponential backoff
5. **Validate Before Sending**: Validate forms client-side

### Error Handling Example

```typescript
async function apiCall() {
  try {
    const response = await fetch('/api/endpoint');

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    // Show user-friendly error message
    toast.error(error.message || 'Something went wrong');
  }
}
```

### Performance Tips

1. **Use Pagination**: Always paginate large datasets
2. **Implement Caching**: Cache frequently accessed data
3. **Minimize Payload**: Only request needed fields
4. **Batch Requests**: Combine multiple requests when possible
5. **Use CDN**: Cache static API responses at edge

## Security Considerations

1. **Always Validate Input**: Server-side validation is mandatory
2. **Sanitize Content**: Prevent XSS attacks
3. **Rate Limiting**: Protect against abuse
4. **CORS Configuration**: Restrict allowed origins
5. **Token Expiration**: Implement short-lived tokens
6. **HTTPS Only**: Never use HTTP in production

## Testing

### Unit Testing API Routes

```typescript
import { GET } from '@/app/api/blog/route';

describe('/api/blog', () => {
  it('returns blog posts', async () => {
    const request = new Request('http://localhost:3000/api/blog');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(data.data)).toBe(true);
  });
});
```

### Integration Testing

Use tools like:
- **Postman** - API testing and documentation
- **Insomnia** - REST client
- **Supertest** - Integration testing

## Changelog

### v1.0.0 (2025-10-16)

- Initial API release
- Blog posts CRUD
- Comments and replies
- Announcements system
- Upvoting system
- Contact form

## References

- [Next.js API Routes Documentation](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [REST API Best Practices](https://restfulapi.net/)

---

**Last updated:** 2025-10-16
**API Version:** 1.0.0
