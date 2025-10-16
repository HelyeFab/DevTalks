# Security Headers - Quick Start Guide

## Overview

This guide provides quick instructions for working with the enhanced security headers system in DevTalks.

## Files Structure

```
src/
├── lib/security/
│   ├── csp.ts              # CSP configuration
│   ├── headers.ts          # Security headers
│   └── index.ts            # Main exports
├── middleware.ts           # Applies security headers
└── app/api/csp-report/
    └── route.ts           # CSP violation reports

docs/security/
├── SECURITY_HEADERS.md     # Full documentation
└── QUICK_START.md          # This file
```

## Quick Usage

### 1. Basic Usage (Already Configured)

The security headers are automatically applied by the middleware. No additional configuration needed for basic usage.

### 2. Test Your Security Headers

```bash
# Check headers locally
curl -I http://localhost:3000

# Look for security headers
curl -I http://localhost:3000 | grep -E "(X-Frame-Options|Content-Security-Policy)"
```

### 3. View CSP Violations

In development, CSP violations are logged to the console:
- Open browser DevTools
- Check Console for CSP warnings
- Violations are also sent to `/api/csp-report`

### 4. Testing CSP Changes

To test CSP without blocking resources:

```typescript
// In src/middleware.ts, change:
const securityHeaders = getRequestSecurityHeaders(pathname, {
  nonce,
  environment: environment as 'development' | 'production',
  reportOnly: true, // Set to true for testing
})
```

## Common Tasks

### Add a New Allowed Domain

If you need to allow a new external service:

1. Edit `/src/lib/security/csp.ts`
2. Find `getProductionDirectives()` or `getDevelopmentDirectives()`
3. Add the domain to appropriate directive:

```typescript
// Example: Allow analytics from example.com
'script-src': [
  "'self'",
  ...nonceDirective,
  'https://example.com', // Add here
  // ... rest
],
```

### Add Custom Headers for a Route

Edit `/src/lib/security/headers.ts`:

```typescript
export function getRouteSpecificHeaders(pathname: string): Record<string, string> {
  const headers: Record<string, string> = {}

  // Your custom route
  if (pathname.startsWith('/your-route/')) {
    headers['Your-Custom-Header'] = 'value'
  }

  return headers
}
```

### Disable CSP for Specific Routes

Edit `/src/lib/security/csp.ts`:

```typescript
export function shouldApplyCSP(pathname: string): boolean {
  // Skip CSP for your route
  if (pathname.startsWith('/your-route/')) {
    return false
  }

  // ... rest of function
}
```

## Environment Differences

### Development
- More permissive CSP (includes `'unsafe-eval'`, `'unsafe-inline'`)
- No HSTS (requires HTTPS)
- X-Frame-Options: SAMEORIGIN (for dev tools)
- Console logging of violations

### Production
- Strict CSP (nonce-based only)
- HSTS enabled (max-age: 1 year)
- X-Frame-Options: DENY
- Structured logging of violations
- CSP reporting enabled

## Security Headers Applied

| Header | Value | Environment |
|--------|-------|-------------|
| X-Frame-Options | DENY (SAMEORIGIN in dev) | All |
| X-Content-Type-Options | nosniff | All |
| X-XSS-Protection | 1; mode=block | All |
| Referrer-Policy | strict-origin-when-cross-origin | All |
| Permissions-Policy | Restrictive | All |
| Strict-Transport-Security | 1 year, includeSubDomains | Production |
| Content-Security-Policy | Environment-specific | All |
| X-DNS-Prefetch-Control | on | All |
| X-Permitted-Cross-Domain-Policies | none | All |

## Troubleshooting

### Issue: Resources Not Loading

**Symptom**: Images, fonts, or scripts fail to load

**Solution**:
1. Check browser console for CSP violations
2. Add the blocked domain to CSP configuration
3. Test with `reportOnly: true` first

### Issue: Google Sign-In Broken

**Symptom**: Google OAuth popup blocked

**Solution**: Verify these domains are in CSP:
- `frame-src`: `https://www.google.com`, `https://accounts.google.com`
- `script-src`: `https://www.google.com`, `https://www.gstatic.com`

### Issue: Firebase Not Working

**Symptom**: Firebase API calls fail

**Solution**: Check CSP includes:
```typescript
'connect-src': [
  'https://*.googleapis.com',
  'https://*.firebaseio.com',
  'https://*.cloudfunctions.net',
  'wss://*.firebaseio.com',
]
```

### Issue: HSTS Not Applied

**Symptom**: Strict-Transport-Security header missing

**Reason**: HSTS only applies in production with HTTPS
- Not applied in development
- Requires `NODE_ENV=production`

## Monitoring CSP Violations

### View Reports (Development)

```bash
# Terminal running dev server will show:
CSP Violation Report: {
  "type": "CSP_VIOLATION",
  "violation": {
    "documentUri": "...",
    "blockedUri": "...",
    ...
  }
}
```

### Production Monitoring

Integrate with your monitoring service:

Edit `/src/app/api/csp-report/route.ts`:

```typescript
// Add your monitoring service
import * as Sentry from '@sentry/nextjs'

function logViolation(report: CSPViolationReport, metadata: any): void {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureMessage(formatViolationReport(report), {
      level: 'warning',
      extra: { report, metadata },
    })
  }
}
```

## Testing Checklist

Before deploying security changes:

- [ ] Test in development with `reportOnly: false`
- [ ] Check all pages load correctly
- [ ] Verify Firebase operations work
- [ ] Test Google Sign-In
- [ ] Check image uploads work
- [ ] Verify third-party integrations
- [ ] Enable `reportOnly: true` in production first
- [ ] Monitor violations for 24-48 hours
- [ ] Switch to enforcement mode

## External Resources

### Testing Tools
- [Mozilla Observatory](https://observatory.mozilla.org/)
- [Security Headers](https://securityheaders.com/)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)

### Documentation
- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [OWASP Secure Headers](https://owasp.org/www-project-secure-headers/)
- Full docs: [SECURITY_HEADERS.md](./SECURITY_HEADERS.md)

## Support

For detailed information, see [SECURITY_HEADERS.md](./SECURITY_HEADERS.md).

For security issues, contact the development team privately.

---

*Last Updated: 2025-10-16*
