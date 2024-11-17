import type { Metadata } from "next";
import { Lobster, Cabin } from 'next/font/google'
import "./globals.css";
import { Providers } from "@/components/providers";
import { AuthProvider } from '@/contexts/auth-context'
import { FloatingSearchButton } from '@/components/search/floating-search-button'
import { Toaster } from 'sonner'

const lobster = Lobster({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-lobster',
})

const cabin = Cabin({
  subsets: ['latin'],
  variable: '--font-cabin',
})

export const metadata: Metadata = {
  title: {
    default: 'iTalkDevs',
    template: '%s | iTalkDevs'
  },
  description: 'A blog about software development, technology, and everything in between.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body 
        className={`${cabin.variable} ${lobster.variable} font-cabin m-0 antialiased min-h-screen bg-gray-50 dark:bg-dark-900 text-gray-900 dark:text-gray-50`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <Providers>
            <main className="flex min-h-screen flex-col">
              {children}
            </main>
            <FloatingSearchButton />
            <Toaster richColors position="bottom-right" />
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
