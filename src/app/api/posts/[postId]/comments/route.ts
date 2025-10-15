import { NextRequest, NextResponse } from 'next/server'
import { getCommentsByPostId, createComment } from '@/lib/comments'
import { CreateCommentData } from '@/types/comment'
import { withAuth, createErrorResponse } from '@/lib/auth-middleware'
import { validateRequestBody, commentSchema } from '@/lib/validation'
import logger from '@/lib/logger'

export const dynamic = 'force-dynamic'

const DEFAULT_AVATAR = '/images/default-avatar.svg'

type RouteContext = {
  params: Promise<{ postId: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const resolvedParams = await context.params;
  const postId = resolvedParams.postId

  logger.logRouteRequest('GET', `/api/posts/${postId}/comments`);

  try {
    logger.info('Fetching comments for post', { postId });
    const comments = await getCommentsByPostId(postId);
    logger.info('Comments retrieved successfully', { count: comments.length, postId });

    return NextResponse.json(comments);
  } catch (error) {
    logger.logRouteError('GET', `/api/posts/${postId}/comments`, error);
    return createErrorResponse(error instanceof Error ? error.message : 'Failed to fetch comments');
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const resolvedParams = await context.params;
  const postId = resolvedParams.postId

  return withAuth(request, async (authContext) => {
    logger.logRouteRequest('POST', `/api/posts/${postId}/comments`, undefined, authContext.userId);

    try {
      logger.info('Starting comment creation', {
        postId,
        userId: authContext.userId
      });

      // Validate request body against schema
      const validationResult = await validateRequestBody(request, commentSchema);
      if (!validationResult.success) {
        logger.warn('Comment validation failed', {
          postId,
          userId: authContext.userId
        });
        return 'error' in validationResult ? validationResult.error : NextResponse.json({ error: 'Validation failed' }, { status: 400 });
      }

      const data = validationResult.data;
      logger.debug('Comment data validated', {
        postId,
        contentPreview: data.content?.substring(0, 50),
        parentId: data.parentId
      });

      // Create the comment
      const newComment = await createComment(
        authContext.userId,
        {
          name: data.author.name || '',
          email: data.author.email || '',
          image: data.author.image || DEFAULT_AVATAR
        },
        {
          content: data.content || '',
          postId, // Use the postId from params
          parentId: data.parentId,
          author: {
            name: data.author.name || '',
            email: data.author.email || '',
            image: data.author.image || DEFAULT_AVATAR
          }
        }
      );

      logger.info('Comment created successfully', {
        commentId: newComment.id,
        postId,
        userId: authContext.userId
      });

      return NextResponse.json(newComment);
    } catch (error) {
      logger.logRouteError('POST', `/api/posts/${postId}/comments`, error, authContext.userId);
      return createErrorResponse(error instanceof Error ? error.message : 'Failed to create comment');
    }
  });
}
