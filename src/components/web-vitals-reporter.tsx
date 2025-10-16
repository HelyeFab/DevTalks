'use client'

/**
 * Web Vitals Reporter Component
 * Initializes Web Vitals monitoring on the client side
 */

import { useEffect } from 'react'
import { initWebVitals, logBundleAnalysis } from '@/lib/performance'

export function WebVitalsReporter() {
  useEffect(() => {
    // Initialize Web Vitals monitoring
    initWebVitals()

    // Log bundle analysis in development
    if (process.env.NODE_ENV === 'development') {
      // Wait for the page to fully load before analyzing
      window.addEventListener('load', () => {
        setTimeout(() => {
          logBundleAnalysis()
        }, 1000)
      })
    }
  }, [])

  return null
}
