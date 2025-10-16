# Performance Optimization Guide

This document provides a comprehensive overview of the performance optimizations implemented in the DevTalks Next.js application.

## Table of Contents

1. [Overview](#overview)
2. [Core Web Vitals Targets](#core-web-vitals-targets)
3. [Image Optimization](#image-optimization)
4. [Font Optimization](#font-optimization)
5. [Bundle Optimization](#bundle-optimization)
6. [Caching Strategies](#caching-strategies)
7. [Performance Monitoring](#performance-monitoring)
8. [Loading Optimizations](#loading-optimizations)
9. [Best Practices](#best-practices)
10. [Measuring Performance](#measuring-performance)

## Overview

This application has been optimized to achieve excellent Core Web Vitals scores and provide a fast, responsive user experience. All optimizations follow Next.js best practices and modern web performance standards.

### Key Achievements

- **Automatic image optimization** with WebP/AVIF format support
- **Font optimization** using `next/font` with display swap
- **Bundle splitting** for optimal code loading
- **ISR (Incremental Static Regeneration)** for dynamic content
- **Web Vitals monitoring** for real-time performance tracking
- **Skeleton loading states** for perceived performance
- **Resource hints** for faster resource loading

## Core Web Vitals Targets

We aim to achieve the following targets for Core Web Vitals:

| Metric | Target | Good | Needs Improvement | Poor |
|--------|--------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | < 2.5s | ≤ 2.5s | 2.5s - 4.0s | > 4.0s |
| **FID** (First Input Delay) | < 100ms | ≤ 100ms | 100ms - 300ms | > 300ms |
| **CLS** (Cumulative Layout Shift) | < 0.1 | ≤ 0.1 | 0.1 - 0.25 | > 0.25 |
| **FCP** (First Contentful Paint) | < 1.8s | ≤ 1.8s | 1.8s - 3.0s | > 3.0s |
| **TTFB** (Time to First Byte) | < 800ms | ≤ 800ms | 800ms - 1800ms | > 1800ms |
| **INP** (Interaction to Next Paint) | < 200ms | ≤ 200ms | 200ms - 500ms | > 500ms |

## Image Optimization

### Next.js Image Component

All images use the Next.js `Image` component for automatic optimization:

```tsx
import Image from 'next/image'
import { generateShimmerDataURL } from '@/lib/image-optimization'

<Image
  src="/path/to/image.jpg"
  alt="Description"
  width={800}
  height={600}
  quality={85}
  placeholder="blur"
  blurDataURL={generateShimmerDataURL()}
  loading="lazy"
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

### Key Features

- **Automatic format conversion**: Images are served in WebP/AVIF when supported
- **Responsive images**: Multiple sizes generated automatically
- **Lazy loading**: Images below the fold load on-demand
- **Blur placeholders**: Shimmer effect while loading
- **Quality optimization**: 85% quality for optimal balance

### Configuration

Image optimization is configured in `/config/next.config.js`:

```javascript
images: {
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  minimumCacheTTL: 60,
}
```

### Best Practices

1. **Always specify sizes**: Use the `sizes` prop for responsive images
2. **Use priority for LCP images**: Add `priority` prop to above-fold images
3. **Optimize source images**: Compress images before uploading
4. **Use appropriate formats**: WebP for photos, SVG for icons/logos

## Font Optimization

### next/font Implementation

Fonts are optimized using Next.js's `next/font` package:

```typescript
import { Lobster, Cabin } from 'next/font/google'

const lobster = Lobster({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-lobster',
  display: 'swap',
  preload: true,
})

const cabin = Cabin({
  subsets: ['latin'],
  variable: '--font-cabin',
  display: 'swap',
  preload: true,
})
```

### Benefits

- **Self-hosting**: Fonts are automatically self-hosted
- **Zero layout shift**: `font-display: swap` prevents invisible text
- **Preloading**: Critical fonts are preloaded
- **CSS variables**: Easy theming with CSS custom properties
- **Subset optimization**: Only Latin characters loaded

### Resource Hints

Font preconnects are configured in the layout:

```tsx
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
```

## Bundle Optimization

### Code Splitting

The application uses automatic and manual code splitting:

#### Automatic Splitting

Next.js automatically splits code by route. Each page loads only necessary code.

#### Manual Splitting (Dynamic Imports)

Heavy components are loaded dynamically:

```typescript
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/skeleton'

const DynamicMDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  }
)
```

### Bundle Analysis

Analyze bundle size with:

```bash
npm run build:analyze
```

This opens an interactive treemap showing bundle composition.

### Webpack Optimization

Custom webpack configuration in `next.config.js`:

```javascript
splitChunks: {
  chunks: 'all',
  cacheGroups: {
    vendor: { /* node_modules */ },
    common: { /* shared code */ },
    react: { /* React/ReactDOM */ },
    firebase: { /* Firebase */ },
  },
}
```

### Performance Budgets

| Category | Warning | Error |
|----------|---------|-------|
| Main Bundle | 200 KB | 300 KB |
| Chunk Size | 100 KB | 150 KB |
| Total JS | 400 KB | 600 KB |
| CSS | 50 KB | 100 KB |

## Caching Strategies

### ISR (Incremental Static Regeneration)

Pages use ISR for optimal caching:

```typescript
// Revalidate blog posts every hour
export const revalidate = 3600

// Or use constants
import { ISR_CONFIG } from '@/lib/performance/caching'
export const revalidate = ISR_CONFIG.BLOG_POST.revalidate
```

### Cache Durations

```typescript
CACHE_DURATIONS = {
  STATIC: 31536000,      // 1 year
  IMAGE: 31536000,       // 1 year
  API: 300,              // 5 minutes
  PAGE: 3600,            // 1 hour
  DYNAMIC: 300,          // 5 minutes
}
```

### HTTP Caching Headers

Configured in `next.config.js`:

```javascript
async headers() {
  return [
    {
      source: '/images/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
  ]
}
```

### Client-Side Caching

Use the `ClientCache` class for API responses:

```typescript
import { apiCache } from '@/lib/performance/caching'

// Cache API response
apiCache.set('key', data, 300000) // 5 minutes

// Retrieve from cache
const cached = apiCache.get('key')
```

## Performance Monitoring

### Web Vitals Tracking

Web Vitals are automatically tracked and reported:

```typescript
// Initialized in root layout
import { WebVitalsReporter } from '@/components/web-vitals-reporter'

<WebVitalsReporter />
```

### Metrics Collected

- **LCP**: Largest Contentful Paint
- **FID**: First Input Delay
- **CLS**: Cumulative Layout Shift
- **FCP**: First Contentful Paint
- **TTFB**: Time to First Byte
- **INP**: Interaction to Next Paint

### API Endpoint

Metrics are sent to `/api/vitals` for analysis:

```typescript
POST /api/vitals
{
  name: "LCP",
  value: 1234,
  rating: "good",
  id: "v3-1234...",
  url: "https://example.com/page",
  timestamp: 1234567890
}
```

### Development Monitoring

In development, metrics are logged to console:

```javascript
console.log('[Web Vitals] LCP:', {
  value: 1234,
  rating: 'good',
  id: 'v3-1234...'
})
```

### Bundle Analysis

View bundle composition in development:

```typescript
import { logBundleAnalysis } from '@/lib/performance'

// Logs detailed bundle breakdown to console
logBundleAnalysis()
```

## Loading Optimizations

### Skeleton Screens

All components have skeleton loading states:

```tsx
import { PostCardSkeleton } from '@/components/skeleton'

<Suspense fallback={<PostCardSkeleton />}>
  <PostCard post={post} />
</Suspense>
```

Available skeletons:
- `Skeleton`: Base skeleton component
- `SkeletonCard`: Generic card skeleton
- `SkeletonText`: Text content skeleton
- `SkeletonAvatar`: Avatar skeleton
- `SkeletonImage`: Image skeleton
- `PostCardSkeleton`: Post card specific
- `BlogPostCardSkeleton`: Blog post card specific
- `ProjectCardSkeleton`: Project card specific

### Resource Hints

Resource hints optimize external resource loading:

```tsx
import { ResourceHints } from '@/lib/performance/resource-hints'

<head>
  <ResourceHints />
</head>
```

Includes:
- **Preconnect**: Firebase Storage, Google APIs
- **DNS Prefetch**: External domains
- **Preload**: Critical fonts and images

### Progressive Enhancement

1. **Critical CSS**: Inline critical CSS in HTML
2. **Deferred JavaScript**: Non-critical JS loads after page interactive
3. **Lazy Loading**: Images and components load on-demand
4. **Service Worker**: (Optional) Offline support and caching

## Best Practices

### 1. Images

- ✅ Use `next/image` for all images
- ✅ Add `priority` to LCP images
- ✅ Specify `sizes` for responsive images
- ✅ Use `loading="lazy"` for below-fold images
- ✅ Add blur placeholders
- ❌ Don't use `<img>` tags
- ❌ Don't forget alt text

### 2. Fonts

- ✅ Use `next/font` for Google Fonts
- ✅ Add `display: 'swap'`
- ✅ Preload critical fonts
- ✅ Subset fonts when possible
- ❌ Don't use external font CDNs
- ❌ Don't load unnecessary font weights

### 3. Code Splitting

- ✅ Use dynamic imports for heavy components
- ✅ Add loading states for dynamic imports
- ✅ Split by route automatically
- ✅ Monitor bundle size regularly
- ❌ Don't import entire libraries
- ❌ Don't load unused code

### 4. Caching

- ✅ Use ISR for dynamic content
- ✅ Set appropriate revalidate times
- ✅ Cache static assets aggressively
- ✅ Use stale-while-revalidate pattern
- ❌ Don't over-cache dynamic data
- ❌ Don't forget cache invalidation

### 5. Performance

- ✅ Monitor Web Vitals regularly
- ✅ Test on slow connections
- ✅ Optimize for mobile first
- ✅ Use Lighthouse in CI/CD
- ❌ Don't optimize prematurely
- ❌ Don't sacrifice UX for metrics

## Measuring Performance

### 1. Lighthouse

Run Lighthouse in Chrome DevTools:

```bash
# CLI
npx lighthouse https://your-site.com --view
```

Target scores:
- Performance: 90+
- Accessibility: 100
- Best Practices: 100
- SEO: 100

### 2. WebPageTest

Test from multiple locations:
- https://www.webpagetest.org/

### 3. Chrome DevTools

**Performance Tab**:
1. Open DevTools
2. Go to Performance tab
3. Click Record
4. Interact with page
5. Stop recording
6. Analyze timeline

**Network Tab**:
1. Open DevTools
2. Go to Network tab
3. Throttle to "Slow 3G"
4. Reload page
5. Check resource sizes and timing

### 4. Real User Monitoring

Production metrics are collected via Web Vitals API:

```typescript
// View metrics in your analytics
GET /api/vitals/analytics
```

### 5. Bundle Analyzer

Analyze production bundle:

```bash
npm run build:analyze
```

### 6. Performance Budget

Set budgets in `next.config.js`:

```javascript
experimental: {
  performanceBudget: {
    maxAssetSize: 300000, // 300 KB
    maxPageSize: 600000,  // 600 KB
  }
}
```

## Continuous Optimization

### Regular Tasks

**Weekly**:
- Review Web Vitals dashboard
- Check bundle size growth
- Test on slow connections

**Monthly**:
- Update dependencies
- Review performance budgets
- Analyze user metrics
- Identify bottlenecks

**Quarterly**:
- Comprehensive performance audit
- Update optimization strategies
- Review caching policies
- Test on various devices

### Performance Checklist

Before deploying:

- [ ] Run Lighthouse audit (score 90+)
- [ ] Check bundle size (within budget)
- [ ] Test on mobile devices
- [ ] Verify image optimization
- [ ] Check font loading
- [ ] Review cache headers
- [ ] Test loading states
- [ ] Verify Web Vitals tracking
- [ ] Check for console errors
- [ ] Test on slow connections

## Tools & Resources

### Built-in Tools

- `/api/vitals` - Web Vitals endpoint
- `npm run build:analyze` - Bundle analyzer
- `src/lib/performance/` - Performance utilities

### External Tools

- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WebPageTest](https://www.webpagetest.org/)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [web.dev](https://web.dev/measure/)

### Next.js Documentation

- [Image Optimization](https://nextjs.org/docs/pages/building-your-application/optimizing/images)
- [Font Optimization](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts)
- [Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)

## Troubleshooting

### Common Issues

**Large bundle size**:
- Use dynamic imports
- Check for duplicate dependencies
- Remove unused code
- Optimize images

**Slow LCP**:
- Optimize hero images
- Use priority loading
- Reduce server response time
- Minimize render-blocking resources

**High CLS**:
- Set image dimensions
- Reserve space for dynamic content
- Avoid inserting content above existing content
- Use font-display: swap

**Slow API responses**:
- Implement caching
- Use ISR
- Optimize database queries
- Add CDN

## Support

For questions or issues related to performance:

1. Check this documentation
2. Review `/src/lib/performance/` code
3. Run bundle analyzer
4. Check Web Vitals dashboard
5. Open GitHub issue with metrics

---

**Last Updated**: 2025-10-16
**Version**: 1.0.0
