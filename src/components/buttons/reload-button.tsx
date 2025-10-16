'use client'

import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface ReloadButtonProps {
  className?: string
  children?: ReactNode
}

export function ReloadButton({ className, children }: ReloadButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className={cn(className)}
    >
      {children ?? 'Reload'}
    </button>
  )
}
