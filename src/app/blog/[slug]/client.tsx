'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { BlogPost } from '@/lib/blog'
import { Markdown } from '@/components/markdown'
import { formatDate } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { UpvoteButton } from '@/components/upvote-button'
import { CommentSection } from '@/components/comments/comment-section'
import { clsx } from 'clsx'

const DEFAULT_AVATAR = '/images/default-avatar.svg'

interface Props {
  post: BlogPost
}

export default function BlogPostClient({ post }: Props) {
  const router = useRouter()
  const { isAdmin } = useAuth()

  useEffect(() => {
    if (!post.published && !isAdmin) {
      router.push('/')
    }
  }, [post, isAdmin, router])

  return (
    <article className="container mx-auto px-4 max-w-6xl py-12">
      <div className="mb-12">
        <Link
          href="/"
          className={clsx("inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-8")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to posts
        </Link>

        <h1 className={clsx("text-4xl font-bold mb-4")}>{post.title}</h1>

        <div className={clsx("flex items-center gap-4 text-gray-600 dark:text-gray-400 mb-8")}>
          <div className={clsx("flex items-center gap-2")}>
            {post.author.image ? (
              <Image
                src={post.author.image}
                alt={post.author.name}
                width={24}
                height={24}
                className={clsx("rounded-full")}
                style={{ width: '24px', height: '24px' }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = DEFAULT_AVATAR;
                  target.onerror = null; // Prevent infinite loop
                }}
              />
            ) : (
              <Image
                src={DEFAULT_AVATAR}
                alt={post.author.name}
                width={24}
                height={24}
                className={clsx("rounded-full")}
                style={{ width: '24px', height: '24px' }}
              />
            )}
            <span>{post.author.name}</span>
          </div>
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <UpvoteButton postId={post.id} initialUpvotes={post.upvotes} />
          {!post.published && (
            <span className={clsx("px-2 py-1 text-xs font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20 rounded-full")}>
              Draft
            </span>
          )}
        </div>

        {post.image && (
          <div className={clsx("relative aspect-[2/1] mb-8")}>
            <Image
              src={post.image}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              className={clsx("object-cover rounded-lg")}
              priority
            />
          </div>
        )}
      </div>

      <div className={clsx("prose dark:prose-invert max-w-none mb-16")}>
        <Markdown>{post.content}</Markdown>
      </div>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className={clsx("flex flex-wrap gap-2 mb-16")}>
          {post.tags.map((tag) => (
            <span
              key={tag}
              className={clsx("px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm")}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Comments Section */}
      {post.published && (
        <section className={clsx("mt-16")}>
          <CommentSection postId={post.id} />
        </section>
      )}
    </article>
  )
}
