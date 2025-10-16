import { NextResponse } from 'next/server';

// Mock implementation of the blog API route handlers
export const GET = jest.fn().mockImplementation(async () => {
  return NextResponse.json({
    posts: [
      {
        id: 'test-post-1',
        title: 'Test Post 1',
        content: 'Test content 1',
        excerpt: 'Test excerpt 1',
        author: {
          name: 'Test Author',
          email: 'test@example.com',
          image: 'https://example.com/image.jpg'
        },
        date: new Date().toISOString(),
        slug: 'test-post-1',
        published: true,
        tags: ['test', 'mock'],
        upvotes: 5
      },
      {
        id: 'test-post-2',
        title: 'Test Post 2',
        content: 'Test content 2',
        excerpt: 'Test excerpt 2',
        author: {
          name: 'Test Author',
          email: 'test@example.com',
          image: 'https://example.com/image.jpg'
        },
        date: new Date().toISOString(),
        slug: 'test-post-2',
        published: true,
        tags: ['test', 'mock'],
        upvotes: 3
      }
    ]
  });
});

export const POST = jest.fn().mockImplementation(async () => {
  return NextResponse.json({
    id: 'new-post-id',
    title: 'New Post'
  }, { status: 201 });
});
