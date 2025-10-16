# Performance Quick Reference

Quick reference guide for performance optimization in DevTalks.

## Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Analyze bundle
npm run build:analyze

# Run Lighthouse
npx lighthouse http://localhost:3000 --view
```

## Import Statements

### Performance Utilities

```typescript
// Web Vitals
import { initWebVitals, reportWebVitals } from '@/lib/performance'

// Caching
import { apiCache, ISR_CONFIG, getCacheControl } from '@/lib/performance/caching'

// Image optimization
import { generateShimmerDataURL, getResponsiveSizes } from '@/lib/image-optimization'

// Dynamic imports
import { DynamicMDEditor, createDynamicImport } from '@/lib/performance/dynamic-imports'

// Skeletons
import { Skeleton, PostCardSkeleton, BlogPostCardSkeleton } from '@/components/skeleton'

// Resource hints
import { ResourceHints, PreloadImages } from '@/lib/performance/resource-hints'
```

## Common Patterns

### Optimized Image

```tsx
import Image from 'next/image'
import { generateShimmerDataURL } from '@/lib/image-optimization'

<Image
  src={post.image}
  alt={post.title}
  fill
  sizes="(max-width: 768px) 100vw, 50vw"
  quality={85}
  placeholder="blur"
  blurDataURL={generateShimmerDataURL()}
  loading="lazy"
/>
```

### Hero Image (Priority)

```tsx
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={630}
  priority
  quality={90}
  placeholder="blur"
  blurDataURL={generateShimmerDataURL()}
/>
```

### Dynamic Import

```tsx
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/skeleton'

const HeavyComponent = dynamic(
  () => import('./heavy-component'),
  {
    loading: () => <Skeleton className="h-32 w-full" />,
    ssr: false,
  }
)
```

### ISR Configuration

```typescript
// In page.tsx
import { ISR_CONFIG } from '@/lib/performance/caching'

export const revalidate = ISR_CONFIG.BLOG_POST.revalidate // 3600 seconds
```

### Loading State

```tsx
import { Suspense } from 'react'
import { PostCardSkeleton } from '@/components/skeleton'

<Suspense fallback={<PostCardSkeleton />}>
  <PostCard post={post} />
</Suspense>
```

### Client-Side Caching

```typescript
import { apiCache } from '@/lib/performance/caching'

// Set
apiCache.set('posts', data, 300000) // 5 minutes

// Get
const cached = apiCache.get('posts')
if (cached) return cached

// Fetch and cache
const data = await fetch('/api/posts').then(r => r.json())
apiCache.set('posts', data, 300000)
```

### Memoization

```typescript
import { memoize } from '@/lib/performance/caching'

const expensiveFunction = memoize(
  (arg: string) => {
    // Expensive calculation
    return result
  },
  { maxAge: 60000 } // 1 minute
)
```

## ISR Configurations

```typescript
// Blog post page
export const revalidate = 3600 // 1 hour

// Blog list page
export const revalidate = 300 // 5 minutes

// Project page
export const revalidate = 86400 // 1 day

// User profile
export const revalidate = 300 // 5 minutes

// Static pages
export const revalidate = 86400 // 1 day
```

## Cache Control Headers

```typescript
import { getCacheControl } from '@/lib/performance/caching'

// Static assets
Cache-Control: public, max-age=31536000, immutable

// API responses
Cache-Control: public, max-age=300, stale-while-revalidate=600

// Dynamic pages
Cache-Control: public, max-age=3600, stale-while-revalidate=86400
```

## Performance Targets

```
LCP: < 2.5s
FID: < 100ms
CLS: < 0.1
FCP: < 1.8s
TTFB: < 800ms
INP: < 200ms
```

## Bundle Budgets

```
Main Bundle: < 300 KB
Chunk Size: < 150 KB
Total JS: < 600 KB
CSS: < 100 KB
```

## Image Sizes

```typescript
// Full width
sizes="100vw"

// Half width on desktop
sizes="(max-width: 768px) 100vw, 50vw"

// Third width on desktop
sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"

// Quarter width on desktop
sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
```

## Font Configuration

```typescript
import { FontName } from 'next/font/google'

const fontName = FontName({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-name',
  display: 'swap',
  preload: true,
})
```

## Resource Hints

```tsx
// In layout head
<link rel="preconnect" href="https://example.com" />
<link rel="dns-prefetch" href="https://example.com" />
<link rel="preload" as="image" href="/hero.jpg" />
```

## Common Mistakes to Avoid

❌ **Don't**:
- Use `<img>` tags (use `<Image>`)
- Import entire icon libraries
- Load heavy components on initial render
- Forget image sizes prop
- Skip loading states
- Use external font CDNs
- Over-cache dynamic data

✅ **Do**:
- Use `next/image` for all images
- Import icons individually
- Use dynamic imports for heavy components
- Always specify image sizes
- Provide skeleton loading states
- Use `next/font` for fonts
- Set appropriate revalidate times

## Debugging Performance

```bash
# Development console
- Check Web Vitals logs
- Check bundle analysis logs

# Production
- Open DevTools Performance tab
- Run Lighthouse audit
- Check Network tab with throttling
- Monitor Web Vitals API

# Bundle analysis
npm run build:analyze
```

## Quick Wins

1. **Add priority to LCP image**: Add `priority` prop to hero images
2. **Lazy load below-fold images**: Use `loading="lazy"`
3. **Add blur placeholders**: Use `blurDataURL`
4. **Dynamic import heavy components**: Use `dynamic()`
5. **Enable ISR**: Add `export const revalidate = 3600`
6. **Add loading skeletons**: Use `<Suspense>` with fallback
7. **Optimize images**: Compress before upload
8. **Use font-display swap**: In font config

## Monitoring

```typescript
// Check metrics in development console
[Web Vitals] LCP: { value: 1234, rating: 'good' }
[Web Vitals] FID: { value: 56, rating: 'good' }
[Web Vitals] CLS: { value: 0.05, rating: 'good' }

// Production metrics
POST /api/vitals
```

## Resources

- [Full Documentation](./PERFORMANCE_OPTIMIZATION.md)
- [Next.js Image Docs](https://nextjs.org/docs/pages/building-your-application/optimizing/images)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
