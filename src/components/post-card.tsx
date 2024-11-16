'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import type { BlogPost } from '@/types/blog'

interface Props {
  post: BlogPost
}

export function PostCard({ post }: Props) {
  const router = useRouter()

  const handleCardClick = () => {
    router.push(`/blog/${post.slug}`)
  }

  return (
    <article 
      onClick={handleCardClick}
      className="group bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-transform hover:-translate-y-1 cursor-pointer"
    >
      <div className="relative aspect-[16/9] w-full">
        {post.image ? (
          <Image
            src={post.image}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
            <span className="text-gray-400 dark:text-gray-500">No image</span>
          </div>
        )}
      </div>
      <div className="p-6">
        <h3 className="text-2xl font-bold mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {post.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {post.excerpt}
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="text-sm bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100 px-2 py-1 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Image
              src={post.author.image || '/images/default-avatar.png'}
              alt={`${post.author.name}'s avatar`}
              width={24}
              height={24}
              className="rounded-full"
            />
            <span>{post.author.name}</span>
          </div>
          <time dateTime={post.date}>{format(new Date(post.date), 'MMM d, yyyy')}</time>
        </div>
      </div>
    </article>
  )
}
