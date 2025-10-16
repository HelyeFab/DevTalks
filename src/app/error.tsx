'use client';

/**
 * Global error page for Next.js application
 * Catches and displays errors that occur during rendering
 */

import { useEffect } from 'react';
import { logClientError } from '@/lib/errors';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error
    logClientError(error, undefined, {
      digest: error.digest,
      page: 'global-error',
    });
  }, [error]);

  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6">
          <div className="flex items-center space-x-3">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Something Went Wrong
              </h1>
              <p className="text-red-100 mt-1">
                We encountered an unexpected error
              </p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            We apologize for the inconvenience. Our team has been notified and is
            working to resolve the issue.
          </p>

          {isDev && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
                Development Info
              </h3>
              <p className="text-sm font-mono text-red-700 dark:text-red-300 break-all mb-2">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  Error Digest: {error.digest}
                </p>
              )}
              {error.stack && (
                <details className="mt-3">
                  <summary className="text-sm font-medium text-red-800 dark:text-red-200 cursor-pointer hover:underline">
                    View Stack Trace
                  </summary>
                  <pre className="mt-2 text-xs text-red-700 dark:text-red-300 overflow-auto max-h-60 p-2 bg-red-100 dark:bg-red-900/30 rounded">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
              What you can do:
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
              <li>Try refreshing the page</li>
              <li>Go back to the previous page</li>
              <li>Return to the home page</li>
              <li>Contact support if the problem persists</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={reset}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Try Again
            </button>
            <button
              onClick={() => window.history.back()}
              className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Go Back
            </button>
            <a
              href="/"
              className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 font-semibold py-3 px-6 rounded-lg transition-colors text-center"
            >
              Home
            </a>
          </div>

          {error.digest && (
            <p className="mt-6 text-xs text-gray-500 dark:text-gray-400 text-center">
              Reference ID: {error.digest}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
