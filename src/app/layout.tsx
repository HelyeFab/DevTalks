import type { Metadata } from "next";
import { Lobster, Cabin } from 'next/font/google'
import "./globals.css";
import { Providers } from "@/components/providers";
import { AuthProvider } from '@/contexts/auth-context'
import { AdminProvider } from '@/contexts/admin-context'
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
  description: 'A blog about software development and tech.',
}

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
        <Providers>
          <AuthProvider>
            <AdminProvider>
              {children}
              <FloatingSearchButton />
              <Toaster richColors position="bottom-right" />
            </AdminProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
