# Security Headers Documentation

## Overview

This document provides comprehensive information about the security headers implementation in the DevTalks Next.js application. The security configuration includes Content Security Policy (CSP), HTTP security headers, and violation reporting mechanisms.

## Table of Contents

- [Security Headers Overview](#security-headers-overview)
- [Content Security Policy (CSP)](#content-security-policy-csp)
- [Implementation Details](#implementation-details)
- [Configuration](#configuration)
- [Monitoring and Reporting](#monitoring-and-reporting)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Security Headers Overview

### Implemented Headers

#### 1. **X-Frame-Options: DENY**
- **Purpose**: Prevents clickjacking attacks by disallowing the page to be displayed in frames/iframes
- **Environment**: All environments
- **Value**: `DENY` (SAMEORIGIN in development for debugging tools)

#### 2. **X-Content-Type-Options: nosniff**
- **Purpose**: Prevents MIME-sniffing, forcing browsers to respect declared content types
- **Environment**: All environments
- **Value**: `nosniff`

#### 3. **X-XSS-Protection: 1; mode=block**
- **Purpose**: Enables XSS filter in older browsers (defense in depth)
- **Environment**: All environments
- **Value**: `1; mode=block`
- **Note**: Modern browsers rely on CSP, but this provides backwards compatibility

#### 4. **Referrer-Policy: strict-origin-when-cross-origin**
- **Purpose**: Controls how much referrer information is shared with other sites
- **Environment**: All environments
- **Value**: `strict-origin-when-cross-origin`
- **Behavior**:
  - Same-origin: Send full URL
  - Cross-origin HTTPS→HTTPS: Send origin only
  - Cross-origin HTTPS→HTTP: Send nothing

#### 5. **Permissions-Policy**
- **Purpose**: Controls which browser features and APIs can be used
- **Environment**: All environments
- **Restricted Features**:
  - `camera=()` - Camera access denied
  - `microphone=()` - Microphone access denied
  - `geolocation=()` - Geolocation denied
  - `interest-cohort=()` - FLoC tracking denied
  - `payment=()` - Payment API denied
  - `usb=()` - USB access denied
  - `magnetometer=()` - Magnetometer denied
  - `gyroscope=()` - Gyroscope denied
  - `accelerometer=()` - Accelerometer denied
  - `ambient-light-sensor=()` - Ambient light sensor denied

#### 6. **Strict-Transport-Security (HSTS)**
- **Purpose**: Forces browsers to only use HTTPS connections
- **Environment**: Production only (requires HTTPS)
- **Value**: `max-age=31536000; includeSubDomains`
- **Configuration**:
  - `max-age`: 31536000 seconds (1 year)
  - `includeSubDomains`: Apply to all subdomains
  - `preload`: Optional (set after testing)

**Important**: To enable HSTS preloading:
1. Test thoroughly with current configuration
2. Add `preload` directive
3. Submit domain to [hstspreload.org](https://hstspreload.org)

#### 7. **X-DNS-Prefetch-Control: on**
- **Purpose**: Controls DNS prefetching for improved performance
- **Environment**: All environments
- **Value**: `on`

#### 8. **X-Permitted-Cross-Domain-Policies: none**
- **Purpose**: Prevents Adobe Flash and PDF from making cross-domain requests
- **Environment**: All environments
- **Value**: `none`

---

## Content Security Policy (CSP)

### CSP Overview

Content Security Policy is the most important security header, providing defense against:
- Cross-Site Scripting (XSS) attacks
- Data injection attacks
- Unauthorized resource loading
- Clickjacking

### Environment-Specific Policies

#### Development CSP

More permissive to support hot-reload and development tools:

```
default-src 'self'
script-src 'self' 'unsafe-eval' 'unsafe-inline' 'nonce-{random}' https://www.google.com https://www.gstatic.com https://apis.google.com
style-src 'self' 'unsafe-inline' 'nonce-{random}' https://fonts.googleapis.com
img-src 'self' data: blob: https://firebasestorage.googleapis.com https://*.googleusercontent.com
font-src 'self' data: https://fonts.gstatic.com
connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net wss://*.firebaseio.com
frame-src 'self' https://www.google.com https://accounts.google.com
worker-src 'self' blob:
manifest-src 'self'
object-src 'none'
base-uri 'self'
form-action 'self'
frame-ancestors 'none'
upgrade-insecure-requests
```

**Key Development Features**:
- `'unsafe-eval'`: Required for Next.js hot-reload
- `'unsafe-inline'`: Allowed for convenience
- More permissive inline script/style policies

#### Production CSP

Stricter policy with nonce-based inline script execution:

```
default-src 'self'
script-src 'self' 'nonce-{random}' https://www.google.com https://www.gstatic.com https://apis.google.com
script-src-elem 'self' 'nonce-{random}' https://www.google.com https://www.gstatic.com https://apis.google.com
style-src 'self' 'nonce-{random}' https://fonts.googleapis.com
style-src-elem 'self' 'nonce-{random}' https://fonts.googleapis.com
style-src-attr 'unsafe-inline'
img-src 'self' data: blob: https://firebasestorage.googleapis.com https://*.googleusercontent.com
font-src 'self' data: https://fonts.gstatic.com
connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net wss://*.firebaseio.com
frame-src 'self' https://www.google.com https://accounts.google.com
worker-src 'self' blob:
manifest-src 'self'
media-src 'self'
object-src 'none'
base-uri 'self'
form-action 'self'
frame-ancestors 'none'
block-all-mixed-content
upgrade-insecure-requests
report-uri /api/csp-report
```

**Key Production Features**:
- NO `'unsafe-eval'` or `'unsafe-inline'` for scripts
- Nonce-based inline script execution
- `block-all-mixed-content`: Blocks HTTP resources on HTTPS pages
- `report-uri`: CSP violation reporting

### CSP Directives Explained

#### default-src
Default policy for loading content. Set to `'self'` to only allow resources from the same origin.

#### script-src
Controls JavaScript execution:
- `'self'`: Allow scripts from same origin
- `'nonce-{random}'`: Allow inline scripts with matching nonce
- `'unsafe-eval'`: Allow eval() (dev only)
- `'unsafe-inline'`: Allow all inline scripts (dev only)

#### style-src
Controls CSS loading:
- `'self'`: Allow stylesheets from same origin
- `'nonce-{random}'`: Allow inline styles with matching nonce
- `'unsafe-inline'`: Required for some React inline styles

#### img-src
Controls image loading:
- `'self'`: Same origin images
- `data:`: Data URIs
- `blob:`: Blob URLs
- Firebase Storage and Google user avatars

#### connect-src
Controls AJAX, WebSocket, and Fetch connections:
- Firebase services (Firestore, Auth, Storage)
- Google APIs
- WebSocket connections for real-time features

#### frame-src
Controls iframe sources:
- Google reCAPTCHA
- Google Sign-In

### Nonce Implementation

Nonces provide a way to allow specific inline scripts/styles while blocking others:

1. **Generation**: Cryptographically secure nonce generated per request
2. **Middleware**: Nonce added to CSP header
3. **Usage**: Add nonce to inline scripts/styles (future implementation)

Example usage (when needed):
```html
<script nonce="random-nonce-value">
  // Inline script code
</script>
```

---

## Implementation Details

### File Structure

```
src/
├── lib/
│   └── security/
│       ├── csp.ts          # CSP configuration and builder
│       ├── headers.ts      # Security headers configuration
│       └── index.ts        # Main export
├── middleware.ts           # Security headers application
└── app/
    └── api/
        └── csp-report/
            └── route.ts    # CSP violation reporting
```

### Key Functions

#### `getRequestSecurityHeaders(pathname, options)`
Main function to get all security headers for a request.

```typescript
import { getRequestSecurityHeaders } from '@/lib/security'

const headers = getRequestSecurityHeaders('/admin', {
  nonce: 'random-nonce',
  environment: 'production',
  reportOnly: false,
})
```

#### `generateNonce()`
Generate a cryptographically secure nonce.

```typescript
import { generateNonce } from '@/lib/security'

const nonce = generateNonce()
// Returns: base64-encoded random bytes
```

#### `createSecurityHeaders(pathname, config)`
Create environment and route-specific headers.

---

## Configuration

### Environment Variables

No environment variables required by default. Optional configuration:

```env
# Optional: Custom report URI
CSP_REPORT_URI=/api/csp-report

# Optional: Enable CSP report-only mode for testing
CSP_REPORT_ONLY=false

# Production environment detection
NODE_ENV=production
```

### Customizing CSP

To modify CSP directives, edit `/src/lib/security/csp.ts`:

```typescript
// Add a new allowed domain
function getProductionDirectives(nonce?: string): CSPDirective {
  return {
    // ... existing directives
    'connect-src': [
      "'self'",
      'https://your-api.example.com', // Add here
      // ... rest
    ],
  }
}
```

### Route-Specific Headers

Different routes can have different security configurations:

```typescript
// In /src/lib/security/headers.ts
export function getRouteSpecificHeaders(pathname: string): Record<string, string> {
  if (pathname.startsWith('/api/public/')) {
    // Custom headers for public API
    return {
      'Access-Control-Allow-Origin': '*',
    }
  }
  // ... rest
}
```

---

## Monitoring and Reporting

### CSP Violation Reports

Browsers automatically send violation reports to `/api/csp-report` when CSP is violated.

#### Report Format

```json
{
  "csp-report": {
    "document-uri": "https://example.com/page",
    "violated-directive": "script-src",
    "effective-directive": "script-src",
    "original-policy": "...",
    "blocked-uri": "https://evil.com/script.js",
    "status-code": 200,
    "source-file": "https://example.com/page",
    "line-number": 10,
    "column-number": 5,
    "disposition": "enforce"
  }
}
```

#### Report Processing

1. **Rate Limiting**: 100 reports per minute per client
2. **Filtering**: Browser extensions and known false positives ignored
3. **Logging**:
   - Development: Console warnings
   - Production: Structured logging (integrate with Sentry/DataDog)

#### Integrating with Monitoring Services

To send reports to Sentry, modify `/src/app/api/csp-report/route.ts`:

```typescript
import * as Sentry from '@sentry/nextjs'

function logViolation(report: CSPViolationReport, metadata: any): void {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureMessage(formatViolationReport(report), {
      level: 'warning',
      tags: {
        type: 'csp_violation',
        directive: report['violated-directive'],
      },
      extra: { report, metadata },
    })
  }
}
```

---

## Testing

### Testing CSP Locally

1. **Report-Only Mode**: Test without blocking (in middleware.ts):
```typescript
const securityHeaders = getRequestSecurityHeaders(pathname, {
  reportOnly: true, // Won't block, only report
})
```

2. **Check Browser Console**: Look for CSP violations
3. **Review Reports**: Check `/api/csp-report` endpoint

### Manual Testing

Test specific scenarios:

```bash
# Test with cURL
curl -I https://your-domain.com

# Check specific headers
curl -I https://your-domain.com | grep -i "content-security-policy"
```

### Automated Testing

Use security testing tools:

```bash
# Security Headers
npx security-headers-check https://your-domain.com

# Mozilla Observatory
# Visit: https://observatory.mozilla.org/

# CSP Evaluator
# Visit: https://csp-evaluator.withgoogle.com/
```

### Online Tools

1. **Mozilla Observatory**: [observatory.mozilla.org](https://observatory.mozilla.org/)
   - Comprehensive security analysis
   - Grade from A+ to F

2. **Security Headers**: [securityheaders.com](https://securityheaders.com/)
   - Quick header check
   - Best practices comparison

3. **CSP Evaluator**: [csp-evaluator.withgoogle.com](https://csp-evaluator.withgoogle.com/)
   - CSP-specific analysis
   - Identifies weaknesses

---

## Troubleshooting

### Common Issues

#### 1. Google Fonts Not Loading

**Symptom**: Fonts don't load, CSP violation for fonts.googleapis.com

**Solution**: Ensure CSP includes:
```
style-src 'self' https://fonts.googleapis.com
font-src 'self' https://fonts.gstatic.com
```

#### 2. Firebase Not Connecting

**Symptom**: "Refused to connect" errors for Firebase

**Solution**: Verify CSP includes all Firebase domains:
```
connect-src 'self' https://*.googleapis.com https://*.firebaseio.com
```

#### 3. Google Sign-In Broken

**Symptom**: Google OAuth popup blocked

**Solution**: Check frame-src includes:
```
frame-src 'self' https://www.google.com https://accounts.google.com
```

#### 4. Inline Scripts Blocked in Production

**Symptom**: Inline scripts fail with CSP error

**Solution**: Either:
1. Move script to external file
2. Use nonce attribute (implement nonce support in components)
3. Generate hash and add to CSP

#### 5. Next.js Development Mode Issues

**Symptom**: Hot reload broken, "eval" CSP violations

**Solution**: Development CSP automatically includes `'unsafe-eval'`. If issues persist:
1. Clear browser cache
2. Restart dev server
3. Check CSP isn't being overridden

### Debugging CSP

Enable detailed CSP logging:

```typescript
// In /src/lib/security/index.ts
import { DevSecurityUtils } from '@/lib/security'

// In development
if (process.env.NODE_ENV === 'development') {
  DevSecurityUtils.logSecurityHeaders(securityHeaders)
}
```

### CSP Violation Analysis

When violations occur:

1. **Check the directive**: What was blocked?
2. **Check the URI**: What tried to load?
3. **Check source file**: Where did it come from?
4. **Determine legitimacy**: Attack or misconfiguration?

---

## Best Practices

### 1. Start with Report-Only Mode

When deploying new CSP changes:

```typescript
// In middleware.ts
const securityHeaders = getRequestSecurityHeaders(pathname, {
  reportOnly: true, // Test first
})
```

1. Deploy with report-only
2. Monitor violations for 24-48 hours
3. Fix legitimate issues
4. Switch to enforcement mode

### 2. Regular Security Audits

Schedule regular reviews:
- Monthly: Check CSP violation reports
- Quarterly: Run security header scans
- After major changes: Full security audit

### 3. Keep CSP Updated

When adding new services:
1. Add domains to CSP
2. Test thoroughly
3. Update documentation

### 4. Monitor Security Headers

Set up automated monitoring:
```typescript
// Example: Weekly security header check
// Add to CI/CD pipeline
```

### 5. Defense in Depth

Security headers are one layer. Also implement:
- Input validation
- Output encoding
- Authentication/authorization
- Rate limiting
- CSRF protection
- SQL injection prevention

### 6. Documentation

Keep security documentation updated:
- Document all CSP changes
- Note why specific domains are allowed
- Track security incidents

### 7. Gradual Tightening

Start permissive, gradually tighten:
1. Start with functional CSP
2. Monitor violations
3. Remove unnecessary permissions
4. Test thoroughly
5. Deploy stricter policy

---

## Additional Resources

### Official Documentation

- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [MDN: HTTP Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)
- [OWASP: Secure Headers Project](https://owasp.org/www-project-secure-headers/)

### Tools

- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [Mozilla Observatory](https://observatory.mozilla.org/)
- [Security Headers](https://securityheaders.com/)
- [Report URI](https://report-uri.com/)

### Next.js Specific

- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [Next.js Middleware](https://nextjs.org/docs/advanced-features/middleware)

---

## Changelog

### Version 1.0.0 (2025-10-16)

- Initial implementation of comprehensive security headers
- CSP with environment-specific configurations
- Nonce generation for inline scripts
- CSP violation reporting endpoint
- Route-specific header configuration
- Development and production modes
- Rate-limited violation reporting

---

## Support

For security concerns or questions:
1. Review this documentation
2. Check CSP violation reports
3. Test with report-only mode
4. Consult Next.js security documentation

**Security Issues**: Report security vulnerabilities privately to the development team.

---

## License

This security implementation is part of the DevTalks application.

---

*Last Updated: 2025-10-16*
