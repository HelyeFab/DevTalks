/**
 * Content Security Policy (CSP) Configuration
 *
 * This module provides comprehensive CSP management including:
 * - Directive building for different environments
 * - Nonce generation for inline scripts/styles
 * - Report-URI configuration for violation monitoring
 * - Environment-specific policies (dev vs production)
 */

/**
 * CSP Directive types
 */
export type CSPDirective = {
  'default-src'?: string[]
  'script-src'?: string[]
  'script-src-elem'?: string[]
  'script-src-attr'?: string[]
  'style-src'?: string[]
  'style-src-elem'?: string[]
  'style-src-attr'?: string[]
  'img-src'?: string[]
  'font-src'?: string[]
  'connect-src'?: string[]
  'media-src'?: string[]
  'object-src'?: string[]
  'frame-src'?: string[]
  'frame-ancestors'?: string[]
  'base-uri'?: string[]
  'form-action'?: string[]
  'worker-src'?: string[]
  'manifest-src'?: string[]
  'prefetch-src'?: string[]
  'child-src'?: string[]
  'navigate-to'?: string[]
  'report-uri'?: string[]
  'report-to'?: string[]
  'require-trusted-types-for'?: string[]
  'trusted-types'?: string[]
  'upgrade-insecure-requests'?: boolean
  'block-all-mixed-content'?: boolean
}

/**
 * Environment type for CSP configuration
 */
export type Environment = 'development' | 'production' | 'test'

/**
 * CSP Configuration options
 */
export interface CSPConfig {
  environment: Environment
  nonce?: string
  reportOnly?: boolean
  reportUri?: string
  enableReporting?: boolean
}

/**
 * Generate a cryptographically secure nonce for CSP
 * This nonce can be used for inline scripts and styles
 *
 * @returns A base64-encoded nonce string
 */
export function generateNonce(): string {
  // Use Web Crypto API which works in both Node.js and Edge runtime
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    return Buffer.from(array).toString('base64')
  }

  // Fallback to Node.js crypto (only available in Node.js runtime)
  try {
    const { randomBytes } = require('crypto')
    return randomBytes(16).toString('base64')
  } catch {
    // Last resort fallback (not recommended for production)
    console.warn('Using insecure random nonce generation. Please use a proper runtime.')
    const array = new Array(16).fill(0).map(() => Math.floor(Math.random() * 256))
    return Buffer.from(array).toString('base64')
  }
}

/**
 * Get base CSP directives that apply to all environments
 */
