'use client'

import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col pt-[73px]">
      <Header />
      <main className="flex-grow">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  )
}
