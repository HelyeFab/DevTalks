import { getPostBySlug } from '@/lib/blog'
import BlogPostClient from './client'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

type Props = {
  params: { slug: string }
}

// Make the route dynamic
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Generate metadata for the page
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const post = await getPostBySlug(params.slug)
    if (!post) {
      console.log('Post not found for metadata:', params.slug)
      return { title: 'Post Not Found' }
    }

    return {
      title: post.title,
      description: post.excerpt,
      openGraph: {
        title: post.title,
        description: post.excerpt,
        images: post.image ? [post.image] : [],
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return { title: 'Error' }
  }
}

export default async function BlogPost({ params }: Props) {
  try {
    console.log('Processing blog post:', params.slug)

    const post = await getPostBySlug(params.slug)
    if (!post) {
      console.error('Post not found:', params.slug)
      notFound()
    }

    console.log('Post fetched successfully:', { 
      slug: post.slug,
      hasImage: !!post.image 
    })

    return <BlogPostClient post={post} />
  } catch (error) {
    console.error('Error fetching post:', error)
    notFound()
  }
}
