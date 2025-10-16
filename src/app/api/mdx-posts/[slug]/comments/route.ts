import { NextRequest, NextResponse } from 'next/server'
import { mdxPostExists } from '@/lib/blog-mdx'
import { getCommentsByPostId, createComment } from '@/lib/comments'
import { initAdmin } from '@/lib/firebase-admin'
import { CreateCommentData } from '@/types/comment'
import { withAuth, createErrorResponse } from '@/lib/auth-middleware'
import { validateRequestBody, commentSchema } from '@/lib/validation'
import logger from '@/lib/logger'

export const dynamic = 'force-dynamic'

const DEFAULT_AVATAR = '/images/default-avatar.svg'

type RouteContext = {
  params: Promise<{ slug: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const resolvedParams = await context.params;
  const slug = resolvedParams.slug

  logger.logRouteRequest('GET', `/api/mdx-posts/${slug}/comments`);

  try {
    // Verify this is a valid MDX post
    const exists = await mdxPostExists(slug);
    if (!exists) {
      logger.warn('MDX post not found for comments request', { slug });
      return NextResponse.json([], { status: 404 });
    }

    logger.info('Fetching comments for MDX post', { slug });

    const { db, isAvailable } = initAdmin();

    // If Firebase is not available in development mode, return empty comments
    if (!isAvailable && process.env.NODE_ENV === 'development') {
      logger.info('Using mock data for comments in development mode', { slug });
      return NextResponse.json([]);
    }

    // Use the slug as the post ID for MDX posts
    const comments = await getCommentsByPostId(slug);
    logger.info('Comments retrieved successfully', { count: comments.length, slug });

    return NextResponse.json(comments);
  } catch (error) {
    logger.logRouteError('GET', `/api/mdx-posts/${slug}/comments`, error);
    return createErrorResponse(error instanceof Error ? error.message : 'Failed to fetch comments');
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const resolvedParams = await context.params;
  const slug = resolvedParams.slug

  return withAuth(request, async (authContext) => {
    logger.logRouteRequest('POST', `/api/mdx-posts/${slug}/comments`, undefined, authContext.userId);

    try {
      // Verify this is a valid MDX post
      const exists = await mdxPostExists(slug);
      if (!exists) {
        logger.warn('MDX post not found for comments creation', { slug });
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }

      logger.info('Starting comment creation for MDX post', {
        slug,
        userId: authContext.userId
      });

      // Validate request body against schema
      const validationResult = await validateRequestBody(request, commentSchema);
      if (!validationResult.success) {
        logger.warn('Comment validation failed', {
          slug,
          userId: authContext.userId
        });
        return 'error' in validationResult ? validationResult.error : NextResponse.json({ error: 'Validation failed' }, { status: 400 });
      }

      const data = validationResult.data;
      logger.debug('Comment data validated', {
        slug,
        contentPreview: data.content?.substring(0, 50),
        parentId: data.parentId
      });

      // Create the comment using the slug as the postId
      const newComment = await createComment(
        authContext.userId,
        {
          name: data.author.name || '',
          email: data.author.email || '',
          image: data.author.image || DEFAULT_AVATAR
        },
        {
          content: data.content || '',
          postId: slug, // Use the slug as the postId
          parentId: data.parentId,
          author: {
            name: data.author.name || '',
            email: data.author.email || '',
            image: data.author.image || DEFAULT_AVATAR
          }
        }
      );

      logger.info('Comment created successfully for MDX post', {
        commentId: newComment.id,
        slug,
        userId: authContext.userId
      });

      return NextResponse.json(newComment);
    } catch (error) {
      logger.logRouteError('POST', `/api/mdx-posts/${slug}/comments`, error, authContext.userId);
      return createErrorResponse(error instanceof Error ? error.message : 'Failed to create comment');
    }
  });
}
