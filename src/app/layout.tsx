import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AuthProvider } from '@/contexts/auth-context'

const geistSans = localFont({
  src: [
    {
      path: './fonts/GeistVF.woff',
      weight: '100 900',
      style: 'normal',
    }
  ],
  variable: "--font-geist-sans",
  display: 'swap',
  preload: true,
});

const geistMono = localFont({
  src: [
    {
      path: './fonts/GeistMonoVF.woff',
      weight: '100 900',
      style: 'normal',
    }
  ],
  variable: "--font-geist-mono",
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: "Emmanuel Fabiani - AI Engineer & Developer",
  description: "Personal portfolio and blog showcasing my work in AI and web development.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-white dark:bg-dark-900 text-gray-900 dark:text-gray-50`}
        suppressHydrationWarning
      >
        <Providers>
          <AuthProvider>
            {children}
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
