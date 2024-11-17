'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Clock, Heart } from 'lucide-react'
import type { BlogPost } from '@/types/blog'
import { clsx } from 'clsx'

interface RecentPostsProps {
  posts: BlogPost[]
}

type TabType = 'recent' | 'liked'

export function RecentPosts({ posts }: RecentPostsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('recent')

  const sortedPosts = activeTab === 'recent'
    ? [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [...posts].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))

  const displayPosts = sortedPosts.slice(0, 3)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      {/* Tabs */}
      <div className="flex items-center gap-4 mb-4 border-b border-gray-100 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('recent')}
          className={clsx(
            'flex items-center gap-2 pb-2 text-sm font-medium transition-colors relative',
            activeTab === 'recent'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400 -mb-px'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          )}
        >
          <Clock className="h-4 w-4" />
          Recent Posts
        </button>
        <button
          onClick={() => setActiveTab('liked')}
          className={clsx(
            'flex items-center gap-2 pb-2 text-sm font-medium transition-colors relative',
            activeTab === 'liked'
              ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400 -mb-px'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          )}
        >
          <Heart className="h-4 w-4" />
          Most Liked
        </button>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {displayPosts.map((post) => (
          <div
            key={post.slug}
            className="border-b border-gray-100 dark:border-gray-700 last:border-0 pb-3 last:pb-0"
          >
            <Link
              href={`/blog/${post.slug}`}
              className="block group"
            >
              <h3 className="font-medium mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {post.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-1">
                {post.excerpt}
              </p>
              <div className="flex items-center justify-between">
                <time className="text-xs text-gray-500 dark:text-gray-500">
                  {new Date(post.date).toLocaleDateString()}
                </time>
                {activeTab === 'liked' && (
                  <span className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {post.upvotes || 0}
                  </span>
                )}
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
