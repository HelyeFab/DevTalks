import type { Metadata } from "next";
import localFont from 'next/font/local'
import "./globals.css";
import { Providers } from "@/components/providers";
import { AuthProvider } from '@/contexts/auth-context'
import { AdminProvider } from '@/contexts/admin-context'
import { FloatingSearchButton } from '@/components/search/floating-search-button'
import { Toaster } from 'sonner'
import { SITE_CONFIG } from '@/lib/seo/utils'
import { ResourceHints } from '@/lib/performance/resource-hints'
import { WebVitalsReporter } from '@/components/web-vitals-reporter'
import { logVersionInfo } from '@/lib/version'

// Log version information on startup
if (typeof window === 'undefined') {
  logVersionInfo()
}

const mulish = localFont({
  src: [
    {
      path: '../../public/fonts/mulish/Mulish-VariableFont_wght.ttf',
      weight: '100 900',
      style: 'normal',
    },
    {
      path: '../../public/fonts/mulish/Mulish-Italic-VariableFont_wght.ttf',
      weight: '100 900',
      style: 'italic',
    },
  ],
  variable: '--font-mulish',
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: SITE_CONFIG.name,
    template: `%s | ${SITE_CONFIG.name}`
  },
  description: SITE_CONFIG.description,
  applicationName: SITE_CONFIG.name,
  keywords: [
    'software development',
    'web development',
    'programming',
    'technology',
    'blog',
    'tutorials',
    'coding',
    'javascript',
    'typescript',
    'react',
    'nextjs',
    'node.js',
    'frontend',
    'backend',
    'fullstack',
    'developer community',
    'tech blog',
  ],
  authors: [
    { name: SITE_CONFIG.author, url: SITE_CONFIG.url },
  ],
  creator: SITE_CONFIG.author,
  publisher: SITE_CONFIG.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: SITE_CONFIG.locale,
    url: SITE_CONFIG.url,
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    siteName: SITE_CONFIG.name,
    images: [
      {
        url: `${SITE_CONFIG.url}/api/og`,
        width: 1200,
        height: 630,
        alt: SITE_CONFIG.name,
        type: 'image/png',
      },
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: `${SITE_CONFIG.name} - Fallback`,
        type: 'image/jpeg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: SITE_CONFIG.twitterHandle,
    creator: SITE_CONFIG.twitterHandle,
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    images: [
      {
        url: `${SITE_CONFIG.url}/api/og`,
        alt: SITE_CONFIG.name,
      },
    ],
  },
  alternates: {
    canonical: SITE_CONFIG.url,
    languages: {
      'en-US': SITE_CONFIG.url,
      'x-default': SITE_CONFIG.url,
    },
    types: {
      'application/rss+xml': [
        { url: `${SITE_CONFIG.url}/feed.xml`, title: `${SITE_CONFIG.name} RSS Feed` },
      ],
      'application/atom+xml': [
        { url: `${SITE_CONFIG.url}/atom.xml`, title: `${SITE_CONFIG.name} Atom Feed` },
      ],
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  other: {
    'application/opensearchdescription+xml': `${SITE_CONFIG.url}/opensearch.xml`,
    'msapplication-TileColor': '#3b82f6',
    'theme-color': '#ffffff',
  },
  verification: {
    // Add verification tokens when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
    // other: {
    //   'facebook-domain-verification': 'your-facebook-verification-code',
    //   'pinterest-site-verification': 'your-pinterest-verification-code',
    // },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ResourceHints />
      </head>
      <body
        className={`${mulish.variable} font-sans m-0 antialiased min-h-screen bg-background text-foreground`}
        suppressHydrationWarning
      >
        <Providers>
          <AuthProvider>
            <AdminProvider>
              {children}
              <FloatingSearchButton />
              <Toaster richColors position="bottom-right" />
            </AdminProvider>
          </AuthProvider>
        </Providers>
        <WebVitalsReporter />
      </body>
    </html>
  );
}
