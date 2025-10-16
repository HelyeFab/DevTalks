/**
 * Error logging service
 * Provides centralized error logging with context and environment-aware handling
 */

import * as logger from '@/lib/logger';
import { AppError, ErrorContext, isOperationalError } from './error-classes';

export interface ErrorLogEntry {
  message: string;
  error: Error | AppError;
  context?: ErrorContext;
  timestamp: string;
  environment: string;
  userId?: string;
  path?: string;
  userAgent?: string;
}

/**
 * Log an error with full context
 */
export function logError(
  error: Error | AppError,
  context?: ErrorContext,
  additionalInfo?: Record<string, unknown>
): void {
  const isOperational = isOperationalError(error);
  const logEntry: ErrorLogEntry = {
    message: error.message,
    error,
    context,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    userId: context?.userId,
    path: context?.path,
    ...additionalInfo,
  };

  // Prepare log context
  const logContext = {
    ...context,
    ...additionalInfo,
    isOperational,
    errorType: error.constructor.name,
    ...(error instanceof AppError && {
      code: error.code,
      statusCode: error.statusCode,
    }),
  };

  // Log based on error severity
  if (isOperational) {
    logger.warn(error.message, logContext);
  } else {
    logger.error(error.message, logContext);
  }

  // In production, send to external service (Sentry, etc.)
  if (process.env.NODE_ENV === 'production') {
    sendToExternalService(logEntry);
  }
}

/**
 * Log client-side errors
 */
export function logClientError(
  error: Error | AppError,
  componentStack?: string,
  context?: ErrorContext
): void {
  const logContext: ErrorContext = {
    ...context,
    componentStack,
    clientSide: true,
  };

  logError(error, logContext, {
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
  });
}

/**
 * Log server-side errors
 */
export function logServerError(
  error: Error | AppError,
  request?: {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
  },
  context?: ErrorContext
): void {
  const logContext: ErrorContext = {
    ...context,
    method: request?.method,
    path: request?.url,
    serverSide: true,
  };

  logError(error, logContext, {
    headers: request?.headers,
  });
}

/**
 * Send error to external monitoring service (e.g., Sentry)
 * This is a placeholder for integration
 */
function sendToExternalService(logEntry: ErrorLogEntry): void {
  // Placeholder for Sentry or other monitoring service
  // Example Sentry integration:
  /*
  if (typeof window !== 'undefined' && window.Sentry) {
    window.Sentry.captureException(logEntry.error, {
      contexts: {
        custom: logEntry.context,
      },
      tags: {
        environment: logEntry.environment,
      },
      user: {
        id: logEntry.userId,
      },
    });
  }
  */

  // For now, just log that we would send to external service
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    logger.info('Would send error to Sentry', {
      message: logEntry.message,
      timestamp: logEntry.timestamp,
    });
  }
}

/**
 * Create error context from Next.js request
 */
export function createErrorContext(
  request?: Request,
  userId?: string
): ErrorContext {
  return {
    userId,
    method: request?.method,
    path: request?.url,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Sanitize error for client response
 * Removes sensitive information
 */
export function sanitizeErrorForClient(error: Error | AppError): {
  message: string;
  code?: string;
  statusCode?: number;
} {
  if (error instanceof AppError) {
    return {
      message: error.getUserMessage(),
      code: error.code,
      statusCode: error.statusCode,
    };
  }

  // For generic errors, don't expose details in production
  if (process.env.NODE_ENV === 'production') {
    return {
      message: 'An unexpected error occurred. Please try again later.',
      statusCode: 500,
    };
  }

  return {
    message: error.message,
    statusCode: 500,
  };
}

/**
 * Handle uncaught errors
 */
export function handleUncaughtError(error: Error, context?: ErrorContext): void {
  logger.error('Uncaught error', {
    error,
    context,
    stack: error.stack,
  });

  // Log to external service
  if (process.env.NODE_ENV === 'production') {
    sendToExternalService({
      message: error.message,
      error,
      context,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  }
}

/**
 * Handle unhandled promise rejections
 */
export function handleUnhandledRejection(reason: unknown, context?: ErrorContext): void {
  const error = reason instanceof Error ? reason : new Error(String(reason));

  logger.error('Unhandled promise rejection', {
    error,
    context,
    reason,
  });

  // Log to external service
  if (process.env.NODE_ENV === 'production') {
    sendToExternalService({
      message: 'Unhandled promise rejection',
      error,
      context,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  }
}
