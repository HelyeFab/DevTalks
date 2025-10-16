'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface GoBackButtonProps {
  className?: string
  children?: ReactNode
}

export function GoBackButton({ className, children }: GoBackButtonProps) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={cn(className)}
    >
      {children ?? 'Go back'}
    </button>
  )
}
