import { NextRequest, NextResponse } from 'next/server'
import { mdxPostExists } from '@/lib/blog-mdx'
import { createComment } from '@/lib/comments'
import { initAdmin } from '@/lib/firebase-admin'
import { withAuth, createErrorResponse } from '@/lib/auth-middleware'
import { validateRequestBody, commentSchema } from '@/lib/validation'
import logger from '@/lib/logger'

export const dynamic = 'force-dynamic'

const DEFAULT_AVATAR = '/images/default-avatar.svg'

type RouteContext = {
  params: {
    slug: string
    commentId: string
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const resolvedParams = await context.params;
  const { slug, commentId } = resolvedParams;

  return withAuth(request, async (authContext) => {
    logger.logRouteRequest('POST', `/api/mdx-posts/${slug}/comments/${commentId}/replies`, undefined, authContext.userId);

    try {
      // Verify this is a valid MDX post
      const exists = await mdxPostExists(slug);
      if (!exists) {
        logger.warn('MDX post not found for reply creation', { slug, commentId });
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }

      // Validate request body first to get the data
      const validationResult = await validateRequestBody(request, commentSchema);

      if (!validationResult.success) {
        logger.warn('Reply validation failed', {
          slug,
          commentId,
          userId: authContext.userId
        });
        return validationResult.error;
      }

      const data = validationResult.data;

      const { isAvailable } = initAdmin();

      // If Firebase is not available in development mode, return mock response
      if (!isAvailable && process.env.NODE_ENV === 'development') {
        logger.info('Using mock data for reply creation in development mode', { slug, commentId });
        return NextResponse.json({
          id: 'mock-reply-id',
          content: data.content,
          postId: slug,
          parentId: commentId,
          userId: authContext.userId,
          author: data.author,
          createdAt: new Date().toISOString(),
          updatedAt: null
        });
      }
      logger.debug('Reply data validated', {
        slug,
        commentId,
        contentPreview: data.content?.substring(0, 50)
      });

      // Create the reply
      const newReply = await createComment(
        authContext.userId,
        {
          name: data.author.name,
          email: data.author.email,
          image: data.author.image || DEFAULT_AVATAR
        },
        {
          content: data.content,
          postId: slug, // Use the slug as the postId
          parentId: commentId,
          author: data.author
        }
      );

      logger.info('Reply created successfully for MDX post', {
        replyId: newReply.id,
        commentId,
        slug,
        userId: authContext.userId
      });

      return NextResponse.json(newReply);
    } catch (error) {
      logger.logRouteError('POST', `/api/mdx-posts/${slug}/comments/${commentId}/replies`, error, authContext.userId);
      return createErrorResponse(error instanceof Error ? error.message : 'Failed to create reply');
    }
  });
}
