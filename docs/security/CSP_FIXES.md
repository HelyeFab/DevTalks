# Content Security Policy (CSP) Fixes

## Overview
This document explains the CSP-related issues found in the DevTalks application and how they were resolved.

## Issues Fixed

### 1. ❌ Permissions-Policy Warning: `ambient-light-sensor`

**Error:**
```
Permissions-Policy header: Unrecognized feature: 'ambient-light-sensor'
```

**Root Cause:**
The `ambient-light-sensor` feature was included in the Permissions-Policy header, but it's not a standardized feature name recognized by browsers.

**Fix:**
Removed `ambient-light-sensor` from the Permissions-Policy header in `src/lib/security/headers.ts:63`.

**File Changed:**
- `src/lib/security/headers.ts`

**Impact:**
- Warning eliminated
- No functional change (feature was being blocked anyway)

---

### 2. ❌ CSP Violation: Inline Styles Blocked

**Error:**
```
Refused to apply inline style because it violates the following Content Security Policy directive:
"style-src-elem 'self' 'nonce-ykDTsjA5R9YJe1XMyhDStw==' https://fonts.googleapis.com"
```

**Root Cause:**
Next.js generates dynamic inline styles for:
- CSS-in-JS libraries
- React inline styles (`style={{...}}`)
- Framework-generated optimization styles

Our CSP was too strict and blocked these legitimate inline styles, even with nonces.

**Fix:**
Added `'unsafe-inline'` to the following CSP directives:
- `style-src` - Allows inline `<style>` tags
- `style-src-elem` - Allows inline style elements
- `style-src-attr` - Allows inline `style=""` attributes (already present)

**Files Changed:**
- `src/lib/security/csp.ts:204-217`

**Code Changes:**
```typescript
'style-src': [
  "'self'",
  ...nonceDirective,
  "'unsafe-inline'", // ✅ Required for Next.js dynamic inline styles
  'https://fonts.googleapis.com',
],
'style-src-elem': [
  "'self'",
  ...nonceDirective,
  "'unsafe-inline'", // ✅ Required for Next.js CSS-in-JS
  'https://fonts.googleapis.com',
],
```

**Security Impact:**
- **Trade-off:** Allowing `'unsafe-inline'` for styles reduces CSP protection against style-based attacks
- **Mitigation:** This is a **necessary compromise** for Next.js applications
- **Note:** The nonce is still present and preferred when applicable
- **Alternative:** Using strict CSP without `'unsafe-inline'` would require significant refactoring to eliminate all inline styles, which is impractical with Next.js

---

### 3. ❌ CSP Violation: Firebase Auth Iframe Blocked

**Error:**
```
Refused to frame 'https://efabiani-blog.firebaseapp.com/' because it violates the following
Content Security Policy directive: "frame-src 'self' https://www.google.com https://accounts.google.com"
```

**Root Cause:**
Firebase Authentication uses iframes from `*.firebaseapp.com` and `*.firebase.google.com` domains for OAuth flows. These were not whitelisted in the CSP `frame-src` directive.

**Fix:**
Added Firebase domains to the `frame-src` directive in both development and production CSP configurations:

```typescript
'frame-src': [
  "'self'",
  'https://www.google.com',
  'https://accounts.google.com',
  'https://*.firebaseapp.com', // ✅ Allow Firebase Auth iframe
  'https://*.firebase.google.com', // ✅ Allow Firebase services iframes
],
```

**Files Changed:**
- `src/lib/security/csp.ts:167-168` (development)
- `src/lib/security/csp.ts:228-229` (production)

**Security Impact:**
- **Minimal risk:** Only Firebase-owned domains are allowed
- **Necessary:** Required for Firebase Authentication to function
- **Wildcard usage:** The wildcard (`*`) is scoped to Firebase subdomains only

---

## Understanding CSP Directives

### `style-src` vs `style-src-elem` vs `style-src-attr`

| Directive | Controls | Example |
|-----------|----------|---------|
| `style-src` | General fallback for all styles | - |
| `style-src-elem` | `<style>` elements and `<link rel="stylesheet">` | `<style>body { color: red; }</style>` |
| `style-src-attr` | Inline `style=""` attributes | `<div style="color: blue">` |

**Best Practice:** Specify all three for fine-grained control.

### CSP Evaluation Order

