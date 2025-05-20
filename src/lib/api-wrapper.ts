import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth, AuthContext, createErrorResponse } from './auth-middleware';
import { validateRequestBody } from './validation';
import { withRateLimit } from './rate-limit';
import logger from './logger';
import { addCacheControl, CacheControlOptions } from './cache-control';

/**
 * Configuration options for API route handlers
 */
interface ApiHandlerConfig<SchemaType = any> {
  // Authentication options
  requireAuth?: boolean;
  requireAdmin?: boolean;

  // Validation options
  schema?: z.ZodType<SchemaType>;

  // Rate limiting options
  rateLimit?: {
    limit?: number;
    windowMs?: number;
    message?: string;
  };

  // Caching options
  cache?: CacheControlOptions;
}

/**
 * Extended NextRequest with typed validated data
 */
export interface ApiRequest<T = any> extends NextRequest {
  validatedData?: T;
  auth?: AuthContext;
}

/**
 * Type for API route handlers
 */
export type ApiHandler<T = any> = (
  req: ApiRequest<T>,
  ...args: any[]
) => Promise<NextResponse>;

/**
 * Creates an API route handler with standardized error handling, logging,
 * validation, authentication, and rate limiting.
 *
 * @param handler The API route handler function
 * @param config Configuration options
 */
export function createApiHandler<SchemaType = any>(
  handler: ApiHandler<SchemaType>,
  config: ApiHandlerConfig<SchemaType> = {}
): ApiHandler<SchemaType> {
  // The base handler with error handling and response formatting
  const baseHandler = async (req: ApiRequest<SchemaType>, ...args: any[]): Promise<NextResponse> => {
    const method = req.method;
    const url = new URL(req.url);
    const path = url.pathname;

    try {
      // Log the request
      logger.logRouteRequest(method, path, Object.fromEntries(url.searchParams), req.auth?.userId);

      // Validate request body if schema is provided
      if (config.schema && ['POST', 'PUT', 'PATCH'].includes(method)) {
        const validationResult = await validateRequestBody(req, config.schema);

        if (!validationResult.success) {
          logger.warn('Request validation failed', { path, method });
          return validationResult.error;
        }

        // Add validated data to request object
        req.validatedData = validationResult.data;
      }

      // Call the actual handler
      const response = await handler(req, ...args);

      // Add cache headers if configured
      if (config.cache) {
        return addCacheControl(response, config.cache);
      }

      return response;
    } catch (error) {
      // Log the error
      logger.logRouteError(method, path, error, req.auth?.userId);

      // Return a standardized error response
      return createErrorResponse(error instanceof Error ? error.message : 'Internal server error');
    }
  };

  // Apply rate limiting if configured
  const rateLimitedHandler = config.rateLimit
    ? withRateLimit(baseHandler, {
        ...config.rateLimit,
        getUserId: async (request) => {
          // If we need a user ID for rate limiting and the route requires auth,
          // we can extract it from the auth context that will be available later
          return config.requireAuth ? undefined : undefined;
        }
      })
    : baseHandler;

  // Apply authentication if required
  const authenticatedHandler = config.requireAuth
    ? async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
        return withAuth(
          req,
          async (authContext) => {
            // Add auth context to request
            (req as ApiRequest).auth = authContext;

            // Check admin status if required
            if (config.requireAdmin && !authContext.isAdmin) {
              logger.warn('Admin access denied', { userId: authContext.userId, path: new URL(req.url).pathname });
              return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
              );
            }

            return rateLimitedHandler(req as ApiRequest<SchemaType>, ...args);
          },
          config.requireAdmin
        );
      }
    : rateLimitedHandler;

  return authenticatedHandler;
}
