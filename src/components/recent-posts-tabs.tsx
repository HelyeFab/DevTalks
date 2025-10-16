'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Clock, Heart } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { BlogPost } from '@/types/blog'
import { clsx } from 'clsx'

// Helper function to strip HTML tags from text
function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim()
}

interface RecentPostsTabsProps {
  recentPosts: BlogPost[]
  mostLikedPosts: BlogPost[]
}

type TabType = 'recent' | 'liked'

// Client Component - only handles tab state and rendering
export function RecentPostsTabs({ recentPosts, mostLikedPosts }: RecentPostsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('recent')

  const displayPosts = activeTab === 'recent' ? recentPosts : mostLikedPosts

  return (
    <>
      {/* Tabs */}
      <div className="flex items-center gap-4 mb-4 border-b border-border">
        <button
          onClick={() => setActiveTab('recent')}
          className={clsx(
            'flex items-center gap-2 pb-2 text-sm font-medium transition-colors relative',
            activeTab === 'recent'
              ? 'text-primary border-b-2 border-primary -mb-px'
              : 'text-muted-foreground hover:text-foreground'
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
              ? 'text-primary border-b-2 border-primary -mb-px'
              : 'text-muted-foreground hover:text-foreground'
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
            className="border-b border-border last:border-0 pb-3 last:pb-0"
          >
            <Link
              href={`/blog/${post.slug}`}
              className="block group"
            >
              <h3 className="font-medium mb-1 group-hover:text-primary transition-colors">
                {post.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                {post.excerpt ? stripHtmlTags(post.excerpt) : ''}
              </p>
              <div className="flex items-center justify-between">
                <time className="text-xs text-muted-foreground">
                  {format(parseISO(post.date), 'MMM dd, yyyy')}
                </time>
                {activeTab === 'liked' && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {post.upvotes || 0}
                  </span>
                )}
              </div>
            </Link>
          </div>
        ))}
      </div>
    </>
  )
}
