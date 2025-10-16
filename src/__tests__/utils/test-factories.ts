/**
 * Test Data Factories
 * Factory functions for creating test data with realistic values
 */

import { BlogPost } from '@/types/blog';
import { Project } from '@/types/project';

/**
 * Counter for generating unique IDs
 */
let idCounter = 0;
const generateId = () => `test-${++idCounter}`;

/**
 * Reset ID counter (useful for test isolation)
 */
export const resetIdCounter = () => {
  idCounter = 0;
};

/**
 * Blog Post Factory
 */
export class BlogPostFactory {
  static build(overrides: Partial<BlogPost> = {}): BlogPost {
    const id = generateId();
    return {
      id,
      title: 'Understanding TypeScript Generics',
      subtitle: 'A deep dive into generic types',
      content: `# Understanding TypeScript Generics

Generics are one of the most powerful features in TypeScript. They allow you to write reusable code that works with multiple types while maintaining type safety.

## What are Generics?

Generics provide a way to make components work with any data type and not restrict to one data type. They allow you to create reusable components that can work over a variety of types rather than a single one.

## Example

\`\`\`typescript
function identity<T>(arg: T): T {
  return arg;
}
\`\`\`

This is a much longer content to simulate a real blog post with multiple paragraphs and code examples.`,
      excerpt: 'Learn about TypeScript generics and how they help write type-safe, reusable code.',
      image: '/images/typescript-generics.jpg',
      imageAlt: 'TypeScript Generics Illustration',
      tags: ['TypeScript', 'Programming', 'Web Development'],
      author: {
        name: 'John Doe',
        email: 'john@example.com',
        image: '/images/john-avatar.jpg',
        uid: 'author-john',
        url: '/about',
        twitter: '@johndoe',
      },
      date: new Date('2024-01-15T10:00:00Z').toISOString(),
      publishedAt: new Date('2024-01-15T10:00:00Z').toISOString(),
      updatedAt: new Date('2024-01-16T10:00:00Z').toISOString(),
      slug: 'understanding-typescript-generics',
      published: true,
      upvotes: 42,
      readTime: 8,
      ...overrides,
    };
  }

  static buildMany(count: number, overrides: Partial<BlogPost> = {}): BlogPost[] {
    return Array.from({ length: count }, (_, index) =>
      this.build({
        ...overrides,
        title: `${overrides.title || 'Test Post'} ${index + 1}`,
        slug: `${overrides.slug || 'test-post'}-${index + 1}`,
      })
    );
  }

  static buildDraft(overrides: Partial<BlogPost> = {}): BlogPost {
    return this.build({
      published: false,
      publishedAt: undefined,
      ...overrides,
    });
  }

  static buildWithTags(tags: string[], overrides: Partial<BlogPost> = {}): BlogPost {
    return this.build({
      tags,
      ...overrides,
    });
  }
}

/**
 * Project Factory
 */
export class ProjectFactory {
  static build(overrides: Partial<Project> = {}): Project {
    const id = generateId();
    return {
      id,
      title: 'E-Commerce Platform',
      description: 'A modern, scalable e-commerce platform built with Next.js and TypeScript',
      content: `## Overview

This e-commerce platform provides a complete solution for online retail businesses. Built with modern technologies and best practices.

## Features

- User authentication
- Product catalog
- Shopping cart
- Payment processing
- Order management
- Admin dashboard

## Technology Stack

Built with Next.js, TypeScript, and Tailwind CSS for a robust and maintainable codebase.`,
      image: '/images/ecommerce-project.jpg',
      slug: 'ecommerce-platform',
      technologies: ['Next.js', 'TypeScript', 'React', 'Tailwind CSS', 'PostgreSQL'],
      githubUrl: 'https://github.com/example/ecommerce',
      liveUrl: 'https://ecommerce-demo.com',
      featured: true,
      status: 'completed' as const,
      createdAt: new Date('2024-01-01T10:00:00Z').toISOString(),
      updatedAt: new Date('2024-01-10T10:00:00Z').toISOString(),
      ...overrides,
    };
  }

  static buildMany(count: number, overrides: Partial<Project> = {}): Project[] {
    return Array.from({ length: count }, (_, index) =>
      this.build({
        ...overrides,
        title: `${overrides.title || 'Test Project'} ${index + 1}`,
        slug: `${overrides.slug || 'test-project'}-${index + 1}`,
      })
    );
  }

  static buildInProgress(overrides: Partial<Project> = {}): Project {
    return this.build({
      status: 'in-progress',
      featured: false,
      ...overrides,
    });
  }

  static buildFeatured(overrides: Partial<Project> = {}): Project {
    return this.build({
      featured: true,
      ...overrides,
    });
  }
}

