/**
 * Tests for Error Handler
 * Validates error handling utilities for API routes and server components
 */

import {
  handleApiError,
  withErrorHandler,
  handleServerComponentError,
  createErrorResponse,
  handleDatabaseError,
  handleAuthError,
  tryCatch,
  parseRequestBody,
} from '@/lib/errors/error-handler';
import { AppError } from '@/lib/errors/error-classes';
import { NextResponse } from 'next/server';

// Mock dependencies
jest.mock('@/lib/errors/error-logger', () => ({
  logServerError: jest.fn(),
  sanitizeErrorForClient: jest.fn((error) => ({
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
  })),
  createErrorContext: jest.fn(() => ({})),
}));

describe('Error Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleApiError()', () => {
    it('should handle AppError correctly', () => {
      const error = new AppError('Test error', 'TEST_ERROR', 400);
      const response = handleApiError(error);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(400);
    });

    it('should handle generic errors', () => {
      const error = new Error('Generic error');
      const response = handleApiError(error);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(500);
    });

    it('should include error message in response', async () => {
      const error = new AppError('Custom message', 'CUSTOM_ERROR', 403);
      const response = handleApiError(error);
      const body = await response.json();

      expect(body.error).toBe('Custom message');
      expect(body.code).toBe('CUSTOM_ERROR');
    });

    it('should handle request context', () => {
      const request = new Request('https://example.com/api/test', {
        method: 'POST',
      });
      const error = new Error('Test error');

      const response = handleApiError(error, request);

      expect(response).toBeInstanceOf(NextResponse);
    });

    it('should handle userId context', () => {
      const error = new Error('Test error');
      const response = handleApiError(error, undefined, 'user-123');

      expect(response).toBeInstanceOf(NextResponse);
    });
  });

  describe('withErrorHandler()', () => {
    it('should wrap handler and return response on success', async () => {
      const successResponse = NextResponse.json({ success: true });
      const handler = jest.fn().mockResolvedValue(successResponse);
      const wrappedHandler = withErrorHandler(handler);

      const request = new Request('https://example.com/api/test');
      const response = await wrappedHandler(request);

      expect(handler).toHaveBeenCalledWith(request);
      expect(response).toBe(successResponse);
    });

    it('should catch errors and return error response', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('Handler error'));
      const wrappedHandler = withErrorHandler(handler);

      const request = new Request('https://example.com/api/test');
      const response = await wrappedHandler(request);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(500);
    });

    it('should handle AppError with correct status', async () => {
      const handler = jest
        .fn()
        .mockRejectedValue(new AppError('Not found', 'NOT_FOUND', 404));
      const wrappedHandler = withErrorHandler(handler);

      const request = new Request('https://example.com/api/test');
      const response = await wrappedHandler(request);

      expect(response.status).toBe(404);
    });
  });

  describe('handleServerComponentError()', () => {
    it('should re-throw AppError', () => {
      const error = new AppError('Component error', 'COMPONENT_ERROR', 500);

      expect(() => handleServerComponentError(error)).toThrow(AppError);
      expect(() => handleServerComponentError(error)).toThrow('Component error');
    });

    it('should convert generic error to AppError', () => {
      const error = new Error('Generic error');

      expect(() => handleServerComponentError(error)).toThrow(AppError);
    });

    it('should include error context', () => {
      const error = new Error('Test error');
      const context = { component: 'TestComponent' };

      expect(() => handleServerComponentError(error, context)).toThrow();
    });
  });

  describe('createErrorResponse()', () => {
    it('should create error response with message and status', async () => {
      const response = createErrorResponse('Not found', 404);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error).toBe('Not found');
    });

    it('should default to 500 status code', async () => {
      const response = createErrorResponse('Server error');

      expect(response.status).toBe(500);
    });

    it('should include error code when provided', async () => {
      const response = createErrorResponse('Bad request', 400, 'INVALID_INPUT');
      const body = await response.json();

      expect(body.code).toBe('INVALID_INPUT');
    });

    it('should omit code when not provided', async () => {
      const response = createErrorResponse('Error message', 500);
      const body = await response.json();

      expect(body.code).toBeUndefined();
    });
  });

  describe('handleDatabaseError()', () => {
    it('should throw AppError with operation context', () => {
      const error = new Error('Database connection failed');

      expect(() =>
        handleDatabaseError(error, 'fetch posts')
      ).toThrow(AppError);
    });

    it('should include operation in error context', () => {
      const error = new Error('Query failed');

      try {
        handleDatabaseError(error, 'update user');
        fail('Should have thrown error');
      } catch (err: any) {
        expect(err).toBeInstanceOf(AppError);
      }
    });
  });

  describe('handleAuthError()', () => {
    it('should map expired token error', () => {
      const error = {
        code: 'auth/id-token-expired',
        message: 'Token expired',
      };

      try {
        handleAuthError(error);
        fail('Should have thrown error');
      } catch (err: any) {
        expect(err).toBeInstanceOf(AppError);
        expect(err.message).toContain('session has expired');
        expect(err.statusCode).toBe(401);
      }
    });

    it('should map invalid token error', () => {
      const error = {
        code: 'auth/invalid-id-token',
        message: 'Invalid token',
      };

      try {
        handleAuthError(error);
        fail('Should have thrown error');
      } catch (err: any) {
        expect(err).toBeInstanceOf(AppError);
        expect(err.message).toContain('Invalid authentication token');
      }
    });

    it('should map user not found error', () => {
      const error = {
        code: 'auth/user-not-found',
        message: 'User not found',
      };

      try {
        handleAuthError(error);
        fail('Should have thrown error');
      } catch (err: any) {
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(404);
      }
    });

    it('should map too many requests error', () => {
      const error = {
        code: 'auth/too-many-requests',
        message: 'Too many attempts',
      };

      try {
        handleAuthError(error);
        fail('Should have thrown error');
      } catch (err: any) {
        expect(err).toBeInstanceOf(AppError);
        expect(err.statusCode).toBe(429);
      }
    });

    it('should handle unknown auth errors', () => {
      const error = {
        code: 'auth/unknown-error',
        message: 'Unknown error',
      };

      try {
        handleAuthError(error);
        fail('Should have thrown error');
      } catch (err: any) {
        expect(err).toBeInstanceOf(AppError);
      }
    });

    it('should handle generic errors without code', () => {
      const error = new Error('Generic error');

      try {
        handleAuthError(error);
        fail('Should have thrown error');
      } catch (err: any) {
        expect(err).toBeInstanceOf(AppError);
      }
    });
  });

  describe('tryCatch()', () => {
    it('should return result on success', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const result = await tryCatch(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalled();
    });

    it('should throw AppError on failure', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Failed'));

      await expect(tryCatch(operation)).rejects.toThrow(AppError);
    });

    it('should include error context', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Failed'));
      const context = { operation: 'test' };

      await expect(tryCatch(operation, context)).rejects.toThrow();
    });

    it('should preserve AppError', async () => {
      const appError = new AppError('Custom error', 'CUSTOM', 400);
      const operation = jest.fn().mockRejectedValue(appError);

      try {
        await tryCatch(operation);
        fail('Should have thrown error');
      } catch (err) {
        expect(err).toBe(appError);
      }
    });
  });

  describe('parseRequestBody()', () => {
    it('should parse valid JSON body', async () => {
      const body = { name: 'test', value: 123 };
      const request = new Request('https://example.com', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const parsed = await parseRequestBody(request);

      expect(parsed).toEqual(body);
    });

    it('should throw AppError for invalid JSON', async () => {
      const request = new Request('https://example.com', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      await expect(parseRequestBody(request)).rejects.toThrow(AppError);
    });

    it('should throw error with 400 status code', async () => {
      const request = new Request('https://example.com', {
        method: 'POST',
        body: 'invalid',
      });

      try {
        await parseRequestBody(request);
        fail('Should have thrown error');
      } catch (err: any) {
        expect(err.statusCode).toBe(400);
        expect(err.code).toBe('INVALID_INPUT');
      }
    });

    it('should handle empty body', async () => {
      const request = new Request('https://example.com', {
        method: 'POST',
      });

      // Empty body should throw parsing error
      await expect(parseRequestBody(request)).rejects.toThrow();
    });
  });
});
