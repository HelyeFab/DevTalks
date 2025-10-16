/**
 * Web Vitals monitoring and reporting utilities
 * Tracks Core Web Vitals: LCP, FID, CLS, FCP, TTFB, INP
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals'

// Type definitions for Web Vitals metrics
export interface WebVitalsMetric {
  id: string
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  navigationType?: string
}

interface AnalyticsEvent {
  name: string
  value: number
  id: string
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  url: string
  userAgent: string
  timestamp: number
}

// Performance thresholds based on Web Vitals recommendations
// Note: FID has been deprecated in favor of INP as of 2024
export const VITALS_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
} as const

/**
 * Get rating for a metric based on thresholds
 */
function getRating(
  name: keyof typeof VITALS_THRESHOLDS,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = VITALS_THRESHOLDS[name]
  if (value <= thresholds.good) return 'good'
  if (value <= thresholds.poor) return 'needs-improvement'
  return 'poor'
}

/**
 * Send metric to analytics endpoint
 */
async function sendToAnalytics(metric: AnalyticsEvent) {
  const body = JSON.stringify(metric)

  // Use `navigator.sendBeacon()` if available, falling back to `fetch()`
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/vitals', body)
  } else {
    try {
      await fetch('/api/vitals', {
        body,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      })
    } catch (error) {
      // Silently fail - don't block user experience
      console.debug('Failed to send web vitals:', error)
    }
  }
}

/**
 * Report Web Vitals to analytics
 */
export function reportWebVitals(metric: WebVitalsMetric) {
  const url = window.location.href
  const userAgent = navigator.userAgent

  const event: AnalyticsEvent = {
    name: metric.name,
    value: metric.value,
    id: metric.id,
    rating: metric.rating,
    delta: metric.delta,
    url,
    userAgent,
    timestamp: Date.now(),
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
    })
  }

  // Send to analytics
  sendToAnalytics(event)
}

/**
 * Initialize Web Vitals monitoring
 * Call this in your app's root layout or _app file
 * Note: FID has been deprecated and replaced by INP as of 2024
 */
export function initWebVitals() {
  try {
    onCLS((metric) => {
      reportWebVitals({
        ...metric,
        rating: getRating('CLS', metric.value),
      })
    })

    onLCP((metric) => {
      reportWebVitals({
        ...metric,
        rating: getRating('LCP', metric.value),
      })
    })

    onFCP((metric) => {
      reportWebVitals({
        ...metric,
        rating: getRating('FCP', metric.value),
      })
    })

    onTTFB((metric) => {
      reportWebVitals({
        ...metric,
        rating: getRating('TTFB', metric.value),
      })
    })

    onINP((metric) => {
      reportWebVitals({
        ...metric,
        rating: getRating('INP', metric.value),
      })
    })
  } catch (error) {
    // Silently fail - don't block user experience
    console.error('Failed to initialize web vitals:', error)
  }
}

/**
 * Custom performance observer for monitoring specific resources
 */
export function observeResourceTiming(callback: (entries: PerformanceEntry[]) => void) {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return
  }

  try {
    const observer = new PerformanceObserver((list) => {
      callback(list.getEntries())
    })

    observer.observe({ entryTypes: ['resource', 'navigation', 'paint'] })

    return () => observer.disconnect()
  } catch (error) {
    console.error('Failed to observe resource timing:', error)
  }
}

/**
 * Get performance metrics summary
 */
export function getPerformanceMetrics() {
  if (typeof window === 'undefined' || !window.performance) {
    return null
  }

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
  const paint = performance.getEntriesByType('paint')

  return {
    // Navigation timing
    dns: navigation?.domainLookupEnd - navigation?.domainLookupStart,
    tcp: navigation?.connectEnd - navigation?.connectStart,
    ttfb: navigation?.responseStart - navigation?.requestStart,
    download: navigation?.responseEnd - navigation?.responseStart,
    domInteractive: navigation?.domInteractive,
    domComplete: navigation?.domComplete,

    // Paint timing
    fcp: paint.find((entry) => entry.name === 'first-contentful-paint')?.startTime || 0,

    // Resource timing
    resources: performance.getEntriesByType('resource').length,
  }
}
