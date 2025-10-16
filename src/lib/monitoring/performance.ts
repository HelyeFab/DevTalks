/**
 * Performance monitoring utilities
 * Track and measure application performance
 */

import * as logger from '@/lib/logger';

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: string;
  context?: Record<string, unknown>;
}

/**
 * Performance tracker for measuring operation duration
 */
export class PerformanceTracker {
  private startTime: number;
  private name: string;
  private context?: Record<string, unknown>;

  constructor(name: string, context?: Record<string, unknown>) {
    this.name = name;
    this.context = context;
    this.startTime = performance.now();
  }

  /**
   * End tracking and log the result
   */
  end(): number {
    const duration = performance.now() - this.startTime;
    const metric: PerformanceMetric = {
      name: this.name,
      value: duration,
      unit: 'ms',
      timestamp: new Date().toISOString(),
      context: this.context,
    };

    logPerformanceMetric(metric);
    return duration;
  }

  /**
   * Add a checkpoint during the operation
   */
  checkpoint(label: string): void {
    const duration = performance.now() - this.startTime;
    logger.debug(`Checkpoint: ${this.name} - ${label}`, {
      duration,
      ...this.context,
    });
  }
}

/**
 * Track async operation performance
 */
export async function trackPerformance<T>(
  name: string,
  operation: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T> {
  const tracker = new PerformanceTracker(name, context);
  try {
    const result = await operation();
    tracker.end();
    return result;
  } catch (error) {
    tracker.end();
    throw error;
  }
}

/**
 * Track sync operation performance
 */
export function trackPerformanceSync<T>(
  name: string,
  operation: () => T,
  context?: Record<string, unknown>
): T {
  const tracker = new PerformanceTracker(name, context);
  try {
    const result = operation();
    tracker.end();
    return result;
  } catch (error) {
    tracker.end();
    throw error;
  }
}

/**
 * Log performance metric
 */
export function logPerformanceMetric(metric: PerformanceMetric): void {
  // Log slow operations as warnings
  if (metric.unit === 'ms' && metric.value > 1000) {
    logger.warn(`Slow operation: ${metric.name}`, {
      duration: metric.value,
      ...metric.context,
    });
  } else {
    logger.debug(`Performance: ${metric.name}`, {
      value: metric.value,
      unit: metric.unit,
      ...metric.context,
    });
  }

  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    sendMetricToMonitoring(metric);
  }
}

/**
 * Send metric to external monitoring service
 */
function sendMetricToMonitoring(metric: PerformanceMetric): void {
  // Placeholder for integration with monitoring services
  // Example: DataDog, New Relic, CloudWatch, etc.
  /*
  if (typeof window !== 'undefined' && window.datadog) {
    window.datadog.rum.addTiming(metric.name, metric.value);
  }
  */
}

/**
 * Measure database query performance
 */
export async function trackDatabaseQuery<T>(
  queryName: string,
  query: () => Promise<T>
): Promise<T> {
  return trackPerformance(`db:${queryName}`, query, { type: 'database' });
}

/**
 * Measure API call performance
 */
export async function trackApiCall<T>(
  endpoint: string,
  apiCall: () => Promise<T>
): Promise<T> {
  return trackPerformance(`api:${endpoint}`, apiCall, { type: 'api' });
}

/**
 * Measure component render performance (client-side)
 */
export function measureRenderTime(componentName: string): () => void {
  const startTime = performance.now();
  return () => {
    const duration = performance.now() - startTime;
    logPerformanceMetric({
      name: `render:${componentName}`,
      value: duration,
      unit: 'ms',
      timestamp: new Date().toISOString(),
      context: { type: 'render' },
    });
  };
}

/**
 * Get performance marks and measures
 */
export function getPerformanceMetrics(): {
  navigation?: PerformanceTiming;
  resources: PerformanceResourceTiming[];
  marks: PerformanceMark[];
  measures: PerformanceMeasure[];
} {
  if (typeof window === 'undefined' || !window.performance) {
    return {
      resources: [],
      marks: [],
      measures: [],
    };
  }

  return {
    navigation: window.performance.timing,
    resources: window.performance.getEntriesByType('resource') as PerformanceResourceTiming[],
    marks: window.performance.getEntriesByType('mark') as PerformanceMark[],
    measures: window.performance.getEntriesByType('measure') as PerformanceMeasure[],
  };
}

/**
 * Clear performance entries
 */
export function clearPerformanceMetrics(): void {
  if (typeof window !== 'undefined' && window.performance) {
    window.performance.clearMarks();
    window.performance.clearMeasures();
    window.performance.clearResourceTimings();
  }
}
