/**
 * Security Headers Configuration
 *
 * This module provides comprehensive security headers for Next.js middleware
 * including environment-specific configurations and content-type specific headers.
 *
 * Security headers implemented:
 * - X-Frame-Options: Prevent clickjacking
 * - X-Content-Type-Options: Prevent MIME sniffing
 * - X-XSS-Protection: Enable XSS filter
 * - Referrer-Policy: Control referrer information
 * - Permissions-Policy: Control browser features
 * - Strict-Transport-Security: Force HTTPS
 * - X-DNS-Prefetch-Control: Control DNS prefetching
 * - X-Permitted-Cross-Domain-Policies: Control cross-domain access
 * - Content-Security-Policy: Comprehensive CSP (via csp.ts)
 */

import { generateCSPHeader, getCSPHeaderName, shouldApplyCSP, type CSPConfig } from './csp'

/**
 * Security header configuration
 */
export interface SecurityHeadersConfig {
  environment: 'development' | 'production' | 'test'
  csp?: CSPConfig
  hsts?: {
    maxAge?: number
    includeSubDomains?: boolean
    preload?: boolean
  }
  frameOptions?: 'DENY' | 'SAMEORIGIN'
  enableDNSPrefetch?: boolean
}

/**
 * Get base security headers that apply to all environments and routes
 */
function getBaseSecurityHeaders(): Record<string, string> {
  return {
    // Prevent browsers from MIME-sniffing the content-type
    'X-Content-Type-Options': 'nosniff',

    // Enable XSS protection in older browsers
    // Note: Modern browsers rely on CSP, but this provides defense in depth
    'X-XSS-Protection': '1; mode=block',

    // Control how much referrer information should be included with requests
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Prevent clients from accessing certain browser features and APIs
    'Permissions-Policy': [
      'camera=()', // Deny camera access
      'microphone=()', // Deny microphone access
      'geolocation=()', // Deny geolocation access
      'interest-cohort=()', // Deny FLoC tracking
      'payment=()', // Deny payment API
      'usb=()', // Deny USB access
      'magnetometer=()', // Deny magnetometer
      'gyroscope=()', // Deny gyroscope
      'accelerometer=()', // Deny accelerometer
      'ambient-light-sensor=()', // Deny ambient light sensor
    ].join(', '),

    // Control DNS prefetching
    'X-DNS-Prefetch-Control': 'on',

    // Prevent Adobe Flash and PDF from making cross-domain requests
    'X-Permitted-Cross-Domain-Policies': 'none',

    // Prevent the browser from loading the page in a frame/iframe
    // This helps prevent clickjacking attacks
    'X-Frame-Options': 'DENY',
  }
}

/**
 * Get HSTS (HTTP Strict Transport Security) header
 * Only applies in production with HTTPS
 *
 * @param config - HSTS configuration
 * @returns HSTS header value or null if not applicable
 */
function getHSTSHeader(config?: {
  maxAge?: number
  includeSubDomains?: boolean
  preload?: boolean
}): string | null {
  // Only apply HSTS in production
  if (process.env.NODE_ENV !== 'production') {
    return null
  }

  const maxAge = config?.maxAge ?? 31536000 // 1 year default
  const includeSubDomains = config?.includeSubDomains ?? true
  const preload = config?.preload ?? false

  let value = `max-age=${maxAge}`

  if (includeSubDomains) {
    value += '; includeSubDomains'
  }

  if (preload) {
    value += '; preload'
  }

  return value
}

/**
 * Get development-specific security headers
 * More relaxed for local development
 */
function getDevelopmentHeaders(): Record<string, string> {
  return {
    ...getBaseSecurityHeaders(),
    // Allow frames from same origin in development for debugging tools
    'X-Frame-Options': 'SAMEORIGIN',
  }
}

/**
 * Get production-specific security headers
 * Stricter security for production environment
 */
function getProductionHeaders(config?: SecurityHeadersConfig): Record<string, string> {
  const headers = {
    ...getBaseSecurityHeaders(),
  }

  // Add HSTS header for production
  const hstsHeader = getHSTSHeader(config?.hsts)
  if (hstsHeader) {
    headers['Strict-Transport-Security'] = hstsHeader
  }

  // Override frame options if specified
  if (config?.frameOptions) {
    headers['X-Frame-Options'] = config.frameOptions
  }

  return headers
}

/**
 * Get all security headers for the current environment
 *
 * @param config - Security headers configuration
 * @returns Object containing all security headers
 */
export function getSecurityHeaders(
  config: SecurityHeadersConfig
): Record<string, string> {
  let headers: Record<string, string>

  switch (config.environment) {
    case 'production':
      headers = getProductionHeaders(config)
      break
    case 'test':
      headers = getDevelopmentHeaders()
      break
    case 'development':
    default:
      headers = getDevelopmentHeaders()
      break
  }

  return headers
}

/**
 * Get CSP header for a specific request
 *
 * @param pathname - The request pathname
 * @param config - CSP configuration
 * @returns CSP header object or empty object if CSP should not be applied
 */
