'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { BlogPost } from '@/lib/blog'
import { formatDate } from '@/lib/utils'
import { formatReadTime } from '@/utils/read-time'
import { ArrowLeft, Clock, Share2, Link2, Facebook, Linkedin, MessageCircle, X } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { UpvoteButton } from '@/components/upvote-button'
import { CommentSection } from '@/components/comments/comment-section'
import { clsx } from 'clsx'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'

const DEFAULT_AVATAR = '/images/default-avatar.png'

interface Props {
  post: BlogPost
}

export default function BlogPostClient({ post }: Props) {
  const router = useRouter()
  const { isAdmin } = useAuth()
  const [url, setUrl] = useState('')
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  useEffect(() => {
    setUrl(window.location.href)
  }, [])

  const shareOptions = [
    {
      name: 'Copy Link',
      icon: Link2,
      onClick: async () => {
        try {
          await navigator.clipboard.writeText(url)
          toast.success('Link copied to clipboard!')
        } catch (err) {
          toast.error('Failed to copy link')
        }
        setIsShareModalOpen(false)
      }
    },
    {
      name: 'X',
      icon: X,
      onClick: () => {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(url)}`, '_blank')
        setIsShareModalOpen(false)
      }
    },
    {
      name: 'Facebook',
      icon: Facebook,
      onClick: () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
        setIsShareModalOpen(false)
      }
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      onClick: () => {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank')
        setIsShareModalOpen(false)
      }
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      onClick: () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(`${post.title} ${url}`)}`, '_blank')
        setIsShareModalOpen(false)
      }
    }
  ]

  useEffect(() => {
    if (!post.published && !isAdmin) {
      router.push('/')
    }
  }, [post.published, isAdmin, router])

  if (!post.published && !isAdmin) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>
      </div>

      <article className="prose dark:prose-invert max-w-none">
        <header className="not-prose mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{post.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
            <div className="flex items-center gap-2">
              <Image
                src={post.author.image || DEFAULT_AVATAR}
                alt={post.author.name}
                width={24}
                height={24}
                className="rounded-full"
              />
              <span>{post.author.name}</span>
            </div>
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            {post.readTime && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatReadTime(post.readTime)}
                </span>
              </>
            )}
            <UpvoteButton postId={post.id} initialUpvotes={post.upvotes} />
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Share post"
            >
              <Share2 className="h-4 w-4" />
            </button>
            {!post.published && (
              <span className={clsx("px-2 py-1 text-xs font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20 rounded-full")}>
                Draft
              </span>
            )}
          </div>
        </header>

        {post.image && (
          <div className="not-prose mb-8">
            <div className="relative aspect-[2/1] max-h-[400px] overflow-hidden rounded-lg">
              <Image
                src={post.image}
                alt={post.imageAlt || post.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1000px"
                priority
              />
            </div>
          </div>
        )}

        <div className="prose dark:prose-invert max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({node, inline, className, children, ...props}) {
                const match = /language-(\w+)/.exec(className || '')
                return !inline && match ? (
                  <SyntaxHighlighter
                    {...props}
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code {...props} className={className}>
                    {children}
                  </code>
                )
              }
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>
      </article>

      <div className="my-16 border-t border-gray-100 dark:border-gray-800 pt-16">
        <CommentSection postId={post.id} />
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setIsShareModalOpen(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Share Post</h2>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <span className="sr-only">Close</span>
                ×
              </button>
            </div>
            <div className="space-y-2">
              {shareOptions.map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.name}
                    onClick={option.onClick}
                    className="w-full flex items-center gap-3 p-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Icon className="h-5 w-5" />
                    <span>{option.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
