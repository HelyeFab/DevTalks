import { NextRequest, NextResponse } from 'next/server'
import { mdxPostExists } from '@/lib/blog-mdx'
import { updateComment, deleteComment } from '@/lib/comments'
import { initAdmin } from '@/lib/firebase-admin'
import { withAuth, createErrorResponse } from '@/lib/auth-middleware'
import { validateRequestBody, commentSchema } from '@/lib/validation'
import logger from '@/lib/logger'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: {
    slug: string
    commentId: string
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const resolvedParams = await context.params;
  const { slug, commentId } = resolvedParams;

  return withAuth(request, async (authContext) => {
    logger.logRouteRequest('PUT', `/api/mdx-posts/${slug}/comments/${commentId}`, undefined, authContext.userId);

    try {
      // Verify this is a valid MDX post
      const exists = await mdxPostExists(slug);
      if (!exists) {
        logger.warn('MDX post not found for comment update', { slug, commentId });
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }

      const { isAvailable } = initAdmin();

      // If Firebase is not available in development mode, return success response
      if (!isAvailable && process.env.NODE_ENV === 'development') {
        logger.info('Using mock data for comment update in development mode', { slug, commentId });
        return NextResponse.json({ success: true });
      }

      // Validate request body
      const validationResult = await validateRequestBody(request, commentSchema);
      if (!validationResult.success) {
        logger.warn('Comment update validation failed', {
          slug,
          commentId,
          userId: authContext.userId
        });
        return validationResult.error;
      }

      const data = validationResult.data;

      // Update the comment
      await updateComment(
        commentId,
        authContext.userId,
        {
          content: data.content,
          postId: slug // Use the slug as the postId
        }
      );

      logger.info('Comment updated successfully for MDX post', {
        commentId,
        slug,
        userId: authContext.userId
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      logger.logRouteError('PUT', `/api/mdx-posts/${slug}/comments/${commentId}`, error, authContext.userId);
      return createErrorResponse(error instanceof Error ? error.message : 'Failed to update comment');
    }
  });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const resolvedParams = await context.params;
  const { slug, commentId } = resolvedParams;

  return withAuth(request, async (authContext) => {
    logger.logRouteRequest('DELETE', `/api/mdx-posts/${slug}/comments/${commentId}`, undefined, authContext.userId);

    try {
      // Verify this is a valid MDX post
      const exists = await mdxPostExists(slug);
      if (!exists) {
        logger.warn('MDX post not found for comment deletion', { slug, commentId });
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }

      const { isAvailable } = initAdmin();

      // If Firebase is not available in development mode, return success response
      if (!isAvailable && process.env.NODE_ENV === 'development') {
        logger.info('Using mock data for comment deletion in development mode', { slug, commentId });
        return NextResponse.json({ success: true });
      }

      const isAdmin = authContext.isAdmin || false;

      // Delete the comment
      const success = await deleteComment(
        commentId,
        authContext.userId,
        isAdmin,
        slug // Use the slug as the postId
      );

      if (!success) {
        return NextResponse.json(
          { error: 'Not authorized to delete this comment' },
          { status: 403 }
        );
      }

      logger.info('Comment deleted successfully for MDX post', {
        commentId,
        slug,
        userId: authContext.userId
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      logger.logRouteError('DELETE', `/api/mdx-posts/${slug}/comments/${commentId}`, error, authContext.userId);
      return createErrorResponse(error instanceof Error ? error.message : 'Failed to delete comment');
    }
  });
}
