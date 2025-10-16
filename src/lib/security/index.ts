/**
 * Security Module - Main Entry Point
 *
 * This module exports all security-related functionality for the DevTalks application.
 * It provides a unified interface for:
 * - Content Security Policy (CSP) management
 * - Security headers configuration
 * - Nonce generation for inline scripts
 * - Security monitoring and reporting
 *
 * @module security
 */

// Import for internal use
import {
  createSecurityHeaders as _createSecurityHeaders,
  type SecurityHeadersConfig,
} from './headers'

// Export CSP functionality
export {
  generateNonce,
  generateCSPHeader,
  getCSPDirectives,
  getCSPHeaderName,
  buildCSPHeader,
  shouldApplyCSP,
  isValidCSPReport,
  formatViolationReport,
  type CSPDirective,
  type CSPConfig,
  type CSPViolationReport,
  type Environment,
} from './csp'

// Export security headers functionality
export {
  getSecurityHeaders,
  getCSPHeaders,
  applySecurityHeaders,
  createSecurityHeaders,
  getContentTypeHeaders,
  getRouteSpecificHeaders,
  shouldApplyHeader,
  validateSecurityConfig,
  getDefaultSecurityConfig,
  PRODUCTION_SECURITY_CONFIG,
  DEVELOPMENT_SECURITY_CONFIG,
  type SecurityHeadersConfig,
} from './headers'

/**
 * Quick start function to get all security headers for a request
 * This is the main function to use in middleware
 *
 * @param pathname - The request pathname
 * @param options - Optional configuration
 * @returns Complete set of security headers
 */
export function getRequestSecurityHeaders(
  pathname: string,
  options?: {
    nonce?: string
    reportOnly?: boolean
    environment?: 'development' | 'production' | 'test'
  }
): Record<string, string> {
  const environment = options?.environment ?? (process.env.NODE_ENV === 'production' ? 'production' : 'development')

  const config: SecurityHeadersConfig = {
    environment,
    csp: {
      environment,
      nonce: options?.nonce,
      reportOnly: options?.reportOnly ?? false,
      reportUri: '/api/csp-report',
      enableReporting: environment === 'production',
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: false,
    },
    frameOptions: 'DENY' as const,
    enableDNSPrefetch: true,
  }

  // Use the imported function
  return _createSecurityHeaders(pathname, config)
}

/**
 * Security utilities for common tasks
 */
export const SecurityUtils = {
  /**
   * Check if a request is from a trusted origin
   */
  isTrustedOrigin(origin: string): boolean {
    const trustedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ].filter(Boolean)

    return trustedOrigins.some((trusted) => origin.startsWith(trusted as string))
  },

  /**
   * Sanitize a URL to prevent open redirects
   */
  sanitizeRedirectUrl(url: string, baseUrl: string): string {
    try {
      const parsedUrl = new URL(url, baseUrl)
      const parsedBase = new URL(baseUrl)

      // Only allow redirects to the same origin
      if (parsedUrl.origin !== parsedBase.origin) {
        return '/'
      }

      return parsedUrl.pathname + parsedUrl.search + parsedUrl.hash
    } catch {
      // If URL parsing fails, return safe default
      return '/'
    }
  },

  /**
   * Generate a secure token for CSRF protection
   */
  generateSecureToken(): string {
    // In a browser environment, use crypto.randomUUID()
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID()
    }

    // In Node.js environment, use randomBytes
    try {
      const { randomBytes } = require('crypto')
      return randomBytes(32).toString('hex')
    } catch {
      // Fallback (not cryptographically secure, should not be used in production)
      return Math.random().toString(36).substring(2) + Date.now().toString(36)
    }
  },

  /**
   * Check if a request has a valid content type
   */
  isValidContentType(contentType: string | null, allowed: string[]): boolean {
    if (!contentType) return false
    return allowed.some((type) => contentType.includes(type))
  },
}

/**
 * Security constants
 */
export const SecurityConstants = {
  // Maximum age for HSTS header (1 year)
  HSTS_MAX_AGE: 31536000,

  // Nonce length in bytes
  NONCE_LENGTH: 16,

  // CSP report rate limit (per minute)
  CSP_REPORT_RATE_LIMIT: 60,

  // Allowed content types for API requests
  ALLOWED_API_CONTENT_TYPES: [
    'application/json',
    'application/x-www-form-urlencoded',
    'multipart/form-data',
  ],

  // Trusted domains for CSP
  TRUSTED_DOMAINS: {
    firebase: [
      'https://*.googleapis.com',
      'https://*.firebaseio.com',
      'https://*.cloudfunctions.net',
    ],
    google: [
      'https://www.google.com',
      'https://www.gstatic.com',
      'https://apis.google.com',
      'https://accounts.google.com',
    ],
    fonts: [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ],
  },
} as const

/**
 * Development utilities (should not be used in production)
 */
export const DevSecurityUtils = {
  /**
   * Log security headers for debugging
   */
  logSecurityHeaders(headers: Record<string, string>): void {
    if (process.env.NODE_ENV === 'development') {
      console.log('Security Headers:')
      Object.entries(headers).forEach(([key, value]) => {
        console.log(`  ${key}: ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`)
      })
    }
  },

  /**
   * Generate a report of current security configuration
   */
  getSecurityReport(): {
    environment: string
    hstsEnabled: boolean
    cspEnabled: boolean
    secureHeaders: string[]
  } {
    return {
      environment: process.env.NODE_ENV || 'development',
      hstsEnabled: process.env.NODE_ENV === 'production',
      cspEnabled: true,
      secureHeaders: [
        'X-Frame-Options',
        'X-Content-Type-Options',
        'X-XSS-Protection',
        'Referrer-Policy',
        'Permissions-Policy',
        'Content-Security-Policy',
      ],
    }
  },
}

/**
 * Type guard to check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Type guard to check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}
