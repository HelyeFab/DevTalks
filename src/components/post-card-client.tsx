'use client'

import { useRouter } from 'next/navigation'
import type { MouseEvent, KeyboardEvent, ReactNode } from 'react'

interface PostCardClientProps {
  slug: string
  children: ReactNode
}

// Minimal Client Component - only handles click navigation
export function PostCardClient({ slug, children }: PostCardClientProps) {
  const router = useRouter()

  const navigateToPost = () => {
    router.push(`/blog/${slug}`)
  }

  const isInteractiveTarget = (target: EventTarget | null): boolean => {
    return !!(target && (target as HTMLElement).closest('a, button, input, textarea, select, [data-card-link]'))
  }

  const handleCardClick = (event: MouseEvent<HTMLElement>) => {
    if (isInteractiveTarget(event.target)) {
      return
    }
    navigateToPost()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      if (isInteractiveTarget(event.target)) {
        return
      }
      event.preventDefault()
      navigateToPost()
    }
  }

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className="group bg-card rounded-lg overflow-hidden shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer h-48 border border-border"
    >
      {children}
    </article>
  )
}
