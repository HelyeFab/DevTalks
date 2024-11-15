'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Post } from '@/types/blog'
import { formatDate } from '@/lib/utils'
import { useState } from 'react'

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const [imageLoading, setImageLoading] = useState(true)

  return (
    <Link href={`/blog/${post.slug}`} className="group">
      <article className="flex flex-col overflow-hidden rounded-lg border border-gray-200 dark:border-dark-800 hover:border-primary-500 dark:hover:border-primary-500 transition-colors">
        <div className="relative aspect-[16/9] w-full bg-gray-100 dark:bg-dark-800">
          {post.image ? (
            <>
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-dark-800">
                  <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <Image
                src={post.image}
                alt={post.imageAlt || post.title}
                fill
                className={`object-cover transition-all duration-300 ${
                  imageLoading ? 'opacity-0' : 'opacity-100 group-hover:scale-105'
                }`}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                loading="lazy"
                onLoadingComplete={() => setImageLoading(false)}
              />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-600">
              No cover image
            </div>
          )}
        </div>

        <div className="flex flex-col flex-grow p-6">
          <div className="flex-grow">
            <h2 className="text-xl font-semibold mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400">
              {post.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
              {post.excerpt}
            </p>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Image
                src={post.author.image}
                alt={`${post.author.name}'s avatar`}
                width={24}
                height={24}
                className="rounded-full"
                loading="lazy"
              />
              <span>{post.author.name}</span>
            </div>
            <time dateTime={post.date}>{formatDate(post.date)}</time>
          </div>

          {!post.published && (
            <div className="mt-4 flex items-center gap-2">
              <span className="px-2 py-1 text-xs font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                Draft
              </span>
            </div>
          )}
        </div>
      </article>
    </Link>
  )
}
