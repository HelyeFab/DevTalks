/**
 * Resource hints components for optimizing resource loading
 * Includes preconnect, dns-prefetch, preload, and prefetch hints
 */

import React from 'react'

/**
 * Preconnect to external domains to reduce connection time
 * Use for domains that will definitely be used on the page
 */
export function PreconnectLinks() {
  return (
    <>
      {/* Firebase Storage for images */}
      <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
      <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />

      {/* Google User Content for profile images */}
      <link rel="preconnect" href="https://lh3.googleusercontent.com" />
      <link rel="dns-prefetch" href="https://lh3.googleusercontent.com" />

      {/* Google Fonts (if using external fonts) */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
    </>
  )
}

/**
 * Preload critical assets that will be used on the page
 */
export function PreloadCriticalAssets() {
  return (
    <>
      {/* Preload critical fonts */}
      {/* Note: Update paths based on your actual font files */}

      {/* Preload hero/LCP images if known */}
      {/* Example: <link rel="preload" as="image" href="/images/hero.webp" /> */}
    </>
  )
}

/**
 * Prefetch resources for next likely navigation
 * Use sparingly - only for high-probability next pages
 */
interface PrefetchLinksProps {
  hrefs?: string[]
}

export function PrefetchLinks({ hrefs = [] }: PrefetchLinksProps) {
  if (hrefs.length === 0) return null

  return (
    <>
      {hrefs.map((href) => (
        <link key={href} rel="prefetch" href={href} />
      ))}
    </>
  )
}

/**
 * Preload images that will appear above the fold
 */
interface PreloadImagesProps {
  images: Array<{
    src: string
    type?: string
    media?: string
  }>
}

export function PreloadImages({ images }: PreloadImagesProps) {
  if (images.length === 0) return null

  return (
    <>
      {images.map((image, index) => (
        <link
          key={`${image.src}-${index}`}
          rel="preload"
          as="image"
          href={image.src}
          type={image.type}
          media={image.media}
        />
      ))}
    </>
  )
}

/**
 * Module preload for JavaScript chunks
 * Useful for critical route segments
 */
interface PreloadModulesProps {
  modules?: string[]
}

export function PreloadModules({ modules = [] }: PreloadModulesProps) {
  if (modules.length === 0) return null

  return (
    <>
      {modules.map((module) => (
        <link key={module} rel="modulepreload" href={module} />
      ))}
    </>
  )
}

/**
 * Complete resource hints setup for optimal performance
 */
export function ResourceHints() {
  return (
    <>
      <PreconnectLinks />
      <PreloadCriticalAssets />
    </>
  )
}
