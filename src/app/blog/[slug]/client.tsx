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
    <article className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Blog
        </Link>
      </div>

      <header className="mb-8">
        <h1 className="text-3xl font-bold sm:text-4xl">{post.title}</h1>
        {post.subtitle && (
          <p className="mt-3 text-xl text-gray-600 dark:text-gray-400">
            {post.subtitle}
          </p>
        )}
        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            {post.author.image ? (
              <Image
                src={post.author.image}
                alt={post.author.name}
                width={24}
                height={24}
                className="rounded-full"
              />
            ) : (
              <div className="h-6 w-6 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs">
                {post.author.name[0]}
              </div>
            )}
            <span>{post.author.name}</span>
          </div>
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <UpvoteButton postId={post.id!} initialUpvotes={post.upvotes || 0} />
        </div>
      </header>

      {post.image && (
        <div className="relative mb-8 aspect-[2/1] overflow-hidden rounded-lg">
          <Image
            src={post.image}
            alt={post.imageAlt || post.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      <div className="prose dark:prose-invert max-w-none">
        <Markdown content={post.content} />
      </div>
    </article>
  )
}