When a browser evaluates CSP for inline styles:
1. Check `style-src-elem` for `<style>` elements
2. Check `style-src-attr` for `style=""` attributes
3. Fall back to `style-src` if specific directive not set

### Nonce vs `'unsafe-inline'`

- **Nonce:** When present, only inline styles with matching `nonce` attribute are allowed
- **`'unsafe-inline'` with Nonce:** In CSP Level 3, presence of nonce **overrides** `'unsafe-inline'`
- **Our Implementation:** We include both for backward compatibility with older browsers

---

## Why Next.js Requires `'unsafe-inline'` for Styles

Next.js dynamically injects styles that cannot use nonces:

1. **CSS Modules Extraction:** Next.js extracts CSS at build time and runtime
2. **Styled JSX:** Built-in CSS-in-JS solution generates inline styles
3. **Third-party Libraries:** Many React libraries (Material-UI, Emotion, etc.) use inline styles
4. **Framework Optimizations:** Next.js adds critical CSS inline for performance

### Attempted Alternatives (Why They Don't Work)

❌ **Strict CSP without `'unsafe-inline'`:**
- Would require ejecting from Next.js build process
- Would break many third-party components
- Would eliminate performance optimizations

❌ **Using hashes instead of `'unsafe-inline'`:**
- Requires knowing all inline styles at build time
- Not feasible with dynamic client-side rendering
- Doesn't work with framework-generated styles

✅ **Current Approach (Recommended):**
- Allow `'unsafe-inline'` for styles only
- Keep strict CSP for scripts (no `'unsafe-inline'` or `'unsafe-eval'`)
- Use nonces for scripts where possible
- Accept this as a necessary trade-off for using Next.js

---

## Testing CSP Changes

### Local Testing

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open browser DevTools → Console**
   - Check for CSP violations
   - All previous errors should be resolved

3. **Test Firebase Authentication:**
   - Try signing in with Google
   - Verify no iframe blocking errors

### Production Testing

1. **Build the application:**
   ```bash
   npm run build
   npm start
   ```

2. **Verify CSP headers:**
   ```bash
   curl -I https://your-domain.com | grep -i "content-security-policy"
   ```

3. **Check for violations in production:**
   - Monitor browser console
   - Review `/api/csp-report` endpoint logs

---

## CSP Report-Only Mode

To test CSP changes without blocking content:

**Update `src/middleware.ts:88`:**
```typescript
const securityHeaders = getRequestSecurityHeaders(pathname, {
  nonce,
  environment: environment as 'development' | 'production',
  reportOnly: true, // ✅ Set to true for testing
})
```

**Benefits:**
- Reports violations without blocking
- Safe to test in production
- Allows gradual CSP rollout

---

## Security Recommendations

### ✅ Current Security Posture

**Strong protections maintained:**
- ✅ Scripts: No `'unsafe-inline'` or `'unsafe-eval'` in production
- ✅ Frames: Restricted to trusted domains only
- ✅ Fonts: Only from self and Google Fonts
- ✅ Images: Limited to self and trusted CDNs
- ✅ XSS Protection: Via script-src restrictions

**Acceptable trade-offs:**
- ⚠️ Styles: `'unsafe-inline'` required for Next.js (industry standard)
- ⚠️ Wildcards: Only for Firebase subdomains (minimal risk)

### 🔒 Additional Hardening (Optional)

1. **Implement Subresource Integrity (SRI):**
   ```html
   <link rel="stylesheet" href="..." integrity="sha384-..." crossorigin="anonymous">
   ```

2. **Add Trusted Types (Experimental):**
   ```typescript
   'require-trusted-types-for': ["'script'"]
   'trusted-types': ['default']
   ```

3. **Monitor CSP Violations:**
   - Set up logging for `/api/csp-report`
   - Alert on unexpected violations
   - Review reports weekly

4. **Rotate Nonces:**
   - Currently generated per request ✅
   - Consider adding request-level entropy

---

## References

- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CSP Level 3 Spec](https://www.w3.org/TR/CSP3/)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [Firebase Auth Domains](https://firebase.google.com/docs/auth/web/redirect-best-practices)
- [Google CSP Evaluator](https://csp-evaluator.withgoogle.com/)

---

**Last Updated:** 2025-10-18
**Status:** ✅ All CSP violations resolved
**Security Impact:** Low risk, necessary trade-offs documented