/**
 * Author Factory
 */
export class AuthorFactory {
  static build(overrides = {}) {
    return {
      name: 'Jane Smith',
      email: 'jane@example.com',
      image: '/images/jane-avatar.jpg',
      uid: 'author-jane',
      url: '/about',
      twitter: '@janesmith',
      bio: 'Software engineer and technical writer',
      ...overrides,
    };
  }
}

/**
 * Comment Factory
 */
export class CommentFactory {
  static build(overrides = {}) {
    const id = generateId();
    return {
      id,
      content: 'Great article! Very informative.',
      author: {
        uid: 'commenter-123',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        photoURL: '/images/alice-avatar.jpg',
      },
      createdAt: new Date('2024-01-16T12:00:00Z').toISOString(),
      updatedAt: new Date('2024-01-16T12:00:00Z').toISOString(),
      parentId: null,
      replies: [],
      ...overrides,
    };
  }

  static buildMany(count: number, overrides = {}): any[] {
    return Array.from({ length: count }, () => this.build(overrides));
  }

  static buildWithReplies(replyCount: number, overrides = {}): any {
    const comment = this.build(overrides);
    comment.replies = Array.from({ length: replyCount }, (_, index) =>
      this.build({
        content: `Reply ${index + 1}`,
        parentId: comment.id,
      })
    );
    return comment;
  }
}

/**
 * Announcement Factory
 */
export class AnnouncementFactory {
  static build(overrides = {}) {
    const id = generateId();
    return {
      id,
      title: 'New Feature Release',
      content: 'We are excited to announce the release of our new commenting system!',
      slug: 'new-feature-release',
      priority: 'normal' as const,
      published: true,
      createdAt: new Date('2024-01-01T10:00:00Z').toISOString(),
      publishedAt: new Date('2024-01-01T10:00:00Z').toISOString(),
      startDate: new Date('2024-01-01T00:00:00Z').toISOString(),
      endDate: new Date('2024-12-31T23:59:59Z').toISOString(),
      author: {
        uid: 'admin-123',
        name: 'Admin User',
        email: 'admin@example.com',
      },
      ...overrides,
    };
  }

  static buildMany(count: number, overrides = {}): any[] {
    return Array.from({ length: count }, (_, index) =>
      this.build({
        ...overrides,
        title: `${overrides.title || 'Announcement'} ${index + 1}`,
        slug: `${overrides.slug || 'announcement'}-${index + 1}`,
      })
    );
  }

  static buildHighPriority(overrides = {}): any {
    return this.build({
      priority: 'high',
      ...overrides,
    });
  }
}

/**
 * User Factory
 */
export class UserFactory {
  static build(overrides = {}) {
    const id = generateId();
    return {
      uid: id,
      email: 'user@example.com',
      displayName: 'Test User',
      photoURL: '/images/user-avatar.jpg',
      emailVerified: true,
      isAdmin: false,
      getIdToken: jest.fn().mockResolvedValue('mock-id-token'),
      ...overrides,
    };
  }

  static buildAdmin(overrides = {}) {
    return this.build({
      email: 'admin@example.com',
      displayName: 'Admin User',
      isAdmin: true,
      ...overrides,
    });
  }

  static buildModerator(overrides = {}) {
    return this.build({
      email: 'mod@example.com',
      displayName: 'Moderator User',
      isModerator: true,
      ...overrides,
    });
  }
}

/**
 * Auth User Factory (for server-side auth)
 */
export class AuthUserFactory {
  static build(overrides = {}) {
    const id = generateId();
    return {
      uid: id,
      email: 'user@example.com',
      name: 'Test User',
      displayName: 'Test User',
      photoURL: '/images/user-avatar.jpg',
      role: 'user' as const,
      isAdmin: false,
      isModerator: false,
      customClaims: {},
      ...overrides,
    };
  }

  static buildAdmin(overrides = {}) {
    return this.build({
      email: 'admin@example.com',
      name: 'Admin User',
      displayName: 'Admin User',
      role: 'admin',
      isAdmin: true,
      customClaims: { admin: true },
      ...overrides,
    });
  }

  static buildModerator(overrides = {}) {
    return this.build({
      email: 'mod@example.com',
      name: 'Moderator User',
      displayName: 'Moderator User',
      role: 'moderator',
      isModerator: true,
      customClaims: { moderator: true },
      ...overrides,
    });
  }
}

/**
 * Pagination Result Factory
 */
export class PaginationFactory {
  static build<T>(items: T[], page = 1, limit = 10) {
    const total = items.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      items: items.slice(start, end),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }
}
