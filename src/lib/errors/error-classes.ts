/**
 * Custom error classes for the application
 * Provides structured error types with additional context
 */

export enum ErrorCode {
  // Authentication errors (4xx)
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // Resource errors (4xx)
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  INVALID_INPUT = 'INVALID_INPUT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Business logic errors
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  OPERATION_FAILED = 'OPERATION_FAILED',
}

export interface ErrorContext {
  userId?: string;
  path?: string;
  method?: string;
  timestamp?: string;
  [key: string]: unknown;
}

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly context?: ErrorContext;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number,
    context?: ErrorContext,
    isOperational = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.context = {
      ...context,
      timestamp: new Date().toISOString(),
    };
    this.isOperational = isOperational;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Serialize error for logging or API response
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined,
    };
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    // Don't expose internal error details to users
    const userMessages: Record<ErrorCode, string> = {
      [ErrorCode.UNAUTHORIZED]: 'Please sign in to access this resource.',
      [ErrorCode.FORBIDDEN]: 'You do not have permission to access this resource.',
      [ErrorCode.INVALID_TOKEN]: 'Your session is invalid. Please sign in again.',
      [ErrorCode.SESSION_EXPIRED]: 'Your session has expired. Please sign in again.',
      [ErrorCode.NOT_FOUND]: 'The requested resource was not found.',
      [ErrorCode.ALREADY_EXISTS]: 'This resource already exists.',
      [ErrorCode.INVALID_INPUT]: 'The provided information is invalid.',
      [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again.',
      [ErrorCode.INTERNAL_ERROR]: 'An unexpected error occurred. Please try again later.',
      [ErrorCode.DATABASE_ERROR]: 'A database error occurred. Please try again later.',
      [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'An external service error occurred. Please try again later.',
      [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later.',
      [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'You do not have sufficient permissions for this action.',
      [ErrorCode.OPERATION_FAILED]: 'The operation failed. Please try again.',
    };

    return userMessages[this.code] || this.message;
  }
}

/**
 * Authentication related errors
 */
export class AuthenticationError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.UNAUTHORIZED, context?: ErrorContext) {
    super(message, code, 401, context);
  }
}

/**
 * Authorization related errors
 */
export class AuthorizationError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.FORBIDDEN, context?: ErrorContext) {
    super(message, code, 403, context);
  }
}

/**
 * Resource not found errors
 */
export class NotFoundError extends AppError {
  constructor(resource: string, context?: ErrorContext) {
    super(`${resource} not found`, ErrorCode.NOT_FOUND, 404, context);
  }
}

/**
 * Validation errors
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, context);
  }
}

/**
 * Database errors
 */
export class DatabaseError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ErrorCode.DATABASE_ERROR, 500, context, false);
  }
}

/**
 * External service errors
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, context?: ErrorContext) {
    super(`${service} error: ${message}`, ErrorCode.EXTERNAL_SERVICE_ERROR, 502, context, false);
  }
}

/**
 * Rate limit errors
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', context?: ErrorContext) {
    super(message, ErrorCode.RATE_LIMIT_EXCEEDED, 429, context);
  }
}

/**
 * Business logic errors
 */
export class BusinessLogicError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super(message, ErrorCode.OPERATION_FAILED, 400, context);
  }
}

/**
 * Check if an error is an operational error (expected/handled)
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Convert unknown error to AppError
 */
export function toAppError(error: unknown, context?: ErrorContext): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(
      error.message,
      ErrorCode.INTERNAL_ERROR,
      500,
      { ...context, originalError: error.name },
      false
    );
  }

  return new AppError(
    'An unknown error occurred',
    ErrorCode.INTERNAL_ERROR,
    500,
    { ...context, originalError: String(error) },
    false
  );
}
