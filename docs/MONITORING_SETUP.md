# Monitoring Setup Guide

This guide explains how to set up and configure monitoring for the DevTalks application.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Health Checks](#health-checks)
3. [Performance Monitoring](#performance-monitoring)
4. [Metrics Collection](#metrics-collection)
5. [User Analytics](#user-analytics)
6. [Alerting](#alerting)
7. [Dashboard Setup](#dashboard-setup)
8. [Production Checklist](#production-checklist)

## Quick Start

### 1. Initialize Client-Side Monitoring

Add to your root layout component:

```tsx
// src/app/layout.tsx
'use client';

import { useEffect } from 'react';
import { initializeClientErrorHandlers } from '@/lib/errors/client-init';
import { initializeTracking } from '@/lib/monitoring';

export default function RootLayout({ children }) {
  useEffect(() => {
    // Initialize error handlers
    initializeClientErrorHandlers();

    // Initialize user tracking
    initializeTracking();
  }, []);

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

### 2. Wrap API Routes with Monitoring

```typescript
// src/app/api/posts/route.ts
import { metricsMiddleware } from '@/lib/monitoring';
import { withErrorHandler } from '@/lib/errors';

export const GET = withErrorHandler(
  metricsMiddleware(async (request: Request) => {
    // Your handler code
    return NextResponse.json({ success: true });
  })
);
```

### 3. Add Error Boundaries to Components

```tsx
// src/app/page.tsx
import { ErrorBoundary } from '@/lib/errors/error-boundary';

export default function HomePage() {
  return (
    <ErrorBoundary>
      <MainContent />
    </ErrorBoundary>
  );
}
```

## Health Checks

### Endpoint Configuration

The health check endpoint is available at `/api/health`:

```bash
# Check application health
curl http://localhost:3000/api/health
```

### Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600,
  "checks": {
    "database": {
      "status": "up",
      "responseTime": 45
    },
    "memory": {
      "status": "up",
      "usage": {
        "heapUsed": 128,
        "heapTotal": 256,
        "rss": 512,
        "external": 8
      },
      "percentage": 50
    }
  }
}
```

### Setting Up Health Check Monitoring

#### Using UptimeRobot

1. Go to [UptimeRobot](https://uptimerobot.com)
2. Add a new monitor:
   - Type: HTTP(s)
   - URL: `https://your-domain.com/api/health`
   - Interval: 5 minutes
   - Alert contacts: Your email/Slack

#### Using AWS CloudWatch

```bash
# Create a CloudWatch alarm
aws cloudwatch put-metric-alarm \
  --alarm-name devtalks-health-check \
  --alarm-description "Alert when DevTalks health check fails" \
  --metric-name HealthCheckStatus \
  --namespace AWS/Route53 \
  --statistic Minimum \
  --period 60 \
  --threshold 1 \
  --comparison-operator LessThanThreshold \
  --evaluation-periods 2
```

#### Using Kubernetes (if deployed on K8s)

```yaml
# deployment.yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

## Performance Monitoring

### Track Database Queries

```typescript
import { trackDatabaseQuery } from '@/lib/monitoring';

async function fetchPosts() {
  return await trackDatabaseQuery('fetch_posts', async () => {
    return await db.collection('posts').get();
  });
}
```

### Track API Calls

```typescript
import { trackApiCall } from '@/lib/monitoring';

async function fetchUserData(userId: string) {
  return await trackApiCall(`/api/users/${userId}`, async () => {
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
  });
}
```

### Track Component Renders

```tsx
import { measureRenderTime } from '@/lib/monitoring';

function MyComponent() {
  useEffect(() => {
    const endMeasure = measureRenderTime('MyComponent');
    return () => {
      endMeasure();
    };
  }, []);

  return <div>Content</div>;
}
```

### Performance Thresholds

Configure alerts for slow operations:

```typescript
// In your monitoring config
const PERFORMANCE_THRESHOLDS = {
  database: {
    slow: 500,      // 500ms
    critical: 1000, // 1 second
  },
  api: {
    slow: 1000,     // 1 second
    critical: 3000, // 3 seconds
  },
  render: {
    slow: 100,      // 100ms
    critical: 500,  // 500ms
  },
};
```

## Metrics Collection

### Built-in Metrics

The application automatically tracks:

- API request count
- API error count
- API response time
- Database query count
- Database error count
- User login/logout
- Post creation/views
- Comment creation
- Cache hits/misses

### Custom Metrics

Add custom metrics:

```typescript
import { metrics } from '@/lib/monitoring';

// Gauge metric (current value)
metrics.gauge('active_users', 42, { region: 'us-east' });

// Counter metric
metrics.increment('button_clicks', 1, { button: 'subscribe' });

// Histogram metric (for distributions)
metrics.histogram('page_load_time', 1234, { page: 'home' });
```

### View Current Metrics

```typescript
import { metrics } from '@/lib/monitoring';

// Get all metrics
const allMetrics = metrics.getAll();
console.log(allMetrics);

// Get specific metric
const value = metrics.get('api.requests');
console.log(value);
```

## User Analytics

### Track User Actions

```typescript
import { UserActions } from '@/lib/monitoring';

// Track login
UserActions.login(userId, 'email');

// Track post view
UserActions.viewPost(userId, postId);

// Track search
UserActions.search(userId, 'react hooks', 10);
```

### Track Page Views

```typescript
import { trackPageView } from '@/lib/monitoring';

// Track current page
trackPageView();

// Track specific page
trackPageView('/blog/my-post');
```

### Session Tracking

```typescript
import { SessionTracker } from '@/lib/monitoring';

// Start session
const session = new SessionTracker(userId);

// Track actions in session
session.trackAction('view_post', { postId: '123' });
session.trackAction('create_comment', { commentId: '456' });

// End session (on logout or page unload)
session.end();
```

### Analytics Data Flow

```
User Action
    ↓
trackUserAction()
    ↓
logUserAction() → Console/File (dev)
    ↓
sendToAnalytics() → Google Analytics/Mixpanel (prod)
```

## Alerting

### Error Rate Alerts

Set up alerts for high error rates:

```typescript
// Example: Alert when error rate > 5% in 5 minutes
const errorRate = (errors / requests) * 100;
if (errorRate > 5) {
  sendAlert('High error rate detected', {
    rate: errorRate,
    errors,
    requests,
  });
}
```

### Performance Alerts

Set up alerts for slow responses:

```typescript
// Example: Alert when average response time > 2 seconds
const avgResponseTime = totalTime / requestCount;
if (avgResponseTime > 2000) {
  sendAlert('Slow API responses detected', {
    avgResponseTime,
    requestCount,
  });
}
```

### Resource Alerts

Set up alerts for resource exhaustion:

```typescript
// Example: Alert when memory usage > 90%
const memoryUsage = (heapUsed / heapTotal) * 100;
if (memoryUsage > 90) {
  sendAlert('High memory usage detected', {
    usage: memoryUsage,
    heapUsed,
    heapTotal,
  });
}
```

### Alert Channels

Configure multiple alert channels:

```typescript
// Email alerts
function sendEmailAlert(subject: string, body: string) {
  // Send email via your email service
}

// Slack alerts
function sendSlackAlert(channel: string, message: string) {
  // Send to Slack webhook
}

// PagerDuty alerts
function sendPagerDutyAlert(severity: string, description: string) {
  // Send to PagerDuty
}
```

## Dashboard Setup

### Grafana Dashboard

Example Grafana dashboard configuration:

```json
{
  "dashboard": {
    "title": "DevTalks Monitoring",
    "panels": [
      {
        "title": "API Request Rate",
        "targets": [
          {
            "expr": "rate(api_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(api_errors_total[5m]) / rate(api_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Response Time (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, api_duration_seconds_bucket)"
          }
        ]
      },
      {
        "title": "Active Users",
        "targets": [
          {
            "expr": "active_users"
          }
        ]
      }
    ]
  }
}
```

### Key Metrics to Monitor

1. **Availability Metrics**
   - Uptime percentage
   - Health check status
   - Service availability

2. **Performance Metrics**
   - Average response time
   - P95/P99 response time
   - Database query time
   - Cache hit rate

3. **Error Metrics**
   - Error rate
   - Error types
   - Failed requests
   - Exception count

4. **Business Metrics**
   - Active users
   - User signups
   - Post creation rate
   - Engagement metrics

5. **Resource Metrics**
   - CPU usage
   - Memory usage
   - Disk usage
   - Network traffic

## Production Checklist

### Before Deploying

- [ ] Set up external error tracking (Sentry)
- [ ] Configure performance monitoring (DataDog/New Relic)
- [ ] Set up analytics (Google Analytics/Mixpanel)
- [ ] Configure health check monitoring (UptimeRobot)
- [ ] Set up alerting (PagerDuty/OpsGenie)
- [ ] Create monitoring dashboard (Grafana/DataDog)
- [ ] Test error scenarios
- [ ] Test performance under load
- [ ] Document incident response procedures

### Environment Variables

Set these environment variables in production:

```bash
# Error tracking
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
SENTRY_AUTH_TOKEN=your-sentry-token

# Analytics
NEXT_PUBLIC_GA_ID=your-google-analytics-id

# Monitoring
DATADOG_API_KEY=your-datadog-api-key
DATADOG_APP_KEY=your-datadog-app-key

# Alerting
SLACK_WEBHOOK_URL=your-slack-webhook
PAGERDUTY_API_KEY=your-pagerduty-key
```

### Monitoring Schedule

Set up regular monitoring tasks:

1. **Daily**
   - Check error rates
   - Review slow queries
   - Check resource usage

2. **Weekly**
   - Review performance trends
   - Analyze user behavior
   - Check for memory leaks

3. **Monthly**
   - Review SLA compliance
   - Analyze cost trends
   - Plan capacity increases

### Incident Response

When an alert is triggered:

1. **Acknowledge** the alert immediately
2. **Investigate** using logs and metrics
3. **Diagnose** the root cause
4. **Fix** the issue
5. **Verify** the fix
6. **Document** the incident
7. **Postmortem** to prevent recurrence

### Testing Monitoring

Test your monitoring setup:

```bash
# Test health check
curl https://your-domain.com/api/health

# Test status endpoint
curl https://your-domain.com/api/status

# Trigger an error (in staging)
curl -X POST https://staging.your-domain.com/api/test-error

# Check memory usage
curl https://your-domain.com/api/health | jq '.checks.memory'
```

## Advanced Configuration

### Custom Monitoring Service

Create a custom monitoring service:

```typescript
// src/lib/monitoring/custom-service.ts
export class CustomMonitoringService {
  async sendMetric(name: string, value: number, tags?: Record<string, string>) {
    // Send to your monitoring backend
    await fetch('https://your-monitoring-service.com/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, value, tags, timestamp: Date.now() }),
    });
  }

  async sendEvent(event: string, metadata?: Record<string, unknown>) {
    // Send to your event tracking backend
    await fetch('https://your-monitoring-service.com/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, metadata, timestamp: Date.now() }),
    });
  }
}
```

### Performance Budget

Set up performance budgets:

```typescript
// src/lib/monitoring/performance-budget.ts
export const PERFORMANCE_BUDGET = {
  // Page load time
  firstContentfulPaint: 1000,   // 1 second
  largestContentfulPaint: 2500,  // 2.5 seconds
  timeToInteractive: 3500,       // 3.5 seconds

  // API response time
  apiResponseTime: 500,          // 500ms

  // Database query time
  dbQueryTime: 100,              // 100ms

  // Bundle size
  jsBundle: 200 * 1024,          // 200KB
  cssBundle: 50 * 1024,          // 50KB
  imageSize: 100 * 1024,         // 100KB per image
};

export function checkPerformanceBudget(metric: string, value: number): boolean {
  const budget = PERFORMANCE_BUDGET[metric];
  if (budget && value > budget) {
    console.warn(`Performance budget exceeded for ${metric}: ${value}ms > ${budget}ms`);
    return false;
  }
  return true;
}
```

## Resources

- [Application Performance Monitoring Best Practices](https://www.datadoghq.com/blog/apm-best-practices/)
- [Web Performance Metrics](https://web.dev/metrics/)
- [Error Monitoring with Sentry](https://docs.sentry.io/)
- [DataDog APM](https://docs.datadoghq.com/tracing/)
- [Google Analytics](https://developers.google.com/analytics)

## Support

For monitoring setup questions or issues:

1. Check the logs in `/api/health` and `/api/status`
2. Review the metrics dashboard
3. Check alert history
4. Review incident documentation
5. Contact the DevOps team

---

Last updated: 2024-01-01
