# Image Optimization Configuration

## Next.js 16 Compatibility Fix

### Issue Fixed
Starting in Next.js 16, all quality values used in `next/image` components must be explicitly configured in `next.config.mjs`. Previously, you would see warnings like:

```
Image with src "..." is using quality "85" which is not configured in images.qualities.
This config will be required starting in Next.js 16.
```

### Solution Applied

**File:** `next.config.mjs`

Added comprehensive image optimization configuration:

```javascript
images: {
  remotePatterns: [
    // ... existing remote patterns
  ],
  qualities: [75, 85, 90, 95, 100],
  formats: ['image/webp', 'image/avif'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  minimumCacheTTL: 60,
}
```

---

## Configuration Explained

### `qualities: [75, 85, 90, 95, 100]`

**Purpose:** Defines allowed JPEG/WebP quality levels for image optimization.

**Quality Guidelines:**
- **75**: Good for thumbnails and non-critical images (smaller file size)
- **85**: ✅ **Default** - Optimal balance of quality and performance (used in our app)
- **90**: High quality for important images (hero images, featured content)
- **95**: Very high quality for detailed images
- **100**: Maximum quality (use sparingly, large file sizes)

**Why 85?**
- Used in `src/lib/image-optimization.ts:89` as the default
- Provides excellent visual quality while reducing file size by ~30% vs quality 100
- Industry standard for web images

**Usage in Code:**
```typescript
// src/lib/image-optimization.ts
export function getOptimizedImageProps({ ... }) {
  const baseProps = {
    quality: 85, // ✅ Now properly configured in next.config.mjs
    // ...
  }
}
```

---

### `formats: ['image/webp', 'image/avif']`

**Purpose:** Specify modern image formats for automatic conversion.

**Format Details:**
- **WebP**: 25-35% smaller than JPEG, supported by all modern browsers
- **AVIF**: 50% smaller than JPEG, cutting-edge format with growing support

**Automatic Selection:**
Next.js automatically serves the best format based on browser support:
1. Try AVIF (smallest, newest)
2. Fall back to WebP (widely supported)
3. Fall back to original format (JPEG/PNG)

---

### `deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840]`

**Purpose:** Define viewport widths for responsive images.

**Breakpoint Mapping:**
- **640px**: Mobile phones (portrait)
- **750px**: iPhone 6/7/8 Plus
- **828px**: iPhone XR/11
- **1080px**: Tablets and small laptops
- **1200px**: Desktop (default)
- **1920px**: Full HD displays
- **2048px**: Retina displays
- **3840px**: 4K displays

**How It Works:**
When you use `sizes="100vw"`, Next.js generates variants at these widths and serves the appropriate one based on the user's device.

**Example:**
```tsx
<Image
  src="hero.jpg"
  width={1920}
  height={1080}
  sizes="100vw" // Will use deviceSizes
/>
```

---

### `imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]`

**Purpose:** Define fixed sizes for icons, avatars, and small images.

**Common Use Cases:**
- **16-32px**: Favicons, small icons
- **48-64px**: UI icons, badges
- **96-128px**: User avatars, thumbnails
- **256-384px**: Card images, small hero sections

**How It Works:**
When you specify exact `width` and `height` (not using `sizes`), Next.js uses `imageSizes` to find the closest match.

**Example:**
```tsx
<Image
  src="avatar.jpg"
  width={96}
  height={96}
  // Uses 96 from imageSizes
/>
```

---

### `minimumCacheTTL: 60`

**Purpose:** Control how long optimized images are cached (in seconds).

**Settings:**
- **60 seconds** (current): Good for development and frequently updated content
- **3600 seconds** (1 hour): Recommended for production
- **86400 seconds** (1 day): For rarely changing images
- **31536000 seconds** (1 year): For immutable images with hash in URL

**Recommendation for Production:**
```javascript
minimumCacheTTL: 3600, // 1 hour
```

**Why Short TTL in Dev:**
- Content changes frequently during development
- Allows seeing image updates quickly
- Doesn't affect production performance (images cached by CDN)

---

## Remote Patterns Configuration

### Current Remote Patterns

```javascript
remotePatterns: [
  {
    protocol: 'https',
    hostname: 'firebasestorage.googleapis.com',
  },
  {
    protocol: 'https',
    hostname: 'lh3.googleusercontent.com',
  },
  {
    protocol: 'https',
    hostname: 'images.unsplash.com',
  },
]
```

### Pattern Details

