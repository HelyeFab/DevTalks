'use client'

import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

// Client Component - wraps app with layout components that need client-side interactivity
// Auth state is managed by AuthProvider in layout.tsx, no need to duplicate here
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  )
}