function getBaseDirectives(): CSPDirective {
  return {
    'default-src': ["'self'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'object-src': ["'none'"],
    'upgrade-insecure-requests': true,
  }
}

/**
 * Get Firebase-specific CSP directives
 * These allow the application to communicate with Firebase services
 */
function getFirebaseDirectives(): Partial<CSPDirective> {
  return {
    'connect-src': [
      "'self'",
      'https://*.googleapis.com',
      'https://*.firebaseio.com',
      'https://*.cloudfunctions.net',
      'https://*.firebase.googleapis.com',
      'https://firebaseinstallations.googleapis.com',
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      'https://region1.google-analytics.com',
      'wss://*.firebaseio.com',
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https://firebasestorage.googleapis.com',
      'https://*.googleusercontent.com',
      'https://lh3.googleusercontent.com',
    ],
  }
}

/**
 * Get development-specific CSP directives
 * More permissive to allow hot-reload and development tools
 */
function getDevelopmentDirectives(nonce?: string): CSPDirective {
  const scriptNonceDirective = nonce ? [`'nonce-${nonce}'`] : []

  return {
    ...getBaseDirectives(),
    ...getFirebaseDirectives(),
    'script-src': [
      "'self'",
      "'unsafe-eval'", // Required for Next.js dev mode
      "'unsafe-inline'", // Allowed in dev for convenience
      ...scriptNonceDirective,
      'https://www.google.com',
      'https://www.gstatic.com',
      'https://www.googletagmanager.com',
      'https://apis.google.com',
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Allowed in dev
      'https://fonts.googleapis.com',
    ],
    'style-src-attr': [
      "'unsafe-inline'",
    ],
    'font-src': [
      "'self'",
      'data:',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ],
    'frame-src': [
      "'self'",
      'https://www.google.com', // For reCAPTCHA
      'https://accounts.google.com', // For Google Sign-In
    ],
    'worker-src': [
      "'self'",
      'blob:',
    ],
    'manifest-src': ["'self'"],
  }
}

/**
 * Get production-specific CSP directives
 * Stricter policy for enhanced security
 */
function getProductionDirectives(nonce?: string): CSPDirective {
  const nonceDirective = nonce ? [`'nonce-${nonce}'`] : []

  return {
    ...getBaseDirectives(),
    ...getFirebaseDirectives(),
    'script-src': [
      "'self'",
      ...nonceDirective,
      'https://www.google.com',
      'https://www.gstatic.com',
      'https://www.googletagmanager.com',
      'https://apis.google.com',
      // Note: 'unsafe-eval' and 'unsafe-inline' are NOT included in production
      // All inline scripts should use nonce
    ],
    'script-src-elem': [
      "'self'",
      ...nonceDirective,
      'https://www.google.com',
      'https://www.gstatic.com',
      'https://www.googletagmanager.com',
      'https://apis.google.com',
    ],
    'style-src': [
      "'self'",
      ...nonceDirective,
      'https://fonts.googleapis.com',
      // Allow inline styles with nonce only
    ],
    'style-src-elem': [
      "'self'",
      ...nonceDirective,
      'https://fonts.googleapis.com',
    ],
    'style-src-attr': [
      "'unsafe-inline'", // Required for some React inline styles
    ],
    'font-src': [
      "'self'",
      'data:',
      'https://fonts.gstatic.com',
    ],
    'frame-src': [
      "'self'",
      'https://www.google.com',
      'https://accounts.google.com',
    ],
    'worker-src': [
      "'self'",
      'blob:',
    ],
    'manifest-src': ["'self'"],
    'media-src': ["'self'"],
    'block-all-mixed-content': true,
  }
}

/**
 * Build a CSP header string from directives
 *
 * @param directives - The CSP directives object
 * @returns A formatted CSP header string
 */
export function buildCSPHeader(directives: CSPDirective): string {
  const policies: string[] = []

  for (const [key, value] of Object.entries(directives)) {
    if (value === undefined || value === null) continue

    // Handle boolean directives
    if (typeof value === 'boolean') {
      if (value) {
        policies.push(key)
      }
      continue
    }

    // Handle array directives
    if (Array.isArray(value) && value.length > 0) {
      policies.push(`${key} ${value.join(' ')}`)
    }
  }

  return policies.join('; ')
}

/**
 * Get CSP directives based on environment and configuration
 *
 * @param config - CSP configuration options
 * @returns CSP directives for the specified environment
 */
export function getCSPDirectives(config: CSPConfig): CSPDirective {
  const { environment, nonce, reportUri, enableReporting } = config

  let directives: CSPDirective

  switch (environment) {
    case 'production':
      directives = getProductionDirectives(nonce)
      break
    case 'test':
      directives = getDevelopmentDirectives(nonce)
      break
    case 'development':
    default:
      directives = getDevelopmentDirectives(nonce)
      break
  }

  // Add reporting configuration if enabled
  if (enableReporting && reportUri) {
    directives['report-uri'] = [reportUri]
  }

  return directives
}

/**
 * Generate a complete CSP header for the current environment
 *
 * @param config - CSP configuration options
 * @returns A formatted CSP header string
 */
export function generateCSPHeader(config: CSPConfig): string {
  const directives = getCSPDirectives(config)
  return buildCSPHeader(directives)
}

/**
 * Get the CSP header name based on report-only mode
 *
 * @param reportOnly - Whether to use report-only mode
 * @returns The appropriate CSP header name
 */
export function getCSPHeaderName(reportOnly: boolean = false): string {
  return reportOnly
    ? 'Content-Security-Policy-Report-Only'
    : 'Content-Security-Policy'
}

/**
 * Create a CSP violation report parser
 * Parses and validates CSP violation reports from the browser
 */
export interface CSPViolationReport {
  'document-uri': string
  'violated-directive': string
  'effective-directive': string
  'original-policy': string
  'blocked-uri': string
  'status-code': number
  'source-file'?: string
  'line-number'?: number
  'column-number'?: number
  'script-sample'?: string
  disposition: 'enforce' | 'report'
}

/**
 * Validate a CSP violation report
 *
 * @param report - The report to validate
 * @returns Whether the report is valid
 */
export function isValidCSPReport(report: unknown): report is CSPViolationReport {
  if (typeof report !== 'object' || report === null) return false

  const r = report as Record<string, unknown>

  return (
    typeof r['document-uri'] === 'string' &&
    typeof r['violated-directive'] === 'string' &&
    typeof r['effective-directive'] === 'string' &&
    typeof r['blocked-uri'] === 'string' &&
    (r.disposition === 'enforce' || r.disposition === 'report')
  )
}

/**
 * Format a CSP violation report for logging
 *
 * @param report - The violation report
 * @returns A formatted log message
 */
export function formatViolationReport(report: CSPViolationReport): string {
  return `CSP Violation: ${report['violated-directive']} blocked ${report['blocked-uri']} on ${report['document-uri']}`
}

/**
 * Test if CSP should be enabled for a given path
 * Some paths might not need CSP (e.g., API routes that return JSON)
 *
 * @param pathname - The request pathname
 * @returns Whether CSP should be applied
 */
export function shouldApplyCSP(pathname: string): boolean {
  // Skip CSP for API routes that only return JSON
  if (pathname.startsWith('/api/') && !pathname.includes('/api/auth/')) {
    return false
  }

  // Skip for static files
  if (
    pathname.startsWith('/_next/static/') ||
    pathname.startsWith('/static/') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/)
  ) {
    return false
  }

  return true
}
