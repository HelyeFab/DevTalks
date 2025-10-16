'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { hasUserUpvoted } from '@/lib/blog'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'
import { toast } from 'sonner'

interface UpvoteButtonProps {
  postId: string
  initialUpvotes: number
  size?: 'small' | 'medium' | 'large'
  showCount?: boolean
  className?: string
}

export function UpvoteButton({
  postId,
  initialUpvotes = 0,
  size = 'medium',
  showCount = true,
  className = ''
}: UpvoteButtonProps) {
  const { user, loading } = useAuth()
  const [upvotes, setUpvotes] = useState(initialUpvotes || 0)
  const [isUpvoting, setIsUpvoting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)

  const iconSizes = {
    small: 'h-3 w-3',
    medium: 'h-4 w-4',
    large: 'h-5 w-5'
  }

  const buttonSizes = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-4 py-2 text-sm',
    large: 'px-5 py-2.5 text-base'
  }

  useEffect(() => {
    // Check if user has already upvoted this post
    const checkUpvoteStatus = async () => {
      if (user?.uid) {
        try {
          const voted = await hasUserUpvoted(postId, user.uid)
          setHasVoted(voted)
        } catch (error) {
          console.error('Error checking upvote status:', error)
        }
      }
    }

    if (!loading) {
      checkUpvoteStatus()
    }
  }, [postId, user, loading])

  const handleUpvote = async () => {
    if (!user?.uid) return
    if (isUpvoting) return

    try {
      setIsUpvoting(true)
      const response = await fetch(`/api/posts/${postId}/upvote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to update upvote')
      }

      const data = await response.json()
      setUpvotes(data.upvotes)
      setHasVoted(data.upvoted)

      toast.success(data.upvoted ? 'Post upvoted!' : 'Upvote removed')
    } catch (error) {
      console.error('Error toggling upvote:', error)
      toast.error('Failed to update upvote')
    } finally {
      setIsUpvoting(false)
    }
  }

  if (!user) {
    return (
      <Link
        href="/auth/signin"
        className={`inline-flex items-center gap-2 ${buttonSizes[size]} rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${className}`}
      >
        <Heart className={iconSizes[size]} />
        {showCount && <span>{upvotes}</span>}
      </Link>
    )
  }

  return (
    <button
      onClick={handleUpvote}
      disabled={isUpvoting}
      aria-label={hasVoted ? "Remove upvote" : "Upvote this post"}
      className={`inline-flex items-center gap-2 ${buttonSizes[size]} rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <Heart
        className={`${iconSizes[size]} ${
          hasVoted ? 'fill-current text-red-500' : 'text-current'
        } transition-colors duration-300`}
      />
      {showCount && <span>{upvotes}</span>}
    </button>
  )
}
