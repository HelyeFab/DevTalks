import { NextResponse } from 'next/server';
import { getAllPosts, getPostBySlug, createPost } from '@/lib/blog';
import { getPaginationFromRequest } from '@/lib/pagination';
import { getCacheSettingsForPublicData } from '@/lib/cache-control';
import { blogPostSchema } from '@/lib/validation';
import { createApiHandler, ApiRequest } from '@/lib/api-wrapper';

export const dynamic = 'force-dynamic';

/**
 * GET handler for retrieving blog posts with pagination
 */
export const GET = createApiHandler(
  async (request: ApiRequest) => {
    // Get pagination parameters from the request
    const pagination = getPaginationFromRequest(request);

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const publishedOnly = searchParams.get('published') !== 'false';
    const tag = searchParams.get('tag');
    const slug = searchParams.get('slug');

    // If slug is provided, return a single post
    if (slug) {
      const post = await getPostBySlug(slug, !publishedOnly);

      if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }

      return NextResponse.json(post);
    }

    // Get blog posts with pagination
    const postsResult = await getAllPosts({
      publishedOnly,
      pagination
    });

    // Return the paginated posts
    return NextResponse.json(postsResult);
  },
  {
    // Add caching for GET requests
    cache: getCacheSettingsForPublicData(),

    // Add rate limiting to prevent abuse
    rateLimit: {
      limit: 100,
      windowMs: 60 * 1000, // 1 minute
    }
  }
);

/**
 * POST handler for creating a new blog post (admin only)
 */
export const POST = createApiHandler(
  async (request: ApiRequest) => {
    // The validated data is available due to the schema in the config
    const postData = request.validatedData!;

    // Create the blog post (the auth check is handled by the wrapper)
    const newPost = await createPost(postData);

    return NextResponse.json(newPost, { status: 201 });
  },
  {
    // Require authentication and admin privileges
    requireAuth: true,
    requireAdmin: true,

    // Validate against the blog post schema
    schema: blogPostSchema,

    // Add rate limiting
    rateLimit: {
      limit: 20,
      windowMs: 60 * 1000 // 1 minute
    }
  }
);
