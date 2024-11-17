import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { Clock } from 'lucide-react'
import type { BlogPost } from '@/types/blog'
import { formatReadTime } from '@/utils/read-time'

export function BlogPostCard({ post }: { post: BlogPost }) {
  return (
    <article className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <Link href={`/blog/${post.slug}`} className="block">
        <div className="relative aspect-[16/9] w-full">
          <Image
            src={post.author.image}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="p-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
            <time dateTime={post.date}>
              {format(new Date(post.date), 'MMMM d, yyyy')}
            </time>
            <span>•</span>
            <span>{post.author.name}</span>
            {post.readTime && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatReadTime(post.readTime)}
                </span>
              </>
            )}
          </div>
          <h2 className="text-2xl font-bold mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {post.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {post.excerpt}
          </p>
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-sm bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100 px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </article>
  )
}
