'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import type { BlogPost } from '@/types/blog'
import { Clock } from 'lucide-react'
import { formatReadTime } from '@/utils/read-time'

interface Props {
  post: BlogPost
}

export function PostCard({ post }: Props) {
  const router = useRouter()

  const handleCardClick = () => {
    router.push(`/blog/${post.slug}`)
  }

  // Format date safely
  const formattedDate = post.date ? format(new Date(post.date), 'MMMM d, yyyy') : 'No date'
  
  // Get the full URL for sharing
  const postUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/blog/${post.slug}`
    : `/blog/${post.slug}`

  return (
    <article 
      onClick={handleCardClick}
      className="group bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer h-48"
    >
      <div className="flex h-full">
        <div className="w-1/3">
          <div className="relative h-full">
            {post.image ? (
              <Image
                src={post.image}
                alt={post.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                <span className="text-gray-400 dark:text-gray-500">No image</span>
              </div>
            )}
          </div>
        </div>
        <div className="w-2/3 p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
              {post.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
              {post.excerpt}
            </p>
            <div className="flex flex-wrap gap-1 mb-2">
              {post.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100 px-2 py-0.5 rounded"
                >
                  {tag}
                </span>
              ))}
              {post.tags.length > 2 && (
                <span className="text-xs text-gray-500">+{post.tags.length - 2} more</span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              {post.author.image && (
                <Image
                  src={post.author.image}
                  alt={post.author.name}
                  width={20}
                  height={20}
                  className="rounded-full"
                />
              )}
              <span className="font-semibold">{post.author.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <time dateTime={post.date} className="text-sm">{formattedDate}</time>
              {post.readTime && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-sm">
                    <Clock className="h-4 w-4" />
                    {formatReadTime(post.readTime)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
