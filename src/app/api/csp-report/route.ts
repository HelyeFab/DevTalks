/**
 * CSP Violation Report Endpoint
 *
 * This endpoint receives Content Security Policy violation reports from browsers
 * and logs them for security monitoring and debugging.
 *
 * CSP violations can indicate:
 * - Attempted XSS attacks
 * - Misconfigured CSP policies
 * - Third-party scripts trying to load
 * - Development/debugging issues
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
 */

import { NextRequest, NextResponse } from 'next/server'
import { isValidCSPReport, formatViolationReport, type CSPViolationReport } from '@/lib/security'

/**
 * Rate limiting configuration
 * Prevents abuse of the reporting endpoint
 */
const RATE_LIMIT = {
  maxReports: 100, // Maximum reports per window
  windowMs: 60 * 1000, // 1 minute window
}

// Simple in-memory rate limiting
// In production, use Redis or a proper rate limiting service
const reportCounts = new Map<string, { count: number; resetTime: number }>()

/**
 * Check if a client has exceeded the rate limit
 */
function isRateLimited(clientId: string): boolean {
  const now = Date.now()
  const clientData = reportCounts.get(clientId)

  if (!clientData || now > clientData.resetTime) {
    // Reset or create new entry
    reportCounts.set(clientId, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs,
    })
    return false
  }

  if (clientData.count >= RATE_LIMIT.maxReports) {
    return true
  }

  clientData.count++
  return false
}

/**
 * Clean up old rate limit entries
 * Call this periodically to prevent memory leaks
 */
function cleanupRateLimitData() {
  const now = Date.now()
  for (const [clientId, data] of reportCounts.entries()) {
    if (now > data.resetTime) {
      reportCounts.delete(clientId)
    }
  }
}

/**
 * Get client identifier for rate limiting
 * Uses IP address or a combination of factors
 */
function getClientId(request: NextRequest): string {
  // Try to get IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'

  // Combine with user agent for better identification
  const userAgent = request.headers.get('user-agent') || 'unknown'

  return `${ip}-${userAgent.slice(0, 50)}`
}

/**
 * Log CSP violation for monitoring
 * In production, send to logging service (e.g., Sentry, DataDog)
 */
function logViolation(report: CSPViolationReport, metadata: {
  timestamp: string
  userAgent?: string
  ip?: string
}): void {
  const logEntry = {
    type: 'CSP_VIOLATION',
    timestamp: metadata.timestamp,
    userAgent: metadata.userAgent,
    ip: metadata.ip,
    violation: {
      documentUri: report['document-uri'],
      violatedDirective: report['violated-directive'],
      effectiveDirective: report['effective-directive'],
      blockedUri: report['blocked-uri'],
      sourceFile: report['source-file'],
      lineNumber: report['line-number'],
      columnNumber: report['column-number'],
      statusCode: report['status-code'],
      disposition: report.disposition,
    },
  }

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.warn('CSP Violation Report:', JSON.stringify(logEntry, null, 2))
  }

  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to Sentry, DataDog, or custom logging service
    // Sentry.captureMessage(formatViolationReport(report), 'warning')

    // For now, just log with a production marker
    console.warn('[PRODUCTION CSP VIOLATION]', formatViolationReport(report))

    // You could also store in a database or send to an external service
    // Example: await db.cspViolations.create({ data: logEntry })
  }
}

/**
 * Filter out known false positives or noisy violations
 */
function shouldIgnoreViolation(report: CSPViolationReport): boolean {
  const blockedUri = report['blocked-uri']

  // Ignore browser extensions
  if (blockedUri.startsWith('chrome-extension://') ||
      blockedUri.startsWith('moz-extension://') ||
      blockedUri.startsWith('safari-extension://')) {
    return true
  }

  // Ignore common browser injections
  const noisyDomains = [
    'localhost:3000/__nextjs', // Next.js dev tools
    'webpack-internal://', // Webpack internal
  ]

  if (noisyDomains.some(domain => blockedUri.includes(domain))) {
    return true
  }

  // Ignore violations from the reporting URI itself
  if (blockedUri.includes('/api/csp-report')) {
    return true
  }

  return false
}

/**
 * POST handler for CSP violation reports
 * Browsers send reports as JSON with Content-Type: application/csp-report
 */
export async function POST(request: NextRequest) {
  try {
    // Get client ID for rate limiting
    const clientId = getClientId(request)

    // Check rate limit
    if (isRateLimited(clientId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Parse the CSP report
    const contentType = request.headers.get('content-type') || ''
    let reportData: { 'csp-report': CSPViolationReport } | CSPViolationReport

    if (contentType.includes('application/csp-report')) {
      reportData = await request.json()
    } else if (contentType.includes('application/json')) {
      reportData = await request.json()
    } else {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      )
    }

    // Extract the actual report (might be nested in 'csp-report' key)
    const report = 'csp-report' in reportData ? reportData['csp-report'] : reportData

    // Validate the report structure
    if (!isValidCSPReport(report)) {
      return NextResponse.json(
        { error: 'Invalid CSP report format' },
        { status: 400 }
      )
    }

    // Filter out known false positives
    if (shouldIgnoreViolation(report)) {
      return NextResponse.json({ success: true, ignored: true }, { status: 200 })
    }

    // Get metadata for logging
    const metadata = {
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent') || undefined,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || undefined,
    }

    // Log the violation
    logViolation(report, metadata)

    // Clean up old rate limit data occasionally
    if (Math.random() < 0.01) { // 1% chance on each request
      cleanupRateLimitData()
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error processing CSP report:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS handler for CORS preflight
 * Some browsers send OPTIONS request before POST
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

/**
 * GET handler - returns information about CSP reporting
 * Useful for debugging and verification
 */
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    )
  }

  return NextResponse.json({
    endpoint: '/api/csp-report',
    method: 'POST',
    contentType: 'application/csp-report or application/json',
    rateLimit: RATE_LIMIT,
    description: 'Endpoint for receiving CSP violation reports from browsers',
    documentation: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP',
  })
}

/**
 * Runtime configuration
 * Use Node.js runtime for crypto support
 */
export const runtime = 'nodejs'

/**
 * Route segment config
 * Disable static optimization for this API route
 */
export const dynamic = 'force-dynamic'
