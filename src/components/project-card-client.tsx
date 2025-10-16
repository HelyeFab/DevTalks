'use client'

import { useRouter } from 'next/navigation'
import type { MouseEvent, KeyboardEvent, ReactNode } from 'react'

interface ProjectCardClientProps {
  slug: string
  children: ReactNode
}

// Minimal Client Component - only handles click navigation
export function ProjectCardClient({ slug, children }: ProjectCardClientProps) {
  const router = useRouter()

  const navigateToProject = () => {
    router.push(`/projects/${slug}`)
  }

  const isInteractiveTarget = (target: EventTarget | null): boolean => {
    return !!(target && (target as HTMLElement).closest('a, button, input, textarea, select, [data-card-link]'))
  }

  const handleCardClick = (event: MouseEvent<HTMLElement>) => {
    if (isInteractiveTarget(event.target)) {
      return
    }
    navigateToProject()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      if (isInteractiveTarget(event.target)) {
        return
      }
      event.preventDefault()
      navigateToProject()
    }
  }

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className="group bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-transform hover:-translate-y-1 cursor-pointer"
    >
      {children}
    </article>
  )
}
