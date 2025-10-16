/**
 * Error handling module exports
 */

// Error classes
export {
  AppError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  DatabaseError,
  ExternalServiceError,
  RateLimitError,
  BusinessLogicError,
  ErrorCode,
  isOperationalError,
  toAppError,
  type ErrorContext,
} from './error-classes';

// Error handlers
export {
  handleApiError,
  withErrorHandler,
  handleServerComponentError,
  createErrorResponse,
  handleDatabaseError,
  handleAuthError,
  tryCatch,
  parseRequestBody,
} from './error-handler';

// Error logging
export {
  logError,
  logClientError,
  logServerError,
  createErrorContext,
  sanitizeErrorForClient,
  handleUncaughtError,
  handleUnhandledRejection,
} from './error-logger';
