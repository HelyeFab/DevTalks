import { getPostBySlug } from '@/lib/blog'
import BlogPostClient from './client'
import { notFound } from 'next/navigation'

interface Props {
  params: {
    slug: string
  }
}

export default async function BlogPost({ params }: Props) {
  try {
    const post = await getPostBySlug(params.slug)
    if (!post) {
      notFound()
    }
    return <BlogPostClient post={post} />
  } catch (error) {
    console.error('Error loading post:', error)
    notFound()
  }
}
