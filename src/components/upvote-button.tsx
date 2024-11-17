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
  const { user, loading } = useAuth()
  const [upvotes, setUpvotes] = useState(initialUpvotes)
  const [isUpvoting, setIsUpvoting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)

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
        <span>{upvotes}</span>
      </Link>
    )
  }

  return (
    <button
      onClick={handleUpvote}
      disabled={isUpvoting || hasVoted}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Heart
        className={`h-4 w-4 ${
          hasVoted ? 'fill-current text-red-500' : 'text-current'
        }`}
      />
      <span>{upvotes}</span>
    </button>
  )
}