export function getCSPHeaders(
  pathname: string,
  config: CSPConfig
): Record<string, string> {
  if (!shouldApplyCSP(pathname)) {
    return {}
  }

  const cspValue = generateCSPHeader(config)
  const headerName = getCSPHeaderName(config.reportOnly)

  return {
    [headerName]: cspValue,
  }
}

/**
 * Apply security headers to a Response object
 *
 * @param response - The Response to modify
 * @param headers - Headers to apply
 * @returns The modified Response
 */
export function applySecurityHeaders(
  response: Response,
  headers: Record<string, string>
): Response {
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value)
  }
  return response
}

/**
 * Get content-type specific security headers
 * Different content types may need different security configurations
 */
export function getContentTypeHeaders(contentType: string): Record<string, string> {
  const headers: Record<string, string> = {}

  // For HTML content, ensure proper charset
  if (contentType.includes('text/html')) {
    headers['X-Content-Type-Options'] = 'nosniff'
  }

  // For downloadable content, add additional protection
  if (
    contentType.includes('application/octet-stream') ||
    contentType.includes('application/pdf')
  ) {
    headers['X-Content-Type-Options'] = 'nosniff'
    headers['X-Download-Options'] = 'noopen'
  }

  // For JSON API responses
  if (contentType.includes('application/json')) {
    headers['X-Content-Type-Options'] = 'nosniff'
    // Prevent JSON responses from being embedded in other sites
    headers['X-Frame-Options'] = 'DENY'
  }

  return headers
}

/**
 * Get route-specific security headers
 * Certain routes may need different security configurations
 *
 * @param pathname - The request pathname
 * @returns Additional headers for the route
 */
export function getRouteSpecificHeaders(pathname: string): Record<string, string> {
  const headers: Record<string, string> = {}

  // API routes
  if (pathname.startsWith('/api/')) {
    // Prevent API responses from being embedded
    headers['X-Frame-Options'] = 'DENY'

    // Add CORS headers if needed (customize based on your needs)
    if (pathname.startsWith('/api/public/')) {
      // Example: Allow public APIs to be accessed from other origins
      // headers['Access-Control-Allow-Origin'] = '*'
    }
  }

  // Admin routes - extra security
  if (pathname.startsWith('/admin/')) {
    headers['X-Frame-Options'] = 'DENY'
    headers['X-Robots-Tag'] = 'noindex, nofollow'
  }

  // Auth routes
  if (pathname.startsWith('/auth/') || pathname.includes('/login') || pathname.includes('/signup')) {
    headers['X-Frame-Options'] = 'DENY'
    headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, private'
  }

  // User profile and sensitive data routes
  if (pathname.startsWith('/user/') || pathname.startsWith('/profile/')) {
    headers['Cache-Control'] = 'no-store, private'
    headers['X-Frame-Options'] = 'DENY'
  }

  return headers
}

/**
 * Create a complete set of security headers for a request
 *
 * @param pathname - The request pathname
 * @param config - Security configuration
 * @returns Complete set of security headers
 */
export function createSecurityHeaders(
  pathname: string,
  config: SecurityHeadersConfig
): Record<string, string> {
  // Start with base security headers for the environment
  const headers = getSecurityHeaders(config)

  // Add CSP headers if configured
  if (config.csp) {
    const cspHeaders = getCSPHeaders(pathname, config.csp)
    Object.assign(headers, cspHeaders)
  }

  // Add route-specific headers
  const routeHeaders = getRouteSpecificHeaders(pathname)
  Object.assign(headers, routeHeaders)

  return headers
}

/**
 * Utility to check if a header should be applied based on environment
 *
 * @param headerName - The header to check
 * @param environment - Current environment
 * @returns Whether the header should be applied
 */
export function shouldApplyHeader(
  headerName: string,
  environment: string
): boolean {
  // HSTS should only be applied in production with HTTPS
  if (headerName === 'Strict-Transport-Security') {
    return environment === 'production'
  }

  // All other headers apply to all environments
  return true
}

/**
 * Validate security headers configuration
 *
 * @param config - Configuration to validate
 * @returns Whether the configuration is valid
 */
export function validateSecurityConfig(config: SecurityHeadersConfig): boolean {
  // Check environment
  if (!['development', 'production', 'test'].includes(config.environment)) {
    return false
  }

  // Check HSTS config if present
  if (config.hsts) {
    if (config.hsts.maxAge !== undefined && config.hsts.maxAge < 0) {
      return false
    }
  }

  return true
}

/**
 * Default security configuration for production
 */
export const PRODUCTION_SECURITY_CONFIG: SecurityHeadersConfig = {
  environment: 'production',
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: false, // Set to true only after testing
  },
  frameOptions: 'DENY',
  enableDNSPrefetch: true,
}

/**
 * Default security configuration for development
 */
export const DEVELOPMENT_SECURITY_CONFIG: SecurityHeadersConfig = {
  environment: 'development',
  frameOptions: 'SAMEORIGIN',
  enableDNSPrefetch: true,
}

/**
 * Get default security configuration based on NODE_ENV
 */
export function getDefaultSecurityConfig(): SecurityHeadersConfig {
  const env = process.env.NODE_ENV === 'production' ? 'production' : 'development'

  return env === 'production'
    ? PRODUCTION_SECURITY_CONFIG
    : DEVELOPMENT_SECURITY_CONFIG
}
