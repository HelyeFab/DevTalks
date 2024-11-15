'use client'

import Link from 'next/link'
import { BlogPost } from '@/lib/blog'
import { format } from 'date-fns'

interface BlogListProps {
  posts: BlogPost[]
}

export function BlogList({ posts }: BlogListProps) {
  return (
    <div className="space-y-16">
      {posts.map((post) => (
        <article key={post.slug} className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              <Link
                href={`/blog/${post.slug}`}
                className="hover:text-primary-600 dark:hover:text-primary-400"
              >
                {post.title}
              </Link>
            </h2>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <time dateTime={post.date}>
                {format(new Date(post.date), 'MMMM d, yyyy')}
              </time>
              <div className="flex items-center gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-gray-100 dark:bg-dark-800 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {post.excerpt && (
            <p className="text-gray-600 dark:text-gray-400">{post.excerpt}</p>
          )}
          <div className="flex items-center gap-4">
            <Link
              href={`/blog/${post.slug}`}
              className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
            >
              Read more →
            </Link>
          </div>
        </article>
      ))}
    </div>
  )
}
