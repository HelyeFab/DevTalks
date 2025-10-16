'use client';

/**
 * Client-side error handler initialization
 * Sets up global error handlers for the browser
 */

import { handleUncaughtError, handleUnhandledRejection } from './error-logger';

let isInitialized = false;

/**
 * Initialize client-side error handlers
 * Call this once in your root layout or app component
 */
export function initializeClientErrorHandlers(): void {
  // Only initialize once
  if (isInitialized || typeof window === 'undefined') {
    return;
  }

  isInitialized = true;

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    handleUncaughtError(event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      clientSide: true,
    });
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    handleUnhandledRejection(event.reason, {
      clientSide: true,
    });
  });

  console.log('[DevTalks] Client error handlers initialized');
}

/**
 * Cleanup error handlers
 * Useful for testing or hot module replacement
 */
export function cleanupClientErrorHandlers(): void {
  if (typeof window === 'undefined') {
    return;
  }

  isInitialized = false;
  // Note: We don't actually remove listeners as they're needed throughout the app lifecycle
  console.log('[DevTalks] Client error handlers cleaned up');
}
