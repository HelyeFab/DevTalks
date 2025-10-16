/**
 * Application metrics collection
 * Track business and technical metrics
 */

import * as logger from '@/lib/logger';

export interface Metric {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp: string;
}

/**
 * Metrics collector (singleton)
 */
class MetricsCollector {
  private metrics: Map<string, number> = new Map();
  private counters: Map<string, number> = new Map();

  /**
   * Record a gauge metric (point-in-time value)
   */
  gauge(name: string, value: number, tags?: Record<string, string>): void {
    const metric: Metric = {
      name,
      value,
      tags,
      timestamp: new Date().toISOString(),
    };

    this.metrics.set(name, value);
    this.sendMetric(metric);
  }

  /**
   * Increment a counter metric
   */
  increment(name: string, value: number = 1, tags?: Record<string, string>): void {
    const currentValue = this.counters.get(name) || 0;
    const newValue = currentValue + value;
    this.counters.set(name, newValue);

    const metric: Metric = {
      name,
      value: newValue,
      tags,
      timestamp: new Date().toISOString(),
    };

    this.sendMetric(metric);
  }

  /**
   * Decrement a counter metric
   */
  decrement(name: string, value: number = 1, tags?: Record<string, string>): void {
    this.increment(name, -value, tags);
  }

  /**
   * Record a histogram metric (for distributions)
   */
  histogram(name: string, value: number, tags?: Record<string, string>): void {
    const metric: Metric = {
      name,
      value,
      tags,
      timestamp: new Date().toISOString(),
    };

    this.sendMetric(metric);
  }

  /**
   * Get current value of a metric
   */
  get(name: string): number | undefined {
    return this.metrics.get(name) || this.counters.get(name);
  }

  /**
   * Get all metrics
   */
  getAll(): Map<string, number> {
    const allMetrics = new Map<string, number>();
    this.metrics.forEach((value, key) => allMetrics.set(key, value));
    this.counters.forEach((value, key) => allMetrics.set(key, value));
    return allMetrics;
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear();
    this.counters.clear();
  }

  /**
   * Send metric to external service
   */
  private sendMetric(metric: Metric): void {
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`Metric: ${metric.name}`, {
        value: metric.value,
        tags: metric.tags,
      });
    }

    // Send to external monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(metric);
    }
  }

  /**
   * Placeholder for external monitoring service integration
   */
  private sendToMonitoringService(metric: Metric): void {
    // Example integrations:
    // - DataDog: datadog.statsd.gauge(metric.name, metric.value, metric.tags);
    // - CloudWatch: cloudwatch.putMetricData({ ... });
    // - Prometheus: prometheusRegistry.gauge(metric.name).set(metric.value);
  }
}

// Singleton instance
export const metrics = new MetricsCollector();

/**
 * Common application metrics
 */
export const AppMetrics = {
  // API metrics
  apiRequest: (endpoint: string, method: string) =>
    metrics.increment('api.requests', 1, { endpoint, method }),

  apiError: (endpoint: string, statusCode: number) =>
    metrics.increment('api.errors', 1, { endpoint, statusCode: String(statusCode) }),

  apiDuration: (endpoint: string, duration: number) =>
    metrics.histogram('api.duration', duration, { endpoint }),

  // Database metrics
  dbQuery: (collection: string, operation: string) =>
    metrics.increment('db.queries', 1, { collection, operation }),

  dbError: (collection: string, operation: string) =>
    metrics.increment('db.errors', 1, { collection, operation }),

  dbDuration: (collection: string, duration: number) =>
    metrics.histogram('db.duration', duration, { collection }),

  // User metrics
  userLogin: () => metrics.increment('users.login', 1),

  userLogout: () => metrics.increment('users.logout', 1),

  userSignup: () => metrics.increment('users.signup', 1),

  // Content metrics
  postCreated: () => metrics.increment('posts.created', 1),

  postViewed: (postId: string) =>
    metrics.increment('posts.views', 1, { postId }),

  commentCreated: () => metrics.increment('comments.created', 1),

  // Error metrics
  errorOccurred: (errorType: string, severity: string) =>
    metrics.increment('errors.total', 1, { errorType, severity }),

  // Cache metrics
  cacheHit: (cacheKey: string) =>
    metrics.increment('cache.hits', 1, { key: cacheKey }),

  cacheMiss: (cacheKey: string) =>
    metrics.increment('cache.misses', 1, { key: cacheKey }),

  // Performance metrics
  pageLoad: (page: string, duration: number) =>
    metrics.histogram('page.load', duration, { page }),

  componentRender: (component: string, duration: number) =>
    metrics.histogram('component.render', duration, { component }),
};

/**
 * Metrics middleware for API routes
 */
export function metricsMiddleware(
  handler: (req: Request) => Promise<Response>
) {
  return async (req: Request): Promise<Response> => {
    const startTime = Date.now();
    const url = new URL(req.url);
    const endpoint = url.pathname;
    const method = req.method;

    try {
      // Track request
      AppMetrics.apiRequest(endpoint, method);

      // Execute handler
      const response = await handler(req);

      // Track duration
      const duration = Date.now() - startTime;
      AppMetrics.apiDuration(endpoint, duration);

      // Track errors
      if (response.status >= 400) {
        AppMetrics.apiError(endpoint, response.status);
      }

      return response;
    } catch (error) {
      // Track duration even on error
      const duration = Date.now() - startTime;
      AppMetrics.apiDuration(endpoint, duration);

      // Track error
      AppMetrics.apiError(endpoint, 500);

      throw error;
    }
  };
}