**Firebase Storage:**
- **Domain:** `firebasestorage.googleapis.com`
- **Usage:** Blog images, project images, uploaded content
- **Example:** `https://firebasestorage.googleapis.com/v0/b/.../blog-images%2Fimage.png`

**Google User Content:**
- **Domain:** `lh3.googleusercontent.com`
- **Usage:** User profile pictures from Google OAuth
- **Example:** `https://lh3.googleusercontent.com/a/ACg8ocI...=s96-c`

**Unsplash:**
- **Domain:** `images.unsplash.com`
- **Usage:** Stock photos, placeholder images
- **Example:** `https://images.unsplash.com/photo-...`

---

## Performance Impact

### Before Configuration
- ⚠️ Warnings on every image load
- ❌ No explicit quality control
- ❌ Default device sizes only

### After Configuration
- ✅ No warnings (Next.js 16 ready)
- ✅ Explicit quality levels defined
- ✅ Optimized responsive images
- ✅ Modern format support (WebP, AVIF)
- ✅ Proper caching strategy

### Expected Improvements

**File Size Reduction:**
- WebP: 25-35% smaller than JPEG
- AVIF: 50% smaller than JPEG
- Quality 85: ~30% smaller than quality 100

**Example:**
- Original JPEG (quality 100): 500 KB
- WebP (quality 85): ~230 KB (54% reduction)
- AVIF (quality 85): ~175 KB (65% reduction)

**Load Time Improvement:**
On a typical 3G connection (750 Kbps):
- Original: 5.3 seconds
- WebP: 2.4 seconds (55% faster)
- AVIF: 1.9 seconds (64% faster)

---

## Usage Recommendations

### For Blog Posts
```tsx
<Image
  src={post.image}
  alt={post.title}
  width={1200}
  height={630}
  quality={85} // ✅ Configured in next.config.mjs
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
  priority={isFeatured}
/>
```

### For User Avatars
```tsx
<Image
  src={user.photoURL}
  alt={user.name}
  width={96}
  height={96}
  quality={85}
  className="rounded-full"
/>
```

### For Hero Images
```tsx
<Image
  src="/hero.jpg"
  alt="Hero"
  fill
  quality={90} // ✅ Higher quality for hero
  sizes="100vw"
  priority
  className="object-cover"
/>
```

### For Thumbnails
```tsx
<Image
  src={thumbnail}
  alt="Thumbnail"
  width={256}
  height={144}
  quality={75} // ✅ Lower quality acceptable for thumbnails
  sizes="(max-width: 768px) 50vw, 256px"
/>
```

---

## Migration Checklist

- [x] Add `qualities` array to `next.config.mjs`
- [x] Add `formats` for WebP/AVIF support
- [x] Configure `deviceSizes` for responsive images
- [x] Configure `imageSizes` for fixed-size images
- [x] Set `minimumCacheTTL` for caching strategy
- [x] Verify all remote patterns are whitelisted
- [ ] Update production `minimumCacheTTL` to 3600 (recommended)
- [ ] Test image loading on various devices
- [ ] Verify WebP/AVIF delivery in production

---

## Troubleshooting

### Image Quality Too Low
**Problem:** Images appear blurry or pixelated.
**Solution:** Increase quality in component:
```tsx
<Image quality={90} /> // or 95, 100
```

### Images Not Loading
**Problem:** "Invalid src prop" error.
**Solution:** Add domain to `remotePatterns` in `next.config.mjs`.

### Large File Sizes
**Problem:** Images are too large, slow to load.
**Solution:**
1. Lower quality: `quality={75}` instead of `quality={95}`
2. Ensure modern formats are enabled: `formats: ['image/webp', 'image/avif']`
3. Check browser is receiving WebP/AVIF (DevTools → Network → Type column)

### Warnings Still Appearing
**Problem:** Quality warnings persist after config.
**Solution:**
1. Restart Next.js dev server: `npm run dev`
2. Clear `.next` cache: `rm -rf .next`
3. Ensure quality value is in `qualities` array

---

## References

- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Next.js Image Configuration](https://nextjs.org/docs/app/api-reference/components/image#configuration)
- [Image Quality Warning](https://nextjs.org/docs/messages/next-image-unconfigured-qualities)
- [WebP Format](https://developers.google.com/speed/webp)
- [AVIF Format](https://jakearchibald.com/2020/avif-has-landed/)

---

**Last Updated:** 2025-10-18
**Status:** ✅ Next.js 16 ready
**Performance Impact:** Positive - optimized image delivery
