'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { upvotePost, hasUserUpvoted } from '@/lib/blog'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'

interface UpvoteButtonProps {
  postId: string
  initialUpvotes: number
}

export function UpvoteButton({ postId, initialUpvotes }: UpvoteButtonProps) {
  const { user } = useAuth()
  const [upvotes, setUpvotes] = useState(initialUpvotes)
  const [isUpvoting, setIsUpvoting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)

  useEffect(() => {
    // Check if user has already upvoted this post
    const checkUpvoteStatus = async () => {
      if (user) {
        const voted = await hasUserUpvoted(postId, user.uid)
        setHasVoted(voted)
      }
    }
    checkUpvoteStatus()
  }, [postId, user])

  const handleUpvote = async () => {
    if (!user) return
    if (hasVoted || isUpvoting) return

    try {
      setIsUpvoting(true)
      await upvotePost(postId, user.uid)
      setUpvotes(prev => prev + 1)
      setHasVoted(true)
    } catch (error) {
      console.error('Error upvoting post:', error)
    } finally {
      setIsUpvoting(false)
    }
  }

  if (!user) {
    return (
      <Link
        href="/auth/signin"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        <Heart className="h-4 w-4" />
        <span className="text-sm font-medium">{upvotes}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">(Sign in to upvote)</span>
      </Link>
    )
  }

  return (
    <button
      onClick={handleUpvote}
      disabled={hasVoted || isUpvoting}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
        hasVoted
          ? 'bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-pink-50 dark:hover:bg-pink-900/10 hover:text-pink-600 dark:hover:text-pink-400'
      }`}
      title={hasVoted ? 'Already upvoted' : 'Upvote this post'}
    >
      <Heart
        className={`h-4 w-4 ${
          hasVoted ? 'fill-current' : 'fill-transparent'
        } ${isUpvoting ? 'animate-pulse' : ''}`}
      />
      <span className="text-sm font-medium">{upvotes}</span>
    </button>
  )
}
