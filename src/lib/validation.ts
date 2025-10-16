import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Validates request body against a Zod schema
 * @param req The Next.js request object
 * @param schema The Zod schema to validate against
 * @returns The validated request body or throws an error
 */
export async function validateRequestBody<T>(
  req: NextRequest,
  schema: z.ZodType<T>
): Promise<{ success: true; data: T } | { success: false; error: NextResponse }> {
  try {
    // Parse the request body
    const body = await req.json();

    // Validate the body against the schema
    const result = schema.safeParse(body);

    if (!result.success) {
      // Format error messages
      const formatted = result.error.format();
      return {
        success: false,
        error: NextResponse.json(
          {
            error: 'Invalid request data',
            details: formatted
          },
          { status: 400 }
        )
      };
    }

    return {
      success: true,
      data: result.data
    };
  } catch (error) {
    console.error('Error parsing request body:', error);
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Failed to parse request body' },
        { status: 400 }
      )
    };
  }
}

// Common schema definitions

// Blog post schema
export const blogPostSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  subtitle: z.string().optional(),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  excerpt: z.string().optional(),
  image: z.string().url('Image must be a valid URL').optional(),
  imageAlt: z.string().optional(),
  tags: z.array(z.string()).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  published: z.boolean().optional().default(false),
});

// Comment schema
export const commentSchema = z.object({
  content: z.string().min(1, 'Comment content is required'),
  author: z.object({
    name: z.string().min(1, 'Author name is required'),
    email: z.string().email('Valid email is required'),
    image: z.string().url('Image must be a valid URL').optional(),
  }),
  postId: z.string().optional(), // Sometimes postId comes from the URL
  parentId: z.string().optional(), // For replies
});

// Project schema
export const projectSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  image: z.string().url('Image must be a valid URL'),
  technologies: z.array(z.string()),
  githubUrl: z.string().url('GitHub URL must be a valid URL').optional(),
  liveUrl: z.string().url('Live URL must be a valid URL').optional(),
  featured: z.boolean().optional().default(false),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  subtitle: z.string().optional(),
});

// Announcement schema
export const announcementSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title too long'),
  content: z.string().min(10, 'Content must be at least 10 characters').max(5000, 'Content too long'),
  pinned: z.boolean().optional().default(false),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  published: z.boolean().optional().default(false),
});

// User profile schema
export const profileSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(100, 'Display name too long'),
  bio: z.string().max(500, 'Bio too long').optional(),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  github: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  twitter: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  linkedin: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

// Contact form schema
export const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Valid email is required'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message too long'),
});

// Image upload schema
export const imageUploadSchema = z.object({
  name: z.string().min(1, 'File name is required'),
  type: z.string().regex(/^image\/(jpeg|jpg|png|gif|webp)$/, 'Invalid image type'),
  size: z.number().max(5 * 1024 * 1024, 'File size must be less than 5MB'),
});

// Upvote schema
export const upvoteSchema = z.object({
  postId: z.string().min(1, 'Post ID is required'),
});

// Sanitization helpers
export function sanitizeString(str: string): string {
  // Remove potential XSS vectors
  return str
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim()
    .slice(0, 10000) // Max length safety
}

export function sanitizeHtml(html: string): string {
  // For HTML content, we should use a proper sanitization library
  // For now, just basic sanitization
  return html.trim().slice(0, 50000)
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// URL validation
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Slug validation
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug)
}
