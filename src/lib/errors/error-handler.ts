/**
 * Error handler utilities for both client and server
 * Provides consistent error handling across the application
 */

import { NextResponse } from 'next/server';
import { AppError, toAppError, ErrorContext } from './error-classes';
import { logServerError, sanitizeErrorForClient, createErrorContext } from './error-logger';

/**
 * Handle API route errors
 * Returns appropriate HTTP response based on error type
 */
export function handleApiError(
  error: unknown,
  request?: Request,
  userId?: string
): NextResponse {
  const appError = toAppError(error);
  const context = createErrorContext(request, userId);

  // Log the error
  logServerError(appError, {
    method: request?.method,
    url: request?.url,
  }, context);

  // Sanitize error for client
  const clientError = sanitizeErrorForClient(appError);

  return NextResponse.json(
    {
      error: clientError.message,
      code: clientError.code,
    },
    { status: clientError.statusCode || 500 }
  );
}

/**
 * Async handler wrapper for API routes
 * Automatically catches and handles errors
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<Response>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      const request = args[0] as Request;
      return handleApiError(error, request);
    }
  }) as T;
}

/**
 * Handle server component errors
 */
export function handleServerComponentError(
  error: unknown,
  context?: ErrorContext
): never {
  const appError = toAppError(error, context);

  // Log the error
  logServerError(appError, undefined, context);

  // Re-throw to be caught by error boundary
  throw appError;
}

/**
 * Create error response helper
 */
export function createErrorResponse(
  message: string,
  statusCode: number = 500,
  code?: string
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      code,
    },
    { status: statusCode }
  );
}

/**
 * Handle database errors
 */
export function handleDatabaseError(error: unknown, operation: string): never {
  const appError = toAppError(error, {
    operation,
    type: 'database',
  });

  logServerError(appError, undefined, { operation });

  throw appError;
}

/**
 * Handle Firebase Auth errors
 */
export function handleAuthError(error: unknown): never {
  // Map common Firebase auth error codes to AppError
  const firebaseError = error as any;
  const errorCode = firebaseError?.code || '';

  let message = 'Authentication failed';
  let statusCode = 401;

  switch (errorCode) {
    case 'auth/id-token-expired':
      message = 'Your session has expired. Please sign in again.';
      break;
    case 'auth/invalid-id-token':
      message = 'Invalid authentication token.';
      break;
    case 'auth/user-not-found':
      message = 'User not found.';
      statusCode = 404;
      break;
    case 'auth/wrong-password':
      message = 'Invalid credentials.';
      break;
    case 'auth/too-many-requests':
      message = 'Too many failed attempts. Please try again later.';
      statusCode = 429;
      break;
    default:
      message = firebaseError?.message || message;
  }

  const appError = new AppError(
    message,
    'UNAUTHORIZED' as any,
    statusCode,
    { firebaseErrorCode: errorCode }
  );

  logServerError(appError);

  throw appError;
}

/**
 * Try-catch wrapper for async operations
 */
export async function tryCatch<T>(
  operation: () => Promise<T>,
  errorContext?: ErrorContext
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const appError = toAppError(error, errorContext);
    logServerError(appError, undefined, errorContext);
    throw appError;
  }
}

/**
 * Validate and handle request body parsing
 */
export async function parseRequestBody<T>(request: Request): Promise<T> {
  try {
    return await request.json();
  } catch (error) {
    throw new AppError(
      'Invalid request body',
      'INVALID_INPUT' as any,
      400,
      { error: String(error) }
    );
  }
}
